import Admin from "#models/Admin.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Account from "#models/Account.js";
import mailClient from "#utils/axios.mail.js";
import axios from "axios";
import {
    validateEmail,
    validatePhone,
    validatePassword,
    validateName,
    validateRequiredFields
} from "#utils/validators.js";



export const register = asyncHandler(
    async (req, res) => {
        console.log(req.body);
        const { name, email, password, number: phoneNumber } = req.body;
        
        // Validate required fields
        const requiredCheck = validateRequiredFields(
            { name, email, password, phoneNumber }, 
            ['name', 'email', 'password', 'phoneNumber']
        );
        if (!requiredCheck.valid) {
            return res.status(400).json({ message: requiredCheck.error });
        }

        // Validate name
        const nameValidation = validateName(name);
        if (!nameValidation.valid) {
            return res.status(400).json({ message: nameValidation.error });
        }

        // Validate email
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({ message: emailValidation.error });
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ message: passwordValidation.error });
        }

        // Validate phone number
        const phoneValidation = validatePhone(phoneNumber);
        if (!phoneValidation.valid) {
            return res.status(400).json({ message: phoneValidation.error });
        }

        // Check if admin already exists in Admin collection
        const existingUser = await Admin.findOne({ email: emailValidation.normalized });
        if (existingUser) {
            return res.status(409).json({
                message: "Admin already exists"
            });
        }

        // Check if account already exists
        const existingAccount = await Account.findOne({ email: emailValidation.normalized });
        if (existingAccount) {
            return res.status(409).json({
                message: "Account already exists with this email"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await Admin.create({
            name: nameValidation.normalized,
            email: emailValidation.normalized,
            phoneNumber: phoneValidation.normalized,
        });

        const account = await Account.create({
            password: hashedPassword,
            email: user.email,
            role: "admin",
            twoFactorEnabled: false,
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
        
        // Validate required fields
        const requiredCheck = validateRequiredFields(
            { email, password }, 
            ['email', 'password']
        );
        if (!requiredCheck.valid) {
            return res.status(400).json({ message: requiredCheck.error });
        }

        // Validate email format
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({ message: emailValidation.error });
        }

        const account = await Account.findOne({ email: emailValidation.normalized });
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

        const admin = await Admin.findOne({ email: emailValidation.normalized });

        const token = await jwt.sign({ userId: admin._id }, process.env.SECRET_KEY, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        })

        const isLive = process.env.MODE === "production";
        console.log(token)

        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: isLive,
            sameSite: isLive ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24 // 1 Day
        })


        return res.status(200).json({
            message: "Login Successful",
            token: token,
        });

    }, "LOGIN_ADMIN_ERROR");

export const logout = asyncHandler(
    async (req, res) => {
        const isLive = process.env.MODE === "production";
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: isLive,
            sameSite: isLive ? "none" : "lax",
            path: "/"
        })
        .status(200)
        .json({
            message: "Logout successful"
        });

        
    }, "ADMIN_LOGOUT_ERROR"
)

export const forgot_password_send_otp = asyncHandler(
    async (req, res) => {
        const { email } = req.body;
        
        // Validate email
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({ message: emailValidation.error });
        }
        
        // Check if admin exists
        const admin = await Admin.findOne({ email: emailValidation.normalized });
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        
        const send_otp_end_point = process.env.MAIL_SERVICE_URI + "/send-email-otp";
        let send_otp;
        try {
            send_otp = await axios.post(send_otp_end_point, { email: emailValidation.normalized });
        } catch (err) {
            return res.status(500).json({ error: "Failed to send OTP" });
        }
        if (!send_otp.data || send_otp.data.status !== "success") {
            return res.status(401).json({
                error: "Something went wrong",
            });
        }
        res.status(200).json({
            status: "success"
        });
    }, "FORGOT_PASSWORD_SEND_OTP_ERROR"
);

export const forgot_password_verify_otp = asyncHandler(
    async (req, res) => {
        const { email, otp } = req.body;
        
        // Validate required fields
        const requiredCheck = validateRequiredFields({ email, otp }, ['email', 'otp']);
        if (!requiredCheck.valid) {
            return res.status(400).json({ message: requiredCheck.error });
        }
        
        // Validate email format
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return res.status(400).json({ message: emailValidation.error });
        }
        
        const verify_otp_end_point = process.env.MAIL_SERVICE_URI + "/verify-email-otp";
        let verify_otp;
        try {
            verify_otp = await axios.post(verify_otp_end_point, { email: emailValidation.normalized, otp });
        } catch (err) {
            return res.status(500).json({ message: "Failed to verify OTP" });
        }
        if (!verify_otp.data || verify_otp.data.status !== "success") {
            return res.status(401).json({
                message: "Invalid OTP",
            });
        }
        res.status(200).json({
            message: "OTP Verification Successful",
        });
    }, "FORGOT_PASSWORD_VERIFY_OTP_ERROR"
);

// Reset password after OTP verification
export const forgot_password_reset = asyncHandler(
    async (req, res) => {
        const { email, otp, newPassword } = req.body;
        
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
        
        // Validate password strength
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({ message: passwordValidation.error });
        }

        const verify_otp_end_point = process.env.MAIL_SERVICE_URI + "/verify-email-otp";
        let verify_otp;
        try {
            verify_otp = await axios.post(verify_otp_end_point, { email: emailValidation.normalized, otp });
        } catch (err) {
            return res.status(500).json({ message: "Failed to verify OTP" });
        }
        if (!verify_otp.data || verify_otp.data.status !== "success") {
            return res.status(401).json({ message: "Invalid OTP" });
        }

        const account = await Account.findOne({ email: emailValidation.normalized, role: "admin" });
        if (!account) {
            return res.status(404).json({ message: "Admin account not found" });
        }
        
        // Check if new password is same as current password
        const isSamePassword = await bcrypt.compare(newPassword, account.password);
        if (isSamePassword) {
            return res.status(400).json({ message: "New password cannot be the same as current password" });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        account.password = hashedPassword;
        await account.save();

        res.status(200).json({ message: "Password reset successful" });
    }, "FORGOT_PASSWORD_RESET_ERROR"
);
