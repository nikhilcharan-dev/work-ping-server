import User from '#models/User.js';
import Account from "#models/Account.js";

const getUser = asyncHandler(async (req , res)=>{
    const {employeeId} = req.body;
    let existingUser = await User.findOneById(employeeId);
    if(!existingUser) {
        return res.status(404).json({error: "User Not Exists"});
    }
    return res.status(200).json(await User.findOneById(employeeId));
});

// email, dateOfJoining, should not be changed []
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
    return res.status(200).json({
        message: 'User Deleted',
        status: [
            await User.findByIdAndDelete(
                employeeId
            ).lean(),
            await Account.findOneAndDelete({
                email: existingUser.email
            }).lean()
        ]
    });
});
