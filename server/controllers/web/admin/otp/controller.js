import Admin from "#models/Admin.js";
import { sendEmailOTP, verifyEmailOTP } from "#services/mailer/mail.service.js";

export const send_email_otp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const user = await Admin.findOne({ email });
    if (user) {
        return res.status(400).json({
            message: "Email already exists",
        });
    }

    await sendEmailOTP(email);

    return res.status(201).json({
        message: "Email sent successfully",
    });
}, "AUTH_EMAIL_OTP_ERROR");

export const send_phone_otp = asyncHandler(async (req, res) => {
    return res.status(200).json({
        status: "success",
    });
}, "AUTH_PHONE_OTP_ERROR");

export const verify_email_otp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            message: "Email and OTP are required",
        });
    }

    await verifyEmailOTP(email, otp);

    return res.status(200).json({
        message: "Email verified",
    });
}, "AUTH_VERIFY_EMAIL_OTP_ERROR");

export const verify_phone_otp = asyncHandler(async (req, res) => {
    return res.status(200).json({
        status: "success",
    });
}, "AUTH_VERIFY_PHONE_OTP_ERROR");
