import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "#models/User.js";
import Account from "#models/Account.js";
import GovtProof from "#models/GovtProof.js";
import Organization from "#models/Organization.js";
import Team from "#models/Team.js";

const insertByForm = asyncHandler(
    async(req, res) => {
        // Extract fields from request body
        const {
            userName: name,
            email,
            phone,
            userId: employeeId,
            organizationName,
            teamName,
            doj: dateOfJoining,
            role
        } = req.body; // mandatory fields
        
        const {
            gender,
            salary,
            dob,
            address,
            roleInTeam,
            isActive,
            aadhaar,
            passport,
            pan,
            bankId
        } = req.body; // optional fields

        // Validate mandatory fields
        if (!name || !email || !phone || !employeeId || !dateOfJoining || !role) {
            return res.status(400).json({
                error: "Mandatory fields are missing (name, email, phone, userId, doj, role)"
            });
        }

        // Validate role enum
        const validRoles = ["admin", "user"];
        if (!validRoles.includes(role.toLowerCase())) {
            return res.status(400).json({
                error: `Invalid role. Must be one of: ${validRoles.join(", ")}`
            });
        }

        // Validate roleInTeam enum if provided
        if (roleInTeam) {
            const validRolesInTeam = ["manager", "teamLead", "member"];
            if (!validRolesInTeam.includes(roleInTeam)) {
                return res.status(400).json({
                    error: `Invalid roleInTeam. Must be one of: ${validRolesInTeam.join(", ")}`
                });
            }
        }

        // Validate gender enum if provided
        if (gender) {
            const validGenders = ["male", "female", "other"];
            if (!validGenders.includes(gender.toLowerCase())) {
                return res.status(400).json({
                    error: `Invalid gender. Must be one of: ${validGenders.join(", ")}`
                });
            }
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: "Invalid email format"
            });
        }

        // Find organization by name
        let organization;
        if (organizationName) {
            organization = await Organization.findOne({ name: organizationName });
            if (!organization) {
                return res.status(404).json({
                    error: `Organization '${organizationName}' not found`
                });
            }
        } else {
            return res.status(400).json({
                error: "organizationName is required"
            });
        }

        // Find team by name and organizationId (if teamName provided)
        let team = null;
        if (teamName) {
            team = await Team.findOne({ 
                teamName: teamName, 
                organizationId: organization._id 
            });
            if (!team) {
                return res.status(404).json({
                    error: `Team '${teamName}' not found in organization '${organizationName}'`
                });
            }
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { email: email },
                { phone: phone },
                { employeeId: employeeId }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                error: "User already exists with this email, phone, or employeeId"
            });
        }

        // Check if account already exists
        const existingAccount = await Account.findOne({ email: email });
        if (existingAccount) {
            return res.status(409).json({
                error: "Account already exists with this email"
            });
        }

        // Validate GovtProof data if any field is provided
        if (aadhaar || pan || bankId || passport) {
            if (!aadhaar || !pan || !bankId) {
                return res.status(400).json({
                    error: "If providing government proof, aadhaar, pan, and bankId are all required"
                });
            }
        }

        // Prepare user data
        const userData = {
            name,
            email,
            phone,
            employeeId,
            organizationId: organization._id,
            dateOfJoining: new Date(dateOfJoining)
        };

        // Add optional user fields with validation
        if (gender) userData.gender = gender.toLowerCase();
        if (salary) {
            const salaryNum = Number(salary);
            if (isNaN(salaryNum) || salaryNum < 0) {
                return res.status(400).json({
                    error: "Invalid salary value"
                });
            }
            userData.salary = salaryNum;
        }
        if (dob) {
            const dobDate = new Date(dob);
            if (isNaN(dobDate.getTime())) {
                return res.status(400).json({
                    error: "Invalid date of birth"
                });
            }
            userData.dob = dobDate;
        }
        if (address) userData.address = address;
        if (team) userData.teamId = team._id;
        if (roleInTeam) userData.roleInTeam = roleInTeam;
        if (isActive !== undefined) userData.isActive = isActive;

        // Use transaction for atomicity
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Create user
            const [newUser] = await User.create([userData], { session });

            // Create account with password
            const password = process.env.USER_DEFAULT_PASSWORD || "WorkPing@123";
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const accountData = {
                role: role.toLowerCase(),
                email: email,
                password: hashedPassword,
                emailVerified: false
            };

            await Account.create([accountData], { session });

            // Create government proof if provided
            if (aadhaar && pan && bankId) {
                const govtProofData = {
                    aadhaarNumber: aadhaar,
                    panNumber: pan,
                    bankAccount: bankId,
                    userId: newUser._id
                };

                if (passport) govtProofData.passportNumber = passport;

                await GovtProof.create([govtProofData], { session });
            }

            // Commit transaction
            await session.commitTransaction();
            session.endSession();

            return res.status(201).json({
                message: "Employee added successfully",
                employeeData: {
                    _id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    phone: newUser.phone,
                    employeeId: newUser.employeeId,
                    role: role,
                    organizationId: organization._id,
                    organizationName: organization.name,
                    teamId: team?._id,
                    teamName: team?.teamName
                }
            });

        } catch (error) {
            // Rollback transaction on error
            await session.abortTransaction();
            session.endSession();
            
            // Re-throw to be handled by asyncHandler
            throw error;
        }

    }, "INSERT_BY_FORM_ERROR"
);

export default insertByForm;