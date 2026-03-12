import Admin from "#models/Admin.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";
import Account from "#models/Account.js";
import mailClient from "#utils/mailClient.js";
import axios from "axios";
import { successResponse, errorResponse } from "#utils/response.helper.js";
import { setAuthCookie, clearAuthCookie } from "#utils/cookie.helper.js";
import {
    validateEmail,
    validatePhone,
    validatePassword,
    validateName,
    validateRequiredFields
} from "#utils/validators.js";


export const register = asyncHandler(
    async (req, res) => {
        const { name, email, password, number: phoneNumber } = req.body;

        const requiredCheck = validateRequiredFields(
            { name, email, password, phoneNumber },
            ['name', 'email', 'password', 'phoneNumber']
        );
        if (!requiredCheck.valid) return errorResponse(res, requiredCheck.error);

        const nameValidation = validateName(name);
        if (!nameValidation.valid) return errorResponse(res, nameValidation.error);

        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) return errorResponse(res, emailValidation.error);

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) return errorResponse(res, passwordValidation.error);

        const phoneValidation = validatePhone(phoneNumber);
        if (!phoneValidation.valid) return errorResponse(res, phoneValidation.error);

        const existingUser = await Admin.findOne({ email: emailValidation.normalized });
        if (existingUser) return errorResponse(res, "Admin already exists", 409);

        const existingAccount = await Account.findOne({ email: emailValidation.normalized });
        if (existingAccount) return errorResponse(res, "Account already exists with this email", 409);

        const hashedPassword = await bcrypt.hash(password, 10);

        const session = await mongoose.startSession();
        session.startTransaction();
        let user;
        try {
            ([user] = await Admin.create([{
                name: nameValidation.normalized,
                email: emailValidation.normalized,
                phoneNumber: phoneValidation.normalized,
            }], { session }));

            await Account.create([{
                password: hashedPassword,
                email: emailValidation.normalized,
                role: "admin",
                twoFactorEnabled: false,
            }], { session });

            await session.commitTransaction();
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }

        const token = jwt.sign(
            { userId: user._id, role: "admin" },
            process.env.SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        // res.cookie("accessToken", token, {
        //     httpOnly: false,
        //     secure: isSecure,
        //     sameSite: isSecure ? "none" : "lax",
        //     maxAge: 1000 * 60 * 60 * 24
        // });
        setAuthCookie(res, req, token, { httpOnly: false });

        return successResponse(res, "Register Successful", {
            id: user._id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
        }, 201);
    }, "REGISTER_ADMIN_CONTROLLER_ERROR");

export const login = asyncHandler(
    async (req, res) => {
        const { email, password } = req.body;

        const requiredCheck = validateRequiredFields({ email, password }, ['email', 'password']);
        if (!requiredCheck.valid) return errorResponse(res, requiredCheck.error);

        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) return errorResponse(res, emailValidation.error);

        const account = await Account.findOne({ email: emailValidation.normalized });
        if (!account || account.role !== "admin") return errorResponse(res, "Admin does not exist", 401);

        const isMatch = await bcrypt.compare(password, account.password);
        if (!isMatch) return errorResponse(res, "Invalid credentials", 401);

        const admin = await Admin.findOne({ email: emailValidation.normalized });
        if (!admin) return errorResponse(res, "Admin profile not found", 401);

        const token = jwt.sign({ userId: admin._id, role: "admin" }, process.env.SECRET_KEY, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        // const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        // res.cookie("accessToken", token, {
        //     httpOnly: true,
        //     secure: isSecure,
        //     sameSite: isSecure ? "none" : "lax",
        //     maxAge: 1000 * 60 * 60 * 24
        // });
        setAuthCookie(res, req, token);

        return successResponse(res, "Login Successful");
    }, "LOGIN_ADMIN_ERROR");

export const logout = asyncHandler(
    async (req, res) => {
        // const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        // res.clearCookie("accessToken", {
        //     httpOnly: true,
        //     secure: isSecure,
        //     sameSite: isSecure ? "none" : "lax",
        //     path: "/"
        // });
        clearAuthCookie(res, req);
        return successResponse(res, "Logout successful");
    }, "ADMIN_LOGOUT_ERROR");

export const forgot_password_send_otp = asyncHandler(
    async (req, res) => {
        const { email } = req.body;

        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) return errorResponse(res, emailValidation.error);

        const admin = await Admin.findOne({ email: emailValidation.normalized });
        if (!admin) return errorResponse(res, "Admin not found", 404);

        const send_otp_end_point = process.env.MAIL_SERVICE_URI + "/send-email-otp";
        let send_otp;
        try {
            send_otp = await axios.post(send_otp_end_point, { email: emailValidation.normalized });
        } catch (err) {
            return errorResponse(res, "Failed to send OTP", 500);
        }
        if (!send_otp.data || send_otp.data.status !== "success") {
            return errorResponse(res, "Something went wrong", 401);
        }
        return successResponse(res, "OTP sent successfully");
    }, "FORGOT_PASSWORD_SEND_OTP_ERROR");

export const forgot_password_verify_otp = asyncHandler(
    async (req, res) => {
        const { email, otp } = req.body;

        const requiredCheck = validateRequiredFields({ email, otp }, ['email', 'otp']);
        if (!requiredCheck.valid) return errorResponse(res, requiredCheck.error);

        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) return errorResponse(res, emailValidation.error);

        const verify_otp_end_point = process.env.MAIL_SERVICE_URI + "/verify-email-otp";
        let verify_otp;
        try {
            verify_otp = await axios.post(verify_otp_end_point, { email: emailValidation.normalized, otp });
        } catch (err) {
            return errorResponse(res, "Failed to verify OTP", 500);
        }
        if (!verify_otp.data || verify_otp.data.status !== "success") {
            return errorResponse(res, "Invalid OTP", 401);
        }
        return successResponse(res, "OTP Verification Successful");
    }, "FORGOT_PASSWORD_VERIFY_OTP_ERROR");

export const forgot_password_reset = asyncHandler(
    async (req, res) => {
        const { email, otp, newPassword } = req.body;

        const requiredCheck = validateRequiredFields(
            { email, otp, newPassword },
            ['email', 'otp', 'newPassword']
        );
        if (!requiredCheck.valid) return errorResponse(res, requiredCheck.error);

        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) return errorResponse(res, emailValidation.error);

        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) return errorResponse(res, passwordValidation.error);

        const verify_otp_end_point = process.env.MAIL_SERVICE_URI + "/verify-email-otp";
        let verify_otp;
        try {
            verify_otp = await axios.post(verify_otp_end_point, { email: emailValidation.normalized, otp });
        } catch (err) {
            return errorResponse(res, "Failed to verify OTP", 500);
        }
        if (!verify_otp.data || verify_otp.data.status !== "success") {
            return errorResponse(res, "Invalid OTP", 401);
        }

        const account = await Account.findOne({ email: emailValidation.normalized, role: "admin" });
        if (!account) return errorResponse(res, "Admin account not found", 404);

        const isSamePassword = await bcrypt.compare(newPassword, account.password);
        if (isSamePassword) return errorResponse(res, "New password cannot be the same as current password");

        account.password = await bcrypt.hash(newPassword, 10);
        await account.save();

        return successResponse(res, "Password reset successful");
    }, "FORGOT_PASSWORD_RESET_ERROR");
