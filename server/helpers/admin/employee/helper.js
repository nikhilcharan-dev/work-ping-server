import User from "#models/User.js";

export const insertEmployees = asyncHandler(
    async(data) => {
        const createEmp = await User.insertMany(data);

    }, "EMPLOYEE_INSERTION_HELPER_ERROR"
);
