import fs from "fs";
import xlsx from "xlsx";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "#models/User.js";
import Account from "#models/Account.js";
import GovtProof from "#models/GovtProof.js";
import Organization from "#models/Organization.js";
import Team from "#models/Team.js";

const insertByExcel = asyncHandler(
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);

        // Delete file after processing
        fs.unlinkSync(filePath);

        const requiredFields = [
            "name",
            "email",
            "phone",
            "employeeId",
            "organizationId",
            "dateOfJoining",
            "role"
        ];

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validRoles = ["admin", "user"];
        const validGenders = ["male", "female", "other"];
        const validRolesInTeam = ["manager", "teamLead", "member"];

        const failedRecords = [];
        const successfulRecords = [];

        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            const rowNumber = i + 2;
            let validationError = null;

            // Validate required fields
            for (const field of requiredFields) {
                if (
                    row[field] === undefined ||
                    row[field] === null ||
                    (typeof row[field] === "string" && row[field].trim() === "")
                ) {
                    validationError = `Required field "${field}" is missing or empty`;
                    break;
                }
            }

            if (validationError) {
                failedRecords.push({
                    error: validationError,
                    rowNumber,
                    rowData: row
                });
                continue;
            }

            // Validate email format
            const email = String(row.email).trim();
            if (!emailRegex.test(email)) {
                failedRecords.push({
                    error: "Invalid email format",
                    rowNumber,
                    rowData: row
                });
                continue;
            }

            // Validate role enum
            const role = String(row.role).toLowerCase();
            if (!validRoles.includes(role)) {
                failedRecords.push({
                    error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
                    rowNumber,
                    rowData: row
                });
                continue;
            }

            // Validate gender enum if provided
            if (row.gender) {
                const gender = String(row.gender).toLowerCase();
                if (!validGenders.includes(gender)) {
                    failedRecords.push({
                        error: `Invalid gender. Must be one of: ${validGenders.join(", ")}`,
                        rowNumber,
                        rowData: row
                    });
                    continue;
                }
            }

            // Validate roleInTeam enum if provided
            if (row.roleInTeam && !validRolesInTeam.includes(row.roleInTeam)) {
                failedRecords.push({
                    error: `Invalid roleInTeam. Must be one of: ${validRolesInTeam.join(", ")}`,
                    rowNumber,
                    rowData: row
                });
                continue;
            }

            // Validate salary if provided
            if (row.salary !== undefined && row.salary !== null && row.salary !== "") {
                const salaryNum = Number(row.salary);
                if (isNaN(salaryNum) || salaryNum < 0) {
                    failedRecords.push({
                        error: "Invalid salary value",
                        rowNumber,
                        rowData: row
                    });
                    continue;
                }
            }

            // Validate dateOfJoining is not a future date
            const dojDate = new Date(row.dateOfJoining);
            if (isNaN(dojDate.getTime())) {
                failedRecords.push({
                    error: "Invalid date of joining",
                    rowNumber,
                    rowData: row
                });
                continue;
            }
            if (dojDate > new Date()) {
                failedRecords.push({
                    error: "Date of joining cannot be a future date",
                    rowNumber,
                    rowData: row
                });
                continue;
            }

            // Validate date of birth if provided
            if (row.dob) {
                const dobDate = new Date(row.dob);
                if (isNaN(dobDate.getTime())) {
                    failedRecords.push({
                        error: "Invalid date of birth",
                        rowNumber,
                        rowData: row
                    });
                    continue;
                }
                if (dobDate > new Date()) {
                    failedRecords.push({
                        error: "Date of birth cannot be a future date",
                        rowNumber,
                        rowData: row
                    });
                    continue;
                }
            }

            // Validate GovtProof fields if any is provided
            if (row.aadhaar || row.pan || row.bankId || row.passport) {
                if (!row.aadhaar || !row.pan || !row.bankId) {
                    failedRecords.push({
                        error: "If providing government proof, aadhaar, pan, and bankId are all required",
                        rowNumber,
                        rowData: row
                    });
                    continue;
                }
            }

            // Check if organization exists
            const organization = await Organization.findById(row.organizationId);
            if (!organization) {
                failedRecords.push({
                    error: `Organization with ID '${row.organizationId}' not found`,
                    rowNumber,
                    rowData: row
                });
                continue;
            }

            // Check if team exists (if teamId provided)
            if (row.teamId) {
                const team = await Team.findOne({
                    _id: row.teamId,
                    organizationId: row.organizationId
                });
                if (!team) {
                    failedRecords.push({
                        error: `Team with ID '${row.teamId}' not found in organization`,
                        rowNumber,
                        rowData: row
                    });
                    continue;
                }
            }

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [
                    { email: email },
                    { phone: String(row.phone).trim() },
                    { employeeId: String(row.employeeId).trim() }
                ]
            });

            if (existingUser) {
                failedRecords.push({
                    error: "User already exists with this email, phone, or employeeId",
                    rowNumber,
                    rowData: row
                });
                continue;
            }

            // Check if account already exists
            const existingAccount = await Account.findOne({ email: email });
            if (existingAccount) {
                failedRecords.push({
                    error: "Account already exists with this email",
                    rowNumber,
                    rowData: row
                });
                continue;
            }

            // Use transaction for atomicity
            // const session = await mongoose.startSession();
            // session.startTransaction();

            try {
                // Prepare user data
                const userData = {
                    name: String(row.name).trim(),
                    email: email,
                    phone: String(row.phone).trim(),
                    employeeId: String(row.employeeId).trim(),
                    organizationId: row.organizationId,
                    dateOfJoining: new Date(dojDate.toISOString().split('T')[0])
                };

                // Add optional user fields
                if (row.gender) userData.gender = String(row.gender).toLowerCase();
                if (row.salary !== undefined && row.salary !== null && row.salary !== "") {
                    userData.salary = Number(row.salary);
                }
                if (row.dob) {
                    const dobOnly = new Date(new Date(row.dob).toISOString().split('T')[0]);
                    userData.dob = dobOnly;
                }
                if (row.address) userData.address = String(row.address).trim();
                if (row.teamId) userData.teamId = row.teamId;
                if (row.roleInTeam) userData.roleInTeam = row.roleInTeam;
                if (row.isActive !== undefined) userData.isActive = Boolean(row.isActive);

                // Create user
                const [newUser] = await User.create([userData], { session });

                // Create account with password
                const password = process.env.USER_DEFAULT_PASSWORD || "WorkPing@123";
                const hashedPassword = await bcrypt.hash(password, 10);

                const accountData = {
                    role: role,
                    email: email,
                    password: hashedPassword,
                    emailVerified: false
                };

                await Account.create([accountData], { session });

                // Create government proof if provided
                if (row.aadhaar && row.pan && row.bankId) {
                    const govtProofData = {
                        aadhaarNumber: String(row.aadhaar).trim(),
                        panNumber: String(row.pan).trim(),
                        bankAccount: String(row.bankId).trim(),
                        userId: newUser._id
                    };

                    if (row.passport) govtProofData.passportNumber = String(row.passport).trim();

                    await GovtProof.create([govtProofData], { session });
                }

                // Commit transaction
                // await session.commitTransaction();
                // session.endSession();

                successfulRecords.push({
                    rowNumber,
                    employeeId: newUser.employeeId,
                    email: newUser.email,
                    name: newUser.name
                });

            } catch (error) {
                // Rollback transaction on error
                // await session.abortTransaction();
                // session.endSession();

                failedRecords.push({
                    error: error.message || "Database error occurred",
                    rowNumber,
                    rowData: row
                });
            }
        }

        const successCount = successfulRecords.length;
        const failedCount = failedRecords.length;
        const totalCount = jsonData.length;

        if (failedCount === 0) {
            return res.status(201).json({
                message: "All employees added successfully",
                count: {
                    total: totalCount,
                    successful: successCount,
                    failed: failedCount
                },
                successfulRecords
            });
        }

        return res.status(207).json({
            message: `Processed ${totalCount} records: ${successCount} successful, ${failedCount} failed`,
            count: {
                total: totalCount,
                successful: successCount,
                failed: failedCount
            },
            successfulRecords,
            failedRecords
        });
    }, "ERROR_PROCESSING_EXCEL_FILE");

export default insertByExcel;  