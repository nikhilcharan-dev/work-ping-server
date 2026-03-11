import User from "#models/User.js";
import GovtProof from "#models/GovtProof.js";
import Organization from "#models/Organization.js";
import mongoose from "mongoose";
import {validateObjectId, validateEmail, validatePhone, validateName, validateEnum, validateDate, validateNumber, validateEmployeeId} from "#utils/validators.js";

const employeeLookupPipeline = [
    {
        $lookup: {
            from: "organizations",
            localField: "organizationId",
            foreignField: "_id",
            as: "organization"
        }
    },
    { $unwind: { path: "$organization", preserveNullAndEmptyArrays: true } },
    {
        $lookup: {
            from: "teams",
            localField: "teamId",
            foreignField: "_id",
            as: "team"
        }
    },
    { $unwind: { path: "$team", preserveNullAndEmptyArrays: true } },
    {
        $lookup: {
            from: "govtproofs",
            localField: "_id",
            foreignField: "userId",
            as: "govtProof"
        }
    },
    { $unwind: { path: "$govtProof", preserveNullAndEmptyArrays: true } },
    {
        $addFields: {
            organizationName: { $ifNull: ["$organization.name", null] },
            departmentName: { $ifNull: ["$team.teamName", null] },
            aadhaarNumber: { $ifNull: ["$govtProof.aadhaarNumber", null] },
            panNumber: { $ifNull: ["$govtProof.panNumber", null] },
            passportNumber: { $ifNull: ["$govtProof.passportNumber", null] },
            bankAccount: { $ifNull: ["$govtProof.bankAccount", null] },
            dateOfJoining: { $dateToString: { format: "%Y-%m-%d", date: "$dateOfJoining" } },
            dob: { $cond: { if: "$dob", then: { $dateToString: { format: "%Y-%m-%d", date: "$dob" } }, else: null } }
        }
    },
    {
        $project: {
            organization: 0,
            team: 0,
            govtProof: 0
        }
    }
];

const getEmployee = asyncHandler( async (req,res)=>{

    
    let { id : employeeId } = req.params;
    
    // Validate employee ID
    const idValidation = validateObjectId(employeeId, "Employee ID");
    if (!idValidation.valid) {
        return res.status(400).json({ error: idValidation.error });
    }
    
    const [Employee] = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(employeeId) } },
        ...employeeLookupPipeline
    ]);
    
    if(!Employee) {
        return res.status(404).json({error: "Employee Doesn't Exists"});
    }
    return res.status(200).json(Employee);
}, "ADMIN_GET_EMPLOYEE_ERROR" );

