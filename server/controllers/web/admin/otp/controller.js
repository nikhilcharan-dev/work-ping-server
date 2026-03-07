import Admin from "#models/Admin.js";
import mailClient from "#utils/axios.mail.js";
import { validateEmail, validateOTP, validateRequiredFields } from "#utils/validators.js";

export const send_email_otp = asyncHandler(async(req, res) => {
    const { email } = req.body;
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
        return res.status(400).json({
            message: emailValidation.error,
        });
    }
    
    const user = await Admin.findOne({ email: emailValidation.normalized });
    if (user) {
        return res.status(400).send({
            message: "Email already exists",
        })
    }
    
    await mailClient.post("/send-email-otp", {
        email: emailValidation.normalized,
    })
    
    return res.status(201).json({
        message: "Email sent successfully",
    });
}, "AUTH_EMAIL_OTP_ERROR");

export const send_phone_otp =  asyncHandler(async(req, res) => {
    return res.status(200).json({
        status: "success",
    })
}, "AUTH_PHONE_OTP_ERROR");

export const verify_email_otp =  asyncHandler(async(req, res) => {
    const { email, otp } = req.body;
    
    // Validate required fields
    const requiredCheck = validateRequiredFields({ email, otp }, ['email', 'otp']);
    if (!requiredCheck.valid) {
        return res.status(400).send({
            message: requiredCheck.error,
        });
    }
    
    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
        return res.status(400).send({
            message: emailValidation.error,
        });
    }
    
    // Validate OTP format
    const otpValidation = validateOTP(otp);
    if (!otpValidation.valid) {
        return res.status(400).send({
            message: otpValidation.error,
        });
    }
    
    await mailClient.post("/verify-email-otp", {
        email: emailValidation.normalized,
        otp: otp,
    })
    
    return res.status(200).json({
        message: "Email verified",
    })
}, "AUTH_VERIFY_EMAIL_OTP_ERROR");

export const verify_phone_otp =  asyncHandler(async(req, res) => {
    return res.status(200).json({
        status: "success",
    })
}, "AUTH_VERIFY_PHONE_OTP_ERROR");


