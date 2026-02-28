import User from "#models/User.js";

export const insertEmployees = async (data) => {
    await User.insertMany(data);
    // for(const user of data) {
    //     sendMail({
    //         from: `WorkPing <${process.env.MAIL_SERVICE_EMAIL}>`,
    //         to: user.email,
    //         html: <html />
    //     })
    // }
};
