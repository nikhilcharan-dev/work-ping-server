import Admin from "#models/Admin.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Account from "#models/Account.js";
import axios from "axios";
import {send_email_otp} from "#webController/admin/otp/controller.js";
export const register = asyncHandler(
    async (req, res) => {
        console.log(req.body);
        const { name, email, password, number: phoneNumber } = req.body;
        if (!name || !email || !password || !phoneNumber) {
            return res.status(400).json({ message: "Missing fields" })
        }

        const existingUser = await Admin.findOne({ email: email });

        if (existingUser) {
            return res.status(409).json({
                message: "Admin already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await Admin.create({
            name,
            email: email.trim(),
            phoneNumber,
        });

        const account = await Account.create({
            password: hashedPassword,
            email: user.email,
            role: "admin",
        });
        const token = jwt.sign(
            { userId: user._id },
            process.env.SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        )

        const isLive = process.env.MODE === "production";

        res.cookie("accessToken", token, {
            httpOnly: false,
            secure: isLive,
            sameSite: isLive ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24 // 1 Day
        })

        return res.status(201).json({
            message: "Register Successful",
            userDetails: {
                id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
            },
            token: token,
        });
    }, "REGISTER_ADMIN_CONTROLLER_ERROR");

export const login = asyncHandler(
    async (req, res) => {
        const { email, password } = req.body;
        
        

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const account = await Account.findOne({ email: email.trim() });
        if (!account || account.role !== "admin") {
            return res.status(401).json({ message: "Admin does not exist" });
        }
        const isMatch = await bcrypt.compare(
            password,
            account.password
        );

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const admin = await Admin.findOne({ email: email.trim() });

        const token = await jwt.sign({ userId: admin._id }, process.env.SECRET_KEY, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        })

        const isLive = process.env.MODE === "production";
        console.log(token)
        // res.cookie("accessToken", token, {
        //     httpOnly: false,
        //     secure: isLive,
        //     sameSite: "none",
        //     maxAge: 1000 * 60 * 60 * 24
        // })

        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: isLive,
            sameSite: isLive ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24 // 1 Day
        })


        return res.status(200).json({
            message: "Login Successful",
            token: token
        });

    }, "LOGIN_ADMIN_ERROR");

export const logout = asyncHandler(
    async (req, res) => {
        const isLive = process.env.MODE === "production";
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: isLive,
            sameSite: isLive ? "none" : "lax",
        })
    }, "ADMIN_LOGOUT_ERROR"
)

// export const forgot_password_send_otp = asyncHandler(
//     async (req, res) => {
//         const {email} = req.body;
//         const send_otp_end_point = process.env.MAIL_SERVICE_URI + "/send-email-otp";
//         await send_otp = axios.post(send_otp_end_point, {
//             email: email,
//         });
//
//         if(send_otp.status !== "success") {
//             return res.status(401).json({
//                 error: "Something went wrong",
//             })
//         }
//         res.status(200).json({
//             "status": "success"
//         })
//     }, "FORGOT_PASSWORD_SEND_OTP_ERROR");
//
// export const forgot_password_verify_otp = asyncHandler(
//     async (req, res) => {
//         const {email, otp} = req.body;
//         const verify_otp_end_point = process.env.MAIL_SERVICE_URI + "/verify-email-otp";
//         await verify_otp = axios.post(verify_otp_end_point, {
//             email: email,
//             otp: otp
//         });
//
//         if(verify_otp.status !== "success") {
//             return res.status(401).json({
//                 message: "Invalid OTP",
//             })
//         }
//
//         res.status(200).json({
//             "message": "OTP Verification Successful",
//         })
//
//     }
// )
