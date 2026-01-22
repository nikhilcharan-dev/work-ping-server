
import User from '#models/User.js';

const getUser = asycHandler(async (req , res)=>{
    const {employeeId} = req.body;
    let existingUser = await User.findOneById(employeeId);
    if(!existingUser) {
        return res.status(404).json({error: "User Not Exists"});
    }
    return res.status(200).json(await User.findOneById(employeeId));
});

const updateUser = asyncHandler(async (req,res)=>{
    let updateUserTo = req.body;
    let existingUser = await User.findOneById(updateUserTo.employeeId);
    if(!existingUser) {
        return res.status(404).json({error: "User Not Exists"});
    }
    return res.status(200).json(await User.findByIdAndUpdate(
        updateUserTo.employeeId,
        updateUserTo,
        {new : true}
    ).lean());

});

const deleteUser = asyncHandler(async (req,res)=>{
    let {employeeId} = req.body;
    let existingUser = await User.findOneById(employeeId);
    if(!existingUser) {
        return res.status(404).json({error: "User Not Exists"});
    }
    return res.status(200).json(await User.findByIdAndDelete(
        employeeId
    ).lean());
});
