
export const send_otp = asyncHandler(async(req, res) => {
    const { email } = req.body;
    const user = await Mail.findOne({ email });
    if (user) {
        return res.status(400).send({
            message: "Email already exists",
        })
    }
    const otp = generatorOtp(6);
    console.log(otp);
    await sendOTP(email, otp);
    const newUser = await Mail.create({
        email,
        otp
    });
    return res.status(201).json({
        message: "Email sent successfully",
    });
}, "AUTH_EMAIL_OTP_ERROR");

export const send_phone_otp =  asyncHandler(async(req, res) => {

}, "AUTH_PHONE_OTP_ERROR");

export const verify_email_otp =  asyncHandler(async(req, res) => {
    const { email, otp } = req.body;
    const user = await Mail.findOne({ email });
    if (!user) {
        return res.status(401).json({
            error: "Forbidden",
        })
    }
    if(user.otp !== otp) {
        return res.status(400).json({
            error: "Invalid OTP"
        })
    }
    await Mail.deleteOne({ email });
    return res.status(200).json({
        message: "Email verified",
    })
}, "AUTH_VERIFY_EMAIL_OTP_ERROR");

export const verify_phone_otp =  asyncHandler(async(req, res) => {

}, "AUTH_VERIFY_PHONE_OTP_ERROR");
