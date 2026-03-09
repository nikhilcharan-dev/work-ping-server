import Account from "#models/Account.js";
import { sendEmailOTP, verifyEmailOTP } from "#services/mailer/mail.service.js";
import bcrypt from "bcrypt";

export const send_otp = asyncHandler(
    async (req, res) => {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const findAdmin = await Account.findOne({ email: email.trim() });

        if (!findAdmin) {
            return res.status(200).json({
                message: "If admin exists with this email, OTP will be sent to the email address",
            })
        }

        try {
            await sendEmailOTP(email);
        } catch (err) {
            return res.status(500).json({
                error: "Something went wrong",
            })
        }

        return res.status(200).json({
            message: "If admin exists with this email, OTP will be sent to the email address",
        })
    }, "FORGOT_PASSWORD_SEND_OTP_ERROR"
)

export const verify_otp = asyncHandler(
    async (req, res) => {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: "Email and OTP are required" });
        }

        const findAdmin = await Account.findOne({ email: email.trim() });

        if (!findAdmin) {
            return res.status(401).json({
                message: "Verification failed.",
            })
        }

        try {
            await verifyEmailOTP(email, otp);
        } catch (err) {
            return res.status(401).json({
                message: "Invalid OTP",
            })
        }

        res.status(200).json({
            "message": "OTP Verification Successful",
        })

    }, "FORGOT_PASSWORD_VERIFY_OTP_ERROR"
)

export const verify_otp_and_change_password = asyncHandler(
    async (req, res) => {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                message: "Email, OTP, and new password are required",
            })
        }

        const account = await Account.findOne({ email: email.trim() });

        if (!account || account.role !== "admin") {
            return res.status(401).json({ message: "Admin does not exist" });
        }

        try {
            await verifyEmailOTP(email, otp);
        } catch (err) {
            return res.status(401).json({
                message: "Password change failed. Invalid OTP.",
            })
        }

        const isMatch = await bcrypt.compare(
            newPassword,
            account.password
        );

        if (isMatch) {
            return res.status(401).json({ message: "Password already used, Use new password" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        account.password = hashedPassword;
        await account.save();

        res.status(200).json({
            message: "Password changed successfully",
        })
    }, "CHANGE_PASSWORD_ERROR"
)
