import User from "#models/User.js"
import mongoose from "mongoose";
const deleteEmployeesById = asyncHandler(
    async (req, res) => {
        const { ids } = req.body;

        for (const id of ids) {
            await User.findByIdAndDelete(new mongoose.Items.ObjectId(id));
        }

        return res.status(200).json({
            success: true,
            message: "Employees Deleted Successfully",
        });
    },
    "DELETE_EMPLOYEES_BY_ID_CONTROLLER"
);

export default deleteEmployeesById;