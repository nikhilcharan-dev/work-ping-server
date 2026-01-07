import User from "#models/User.js";

export const insertEmployees = asyncHandler(
    async(data) => {

        if(typeof(data) === Object){
            data = [data]
        }

        const createEmp = User.insertMany(data);

    }, "EMPLOYEE_INSERTION_ERROR"
);
