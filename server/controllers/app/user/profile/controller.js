
import User from '#models/User.js';

const existingUser = (empId)=>{
    return User.findOne({employeeId:empId});
}

const getUser = asycHandler((req , res)=>{
    const {employeeId} = req.body;
    if(!existingUser(employeeId)) {
        return res.status(404).json({error: "User Not Exists"});
    }
    return res.status(200).json(User.findOne({employeeId : employeeId}));
});

const updateUser = asyncHandler((req,res)=>{
    let updateUserTo = req.body;
    if(!existingUser(updateUser.employeeId)) {
        return res.status(404).json({error: "User Not Exists"});
    }
    return res.status(200).json(User.findByIdAndUpdate(
        updateUserTo.employeeId,
        updateUserTo,
        {new : true}
    ).lean());

});

const deleteUser = asyncHandler((req,res)=>{
    let {employeeId} = req.body;
    if(!existingUser(employeeId)) {
        return res.status(404).json({error: "User Not Exists"});
    }
    return res.status(200).json(User.findByIdAndDelete(
        employeeId
    ).lean());
});
