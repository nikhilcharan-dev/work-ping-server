import User from "#models/User.js";
import mongoose from "mongoose";
import {validateObjectId, validateEmail, validatePhone, validateName, validateEnum, validateDate, validateNumber} from "#utils/validators.js";

const getEmployee = asyncHandler( async (req,res)=>{

    
    let { id : employeeId } = req.params;
    
    // Validate employee ID
    const idValidation = validateObjectId(employeeId, "Employee ID");
    if (!idValidation.valid) {
        return res.status(400).json({ error: idValidation.error });
    }
    
    employeeId = new mongoose.Types.ObjectId(employeeId);
    let Employee = await User.findById(employeeId).select("-password").populate("organizationId", "name").lean();
    
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

    const { userName : name, email, phone, gender, salary, dob, address, dateOfJoining, role, isActive, teamId, userId } = req.body;

    const updates = {};

    if (name && name !== employee.name) {
        const nameValidation = validateName(name);
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
        const userIdValidation = validateName(userId, "Employee ID");
        if (!userIdValidation.valid) return res.status(400).json({ error: userIdValidation.error });

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
        const dojValidation = validateDate(dateOfJoining, "Date of Joining");
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

    if (Object.keys(updates).length === 0) {
        return res.status(200).json({ message: "No changes detected" });
    }

    const updatedEmployee = await User.findByIdAndUpdate(employeeId, updates, { new: true, runValidators: true })
        .select("-password")
        .populate("organizationId", "name")
        .lean();

    console.log("Updated Employee:", updatedEmployee);

    return res.status(200).json({ message: "Employee updated successfully", employee: updatedEmployee });

}, "ADMIN_UPDATE_EMPLOYEE_ERROR" );

export { getEmployee, updateEmployee };