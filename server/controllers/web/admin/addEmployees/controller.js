import User from "#models/User.js";
import mongoose from "mongoose";
import {validateObjectId} from "#utils/validators.js";

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

export { getEmployee };