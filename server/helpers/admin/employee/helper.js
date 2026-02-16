import User from "#models/User.js";
import Account from "#models/Account.js";

export const insertEmployees = asyncHandler(
    async(data) => {
        await User.insertMany(data[0]).lean();
        await Account.insertMany(data[1]).lean();
        // for(const user in data) {
        //     sendMail({
        //         from: `WorkPing <${process.env.MAIL_SERVICE_EMAIL}>`,
        //         to: user.email,
        //     })
        // }
    }, "EMPLOYEE_INSERTION_HELPER_ERROR"
);
