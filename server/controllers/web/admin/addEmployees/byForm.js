import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "#models/User.js";
import Account from "#models/Account.js";
import GovtProof from "#models/GovtProof.js";
import Organization from "#models/Organization.js";
import Team from "#models/Team.js";

const insertByForm = asyncHandler(
async (req, res) => {

    console.log("Checkpoint 1");

    // Extract fields
    const {
        userName: name,
        email,
        phone,
        userId: employeeId,
        organizationName,
        teamName,
        doj: dateOfJoining,
        role
    } = req.body;

    const {
        gender,
        salary,
        dob,
        address,
        isActive,
        aadhaar,
        passport,
        pan,
        bankId
    } = req.body;

    console.log("Checkpoint 2");
    // Mandatory validation
    if (!name || !email || !phone || !employeeId || !dateOfJoining || !aadhaar) {
        return res.status(400).json({
            error: "Mandatory fields are missing (name, email, phone, userId, doj, role, aadhaar)"
        });
    }
    console.log("Checkpoint 3");
    // Validate role
    const validRoles = ["manager", "teamLead", "employee"];
    if (role && !validRoles.includes(role)) {
        return res.status(400).json({
            error: `Invalid role. Must be one of: ${validRoles.join(", ")}`
        });
    }
    console.log("Checkpoint 4");
    // Validate gender
    if (gender) {
        const validGenders = ["male", "female", "other"];
        if (!validGenders.includes(gender.toLowerCase())) {
            return res.status(400).json({
                error: `Invalid gender. Must be one of: ${validGenders.join(", ")}`
            });
        }
    }
    console.log("Checkpoint 5");

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            error: "Invalid email format"
        });
    }
    console.log("Checkpoint 6");

    // Aadhaar validation
    const aadhaarRegex = /^\d{12}$/;
    if (!aadhaarRegex.test(String(aadhaar).trim())) {
        return res.status(400).json({
            error: "Invalid aadhaar format. Must be exactly 12 digits"
        });
    }
    console.log("Checkpoint 7");

    // PAN validation
    if (pan) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
        if (!panRegex.test(String(pan).trim().toUpperCase())) {
            return res.status(400).json({
                error: "Invalid PAN format. Expected format: AAAAA9999A"
            });
        }
    }
    console.log("Checkpoint 8");

    // Passport validation
    if (passport) {
        const passportRegex = /^[A-Z][1-9]\d{6}$/;
        if (!passportRegex.test(String(passport).trim().toUpperCase())) {
            return res.status(400).json({
                error: "Invalid passport format. Expected format: A1234567"
            });
        }
    }
    console.log("Checkpoint 9");

    // Find organization
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
    console.log("Checkpoint 10");

    // Find team
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
    console.log("Checkpoint 11");

    // Check existing user (email/phone globally, employeeId within org)
    const existingUser = await User.findOne({
        $or: [
            { email: email },
            { phone: phone },
            { employeeId: employeeId, organizationId: organization._id }
        ]
    });
    console.log("Checkpoint 12");

    if (existingUser) {
        return res.status(409).json({
            error: "User already exists with this email, phone, or employeeId in this organization"
        });
    }

    // Check existing account
    const existingAccount = await Account.findOne({ email: email });
    console.log("Checkpoint 13");
    if (existingAccount) {
        return res.status(409).json({
            error: "Account already exists with this email"
        });
    }

    console.log("Checkpoint 14");

    // PAN + bank validation
    if ((pan && !bankId) || (!pan && bankId)) {
        return res.status(400).json({
            error: "pan and bankId must be provided together"
        });
    }
    console.log("Checkpoint 15");

    // Validate dateOfJoining
    const dojDate = new Date(dateOfJoining);
    if (isNaN(dojDate.getTime())) {
        return res.status(400).json({
            error: "Invalid date of joining"
        });
    }
    if (dojDate > new Date()) {
        return res.status(400).json({
            error: "Date of joining cannot be a future date"
        });
    }

    // Prepare user data
    const userData = {
        name,
        email,
        phone,
        employeeId,
        organizationId: organization._id,
        dateOfJoining: new Date(dojDate.toISOString().split('T')[0])
    };

    if (gender) userData.gender = gender.toLowerCase();

    if(role) userData.role = role.toLowerCase();

    if (salary) {

        const salaryNum = Number(salary);

        if (isNaN(salaryNum) || salaryNum < 0) {
            return res.status(400).json({
                error: "Invalid salary value"
            });
        }

        userData.salary = salaryNum;
    }
    console.log("Checkpoint 16");

    if (dob) {

        const dobDate = new Date(dob);

        if (isNaN(dobDate.getTime())) {
            return res.status(400).json({
                error: "Invalid date of birth"
            });
        }

        if (dobDate > new Date()) {
            return res.status(400).json({
                error: "Date of birth cannot be a future date"
            });
        }

        userData.dob = new Date(dobDate.toISOString().split('T')[0]);
    }
    console.log("Checkpoint 17");

    if (address) userData.address = address;
    if (team) userData.teamId = team._id;
    if (isActive !== undefined) userData.isActive = isActive;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        // Create user
        console.log("newUse" ,userData)
        const [newUser] = await User.create([userData], { session });
        // Create account
        const password = process.env.USER_DEFAULT_PASSWORD || "WorkPing@123";
        const hashedPassword = await bcrypt.hash(password, 10);

        const accountData = {
            email: email,
            password: hashedPassword,
            emailVerified: false
        };

        if(role) {
            accountData.role = role.toLowerCase();
        }
        console.log(accountData)

        await Account.create([accountData], { session });

        // Create govt proof
        if (pan !== "" && bankId !== "") {

            const govtProofData = {
                aadhaarNumber: String(aadhaar).trim(),
                panNumber: String(pan).trim().toUpperCase(),
                bankAccount: bankId,
                userId: newUser._id
            };

            if (passport) {
                govtProofData.passportNumber = String(passport).trim().toUpperCase();
            }

            await GovtProof.create([govtProofData], { session });
        }

        await session.commitTransaction();

        return res.status(201).json({
            message: "Employee added successfully",
            employeeData: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                employeeId: newUser.employeeId,
                role,
                organizationId: organization._id,
                organizationName: organization.name,
                teamId: team?._id,
                teamName: team?.teamName
            }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error inserting employee by form");
        throw error;

    } finally {
        session.endSession();
    }

}, "INSERT_BY_FORM_ERROR");

export default insertByForm;