import bcrypt from "bcrypt";
import User from "#models/User.js";
import Account from "#models/Account.js";
import GovtProof from "#models/GovtProof.js";
import Organization from "#models/Organization.js";
import Team from "#models/Team.js";

const insertByForm = asyncHandler(
async (req, res) => {

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

    // Mandatory validation
    if (!name || !email || !phone || !employeeId || !dateOfJoining || !role || !aadhaar) {
        return res.status(400).json({
            error: "Mandatory fields are missing (name, email, phone, userId, doj, role, aadhaar)"
        });
    }

    // Validate role
    const validRoles = ["manager", "teamLead", "member"];
    if (!validRoles.includes(role)) {
        return res.status(400).json({
            error: `Invalid role. Must be one of: ${validRoles.join(", ")}`
        });
    }

    // Validate gender
    if (gender) {
        const validGenders = ["male", "female", "other"];
        if (!validGenders.includes(gender.toLowerCase())) {
            return res.status(400).json({
                error: `Invalid gender. Must be one of: ${validGenders.join(", ")}`
            });
        }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            error: "Invalid email format"
        });
    }

    // Aadhaar validation
    const aadhaarRegex = /^\d{12}$/;
    if (!aadhaarRegex.test(String(aadhaar).trim())) {
        return res.status(400).json({
            error: "Invalid aadhaar format. Must be exactly 12 digits"
        });
    }

    // PAN validation
    if (pan) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
        if (!panRegex.test(String(pan).trim().toUpperCase())) {
            return res.status(400).json({
                error: "Invalid PAN format. Expected format: AAAAA9999A"
            });
        }
    }

    // Passport validation
    if (passport) {
        const passportRegex = /^[A-Z][1-9]\d{6}$/;
        if (!passportRegex.test(String(passport).trim().toUpperCase())) {
            return res.status(400).json({
                error: "Invalid passport format. Expected format: A1234567"
            });
        }
    }

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

    // Check existing user
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

    // Check existing account
    const existingAccount = await Account.findOne({ email: email });

    if (existingAccount) {
        return res.status(409).json({
            error: "Account already exists with this email"
        });
    }

    // PAN + bank validation
    if ((pan && !bankId) || (!pan && bankId)) {
        return res.status(400).json({
            error: "pan and bankId must be provided together"
        });
    }

    // Prepare user data
    const userData = {
        name,
        email,
        phone,
        employeeId,
        organizationId: organization._id,
        dateOfJoining: new Date(dateOfJoining),
        role: role.toLowerCase()
    };

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
    if (isActive !== undefined) userData.isActive = isActive;

    try {

        // Create user
        console.log("newUse" ,userData)
        const newUser = await User.create(userData);
        // Create account
        const password = process.env.USER_DEFAULT_PASSWORD || "WorkPing@123";
        const hashedPassword = await bcrypt.hash(password, 10);

        const accountData = {
            role: role.toLowerCase(),
            email: email,
            password: hashedPassword,
            emailVerified: false
        };
        console.log(accountData)
        await Account.create(accountData);

        // Create govt proof
        if (pan && bankId) {

            const govtProofData = {
                aadhaarNumber: String(aadhaar).trim(),
                panNumber: String(pan).trim().toUpperCase(),
                bankAccount: bankId,
                userId: newUser._id
            };

            if (passport) {
                govtProofData.passportNumber = String(passport).trim().toUpperCase();
            }

            await GovtProof.create(govtProofData);
        }

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
        throw error;
    }

}, "INSERT_BY_FORM_ERROR");

export default insertByForm;