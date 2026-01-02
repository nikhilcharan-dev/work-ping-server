import Admin from "../../../../models/Admin.js";
import mailClient from "../../../../utils/axios.mail.js";

export const send_email_otp = asyncHandler(async(req, res) => {
    const { email } = req.body;
    const user = await Admin.findOne({ email: email });
    if (user) {
        return res.status(400).send({
            message: "Email already exists",
        })
    }
    console.log("sending");
    await mailClient.post("/send-email-otp", {
        email: email,
    })
    return res.status(201).json({
        message: "Email sent successfully",
    });
}, "AUTH_EMAIL_OTP_ERROR");

export const send_phone_otp =  asyncHandler(async(req, res) => {

}, "AUTH_PHONE_OTP_ERROR");

export const verify_email_otp =  asyncHandler(async(req, res) => {
    const { email, otp } = req.body;
    if(!email || !otp) {
        return res.status(400).send({
            message: "Email or password is required",
        })
    }
    await mailClient.post("/verify-email-otp", {
        email: email,
        otp: otp,
    })
    return res.status(200).json({
        message: "Email verified",
    })
}, "AUTH_VERIFY_EMAIL_OTP_ERROR");

export const verify_phone_otp =  asyncHandler(async(req, res) => {

}, "AUTH_VERIFY_PHONE_OTP_ERROR");
