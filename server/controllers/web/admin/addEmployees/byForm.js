import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "#models/User.js";
import Account from "#models/Account.js";
import GovtProof from "#models/GovtProof.js";
import Organization from "#models/Organization.js";
import Team from "#models/Team.js";
import { successResponse, errorResponse } from "#utils/response.helper.js";
import { validateEmail } from "#utils/validators.js";

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
        role,
        workType
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
    if (!name || !email || !phone || !employeeId || !dateOfJoining || !aadhaar || !workType) {
        return errorResponse(res, "Mandatory fields are missing (name, email, phone, userId, doj, aadhaar, workType)");
    }

    // Sanitize and validate email via shared validator
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) return errorResponse(res, emailValidation.error);
    const normalizedEmail = emailValidation.normalized;
    console.log("Checkpoint 3");
    // Validate role
    const validRoles = ["manager", "teamLead", "employee"];
    if (role && !validRoles.includes(role)) {
        return errorResponse(res, `Invalid role. Must be one of: ${validRoles.join(", ")}`);
    }

    // Validate gender
    if (gender) {
        const validGenders = ["male", "female", "other"];
        if (!validGenders.includes(gender.toLowerCase())) {
            return errorResponse(res, `Invalid gender. Must be one of: ${validGenders.join(", ")}`);
        }
    }
    console.log("Checkpoint 5");

    // Email already validated above via validateEmail()
    console.log("Checkpoint 6");

    const validWorkTypes = ["remote", "onsite", "hybrid"];
    if (!validWorkTypes.includes(workType.toLowerCase())) {
        return errorResponse(res, `Invalid workType. Must be one of: ${validWorkTypes.join(", ")}`);
    }
    console.log("Checkpoint 6.1");

    // Aadhaar validation
    const aadhaarRegex = /^\d{12}$/;
    if (!aadhaarRegex.test(String(aadhaar).trim())) {
        return errorResponse(res, "Invalid aadhaar format. Must be exactly 12 digits");
    }
    console.log("Checkpoint 7");

    // PAN validation
    if (pan) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
        if (!panRegex.test(String(pan).trim().toUpperCase())) {
            return errorResponse(res, "Invalid PAN format. Expected format: AAAAA9999A");
        }
    }

    // Passport validation
    if (passport) {
        const passportRegex = /^[A-Z0-9]{4,15}$/;
        if (!passportRegex.test(String(passport).trim().toUpperCase())) {
            return errorResponse(res, "Invalid passport format. Expected 4-15 alphanumeric characters");
        }
    }
    console.log("Checkpoint 9");

    // Find organization
    if (!organizationName) return errorResponse(res, "organizationName is required");
    const organization = await Organization.findOne({ name: String(organizationName).trim() });
    if (!organization) return errorResponse(res, `Organization '${organizationName}' not found`, 404);
    console.log("Checkpoint 10");

    // Find team
    let team = null;
    if (teamName) {
        team = await Team.findOne({ teamName: String(teamName).trim(), organizationId: organization._id });
        if (!team) return errorResponse(res, `Team '${teamName}' not found in organization '${organizationName}'`, 404);
    }
    console.log("Checkpoint 11");

    // Check existing user (email/phone globally, employeeId within org)
    const existingUser = await User.findOne({
        $or: [
            { email: normalizedEmail },
            { phone: String(phone).trim() },
            { employeeId: String(employeeId).trim(), organizationId: organization._id }
        ]
    });
    if (existingUser) return errorResponse(res, "User already exists with this email, phone, or employeeId in this organization", 409);

    const existingAccount = await Account.findOne({ email: normalizedEmail });
    if (existingAccount) return errorResponse(res, "Account already exists with this email", 409);

    // PAN + bank validation
    if ((pan && !bankId) || (!pan && bankId)) {
        return errorResponse(res, "pan and bankId must be provided together");
    }
    console.log("Checkpoint 15");

    // Validate dateOfJoining
    const dojDate = new Date(dateOfJoining);
    if (isNaN(dojDate.getTime())) return errorResponse(res, "Invalid date of joining");
    if (dojDate > new Date()) return errorResponse(res, "Date of joining cannot be a future date");

    // Prepare user data
    const userData = {
        name: String(name).trim(),
        email: normalizedEmail,
        phone: String(phone).trim(),
        employeeId: String(employeeId).trim(),
        organizationId: organization._id,
        dateOfJoining: new Date(dojDate.toISOString().split('T')[0]),
        workType: workType.toLowerCase()
    };

    if (gender) userData.gender = gender.toLowerCase();

    if (role) userData.role = role.toLowerCase();

    if (salary) {
        const salaryNum = Number(salary);
        if (isNaN(salaryNum) || salaryNum < 0) return errorResponse(res, "Invalid salary value");
        userData.salary = salaryNum;
    }
    console.log("Checkpoint 16");

    if (dob) {
        const dobDate = new Date(dob);
        if (isNaN(dobDate.getTime())) return errorResponse(res, "Invalid date of birth");
        if (dobDate > new Date()) return errorResponse(res, "Date of birth cannot be a future date");
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
            email: normalizedEmail,
            password: hashedPassword,
            emailVerified: false
        };

        if(role) {
            accountData.role = role.toLowerCase();
        }
        console.log(accountData)

        await Account.create([accountData], { session });

        // Create govt proof — always created when aadhaar is provided
        const govtProofData = {
            aadhaarNumber: String(aadhaar).trim(),
            userId: newUser._id
        };

        if (pan) govtProofData.panNumber = String(pan).trim().toUpperCase();
        if (bankId) govtProofData.bankAccount = String(bankId).trim();
        if (passport) govtProofData.passportNumber = String(passport).trim().toUpperCase();

        await GovtProof.create([govtProofData], { session });

        await session.commitTransaction();

        return successResponse(res, "Employee added successfully", {
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
        }, 201);

    } catch (error) {
        await session.abortTransaction();
        console.error("Error inserting employee by form");
        throw error;

    } finally {
        session.endSession();
    }

}, "INSERT_BY_FORM_ERROR");

export default insertByForm;