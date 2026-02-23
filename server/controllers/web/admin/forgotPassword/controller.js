import Account from "#models/Account.js";
import mailClient from "#utils/axios.mail.js";
import bcrypt from "bcrypt";

export const send_otp = asyncHandler(
    async (req, res) => {
        const {email} = req.body;

        const findAdmin = await Account.findOne({email: email.trim()});
        
        if(!findAdmin) {
            return res.status(200).json({
                message: "If admin exists with this email, OTP will be sent to the email address",
            })
        }

        try{
            // await mailClient.post("/send-email-otp", {
            //     email: email,
            // })
            return res.status(200).json({
                message: "OTP: 111111"
            })

        } catch(err) {
            return res.status(500).json({
                error: "Something went wrong",
            })
        }

        res.status(200).json({
            message: "If admin exists with this email, OTP will be sent to the email address",
        })
    }, "FORGOT_PASSWORD_SEND_OTP_ERROR"
)

export const verify_otp = asyncHandler(
    async (req, res) => {
        const {email, otp} = req.body;
        const findAdmin = await Account.findOne({email: email.trim()});

        if(!findAdmin) {
            return res.status(401).json({
                message: "Verification failed.",
            })
        }

        try{
            // await mailClient.post("/verify-email-otp", {
            //     email: email,
            //     otp: otp,
            // })
            if(otp !== "111111") {
                throw new Error("Invalid OTP");
            }
        } catch(err) {
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
        const {email, newPassword} = req.body;

        const account = await Account.findOne({ email: email.trim() });
        
        if (!account || account.role !== "admin") {
            return res.status(401).json({ message: "Admin does not exist" });
        }

        try{
            // await mailClient.post("/verify-email-otp", {
            //     email: email,
            //     otp: req.body.otp,
            // })

            if(req.body.otp !== "111111") {
                throw new Error("Invalid OTP");
            }
        }catch(err) {
            return res.status(401).json({
                message: "Password change failed. Invalid OTP.",
            })
        }

        if(!email || !newPassword) {
            return res.status(400).json({
                message: "Email and new password are required",
            })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const isMatch = await bcrypt.compare(
            newPassword,
            account.password
        );

        if (isMatch) {
            return res.status(401).json({ message: "Password already used, Use new password" });
        }

        account.password = hashedPassword;
        await account.save();

        res.status(200).json({
            message: "Password changed successfully",
        })
    }, "CHANGE_PASSWORD_ERROR"
)
