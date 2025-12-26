import { Router } from "express";
import Mail from "../../../models/otp/Mail.js";
import Phone from "../../../models/otp/Phone.js";

import { generatorOtp } from "../../../utils/generator.otp.js";
import { sendOTP } from "../../../services/google/google.mails.js";

const router = Router();

router.post("/send-email-otp", async (req, res) => {
    try {
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
    } catch(err) {
        console.log("Email post failed", err.message);
        return res.status(500).send({
            error: "Internal Server Error",
        })
    }
});

router.post("/send-phone-otp", async (req, res) => {
    try {

    } catch(err) {
        console.log("Phone post failed", err.message);
        return res.status(500).send({
            error: "Internal Server Error",
        })
    }
});


router.post("/verify-email-otp", async (req, res) => {
    try {
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
    } catch(err) {
        console.log("Phone verification failed", err.message);
        return res.status(500).send({
            error: "Internal Server Error",
        })
    }
});


router.post("/verify-phone-otp", async (req, res) => {
    try {

    } catch(err) {
        console.log("Phone verification failed", err.message);
        return res.status(500).send({
            error: "Internal Server Error",
        })
    }
});

export default router;