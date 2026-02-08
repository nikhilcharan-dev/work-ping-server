import User from "#models/User.js";

export const insertEmployees = asyncHandler(
    async(data) => {
        await User.insertMany(data).lean();
        // for(const user in data) {
        //     sendMail({
        //         from: `WorkPing <${process.env.MAIL_SERVICE_EMAIL}>`,
        //         to: user.email,
        //
        //     })
        // }
    }, "EMPLOYEE_INSERTION_HELPER_ERROR"
);
