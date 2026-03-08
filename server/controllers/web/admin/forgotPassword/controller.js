import Account from "#models/Account.js";
import mailClient from "#utils/axios.mail.js";
import bcrypt from "bcrypt";
import {
    validateEmail,
    validatePassword,
    validateOTP,
    validateRequiredFields
} from "#utils/validators.js";

export const send_otp = asyncHandler(
    async (req, res) => {
        const {email} = req.body;

        // Validate email
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({ error: emailValidation.error });
        }

        const findAdmin = await Account.findOne({email: emailValidation.normalized});

        if(!findAdmin) {
            return res.status(200).json({
                message: "If admin exists with this email, OTP will be sent to the email address",
            })
        }

        try{
            await mailClient.post("/send-email-otp", {
                email: emailValidation.normalized,
            })
        } catch(err) {
            return res.status(500).json({
                error: "Something went wrong",
            })
        }

        return res.status(200).json({
            message: "If admin exists with this email, OTP will be sent to the email address",
        })
    }, "FORGOT_PASSWORD_SEND_OTP_ERROR");

export const verify_otp = asyncHandler(
    async (req, res) => {
        const {email, otp} = req.body;

        // Validate required fields
        const requiredCheck = validateRequiredFields({ email, otp }, ['email', 'otp']);
        if (!requiredCheck.valid) {
            return res.status(400).json({ error: requiredCheck.error });
        }

        // Validate email format
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({ error: emailValidation.error });
        }

        // Validate OTP format
        const otpValidation = validateOTP(otp);
        if (!otpValidation.valid) {
            return res.status(400).json({ error: otpValidation.error });
        }

        const findAdmin = await Account.findOne({email: emailValidation.normalized});

        if(!findAdmin) {
            return res.status(401).json({
                message: "Verification failed.",
            })
        }

        try{
            await mailClient.post("/verify-email-otp", {
                email: emailValidation.normalized,
                otp: otp,
            })
        } catch(err) {
            return res.status(401).json({
                message: "Invalid OTP",
            })
        }

        res.status(200).json({
            "message": "OTP Verification Successful",
        })

    }, "FORGOT_PASSWORD_VERIFY_OTP_ERROR" );

export const verify_otp_and_change_password = asyncHandler(
    async (req, res) => {
        const {email, otp, newPassword} = req.body;

        // Validate required fields
        const requiredCheck = validateRequiredFields(
            { email, otp, newPassword }, 
            ['email', 'otp', 'newPassword']
        );
        if (!requiredCheck.valid) {
            return res.status(400).json({ message: requiredCheck.error });
        }

        // Validate email format
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({ message: emailValidation.error });
        }

        // Validate OTP format
        const otpValidation = validateOTP(otp);
        if (!otpValidation.valid) {
            return res.status(400).json({ message: otpValidation.error });
        }

        // Validate password strength
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({ message: passwordValidation.error });
        }

        const account = await Account.findOne({ email: emailValidation.normalized });

        if (!account || account.role !== "admin") {
            return res.status(401).json({ message: "Admin does not exist" });
        }

        try{
            await mailClient.post("/verify-email-otp", {
                email: emailValidation.normalized,
                otp: otp,
            })
        }catch(err) {
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
    }, "CHANGE_PASSWORD_ERROR");