const updateEmployee = asyncHandler( async (req,res)=>{

    console.log(req.body);
    let { employeeId } = req.body;

    // Validate employee ID
    const idValidation = validateObjectId(employeeId, "Employee ID");
    if (!idValidation.valid) {
        return res.status(400).json({ error: idValidation.error });
    }

    employeeId = new mongoose.Types.ObjectId(employeeId);
    const employee = await User.findById(employeeId);

    if (!employee) {
        return res.status(404).json({ error: "Employee Doesn't Exist" });
    }

    const { userName : name, email, phone, gender, salary, dob, address, dateOfJoining, role, isActive, teamId, userId, organizationId, aadhaar, pan, passport, bankId } = req.body;

    const updates = {};
    const govtUpdates = {};

    if (name && name !== employee.name) {
        const nameValidation = validateName(name);
        console.log("H1");
        if (!nameValidation.valid) return res.status(400).json({ error: nameValidation.error });
        updates.name = nameValidation.normalized;
    }

    if (email && email !== employee.email) {
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) return res.status(400).json({ error: emailValidation.error });

        const existing = await User.findOne({ email: emailValidation.normalized, _id: { $ne: employeeId } });
        if (existing) return res.status(409).json({ error: "Email already in use by another employee" });

        updates.email = emailValidation.normalized;
    }

    if (phone && phone !== employee.phone) {
        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.valid) return res.status(400).json({ error: phoneValidation.error });

        const existing = await User.findOne({ phone: phoneValidation.normalized, _id: { $ne: employeeId } });
        if (existing) return res.status(409).json({ error: "Phone number already in use by another employee" });

        updates.phone = phoneValidation.normalized;
    }

    if(userId && userId !== employee.employeeId) {
        const userIdValidation = validateEmployeeId(userId);
        if (!userIdValidation.valid) return res.status(400).json({ error: userIdValidation.error });
        console.log("H2");

        const existing = await User.findOne({ employeeId: userIdValidation.normalized, _id: { $ne: employeeId } });
        if (existing) return res.status(409).json({ error: "Employee ID already in use by another employee" });

        updates.employeeId = userIdValidation.normalized;
    }

    if (gender && gender !== employee.gender) {
        const genderValidation = validateEnum(gender, ["male", "female", "other"], "Gender");
        if (!genderValidation.valid) return res.status(400).json({ error: genderValidation.error });
        updates.gender = genderValidation.normalized;
    }

    if (salary !== undefined && salary !== employee.salary) {
        const salaryValidation = validateNumber(salary, "Salary", { min: 0 });
        if (!salaryValidation.valid) return res.status(400).json({ error: salaryValidation.error });
        updates.salary = salaryValidation.normalized;
    }

    if (dob) {
        const dobValidation = validateDate(dob, "Date of Birth", { noFuture: true });
        if (!dobValidation.valid) return res.status(400).json({ error: dobValidation.error });
        updates.dob = dobValidation.normalized;
    }

    if (address) {
        updates.address = String(address).trim();
    }

    if (dateOfJoining) {
        const dojValidation = validateDate(dateOfJoining, "Date of Joining", { noFuture: true });
        if (!dojValidation.valid) return res.status(400).json({ error: dojValidation.error });
        updates.dateOfJoining = dojValidation.normalized;
    }

    if (role && role !== employee.role) {
        const roleValidation = validateEnum(role, ["manager", "teamLead", "employee"], "Role");
        if (!roleValidation.valid) return res.status(400).json({ error: roleValidation.error });
        updates.role = roleValidation.normalized;
    }

    if (isActive !== undefined && isActive !== employee.isActive) {
        if (typeof isActive !== "boolean") {
            return res.status(400).json({ error: "isActive must be a boolean" });
        }
        updates.isActive = isActive;
    }

    if (teamId) {
        const teamIdValidation = validateObjectId(teamId, "Team ID");
        if (!teamIdValidation.valid) return res.status(400).json({ error: teamIdValidation.error });
        updates.teamId = new mongoose.Types.ObjectId(teamId);
    }

    if (organizationId) {
        const orgIdValidation = validateObjectId(organizationId, "Organization ID");
        if (!orgIdValidation.valid) return res.status(400).json({ error: orgIdValidation.error });

        const org = await Organization.findById(organizationId);
        if (!org) return res.status(404).json({ error: "Organization not found" });

        updates.organizationId = new mongoose.Types.ObjectId(organizationId);
    }

    // GovtProof fields
    if (aadhaar) {
        const aadhaarRegex = /^\d{12}$/;
        if (!aadhaarRegex.test(String(aadhaar).trim())) {
            return res.status(400).json({ error: "Invalid aadhaar format. Must be exactly 12 digits" });
        }
        govtUpdates.aadhaarNumber = String(aadhaar).trim();
    }

    if (pan) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
        if (!panRegex.test(String(pan).trim().toUpperCase())) {
            return res.status(400).json({ error: "Invalid PAN format. Expected format: AAAAA9999A" });
        }
        govtUpdates.panNumber = String(pan).trim().toUpperCase();
    }

    if (passport) {
        const passportRegex = /^[A-Z][1-9]\d{6}$/;
        if (!passportRegex.test(String(passport).trim().toUpperCase())) {
            return res.status(400).json({ error: "Invalid passport format. Expected format: A1234567" });
        }
        govtUpdates.passportNumber = String(passport).trim().toUpperCase();
    }

    if (bankId) {
        govtUpdates.bankAccount = String(bankId).trim();
    }

    if (Object.keys(updates).length === 0 && Object.keys(govtUpdates).length === 0) {
        return res.status(200).json({ message: "No changes detected" });
    }

    if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(employeeId, updates, { new: true, runValidators: true });
    }

    if (Object.keys(govtUpdates).length > 0) {
        await GovtProof.findOneAndUpdate(
            { userId: employeeId },
            { $set: govtUpdates },
            { upsert: true, new: true, runValidators: true }
        );
    }

    const [enrichedEmployee] = await User.aggregate([
        { $match: { _id: employeeId } },
        ...employeeLookupPipeline
    ]);

    console.log("Updated Employee:", enrichedEmployee);

    return res.status(200).json({ message: "Employee updated successfully", employee: enrichedEmployee });

}, "ADMIN_UPDATE_EMPLOYEE_ERROR" );

export { getEmployee, updateEmployee };