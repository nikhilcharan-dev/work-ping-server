import User from "#models/User.js";
import Account from "#models/Account.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";
import { formatUserDates } from "#helpers/data.reducer.js";
import { successResponse, errorResponse } from "#utils/response.helper.js";
import { setAuthCookie } from "#utils/cookie.helper.js";
import {
    validateEmail,
    validatePassword,
    validateName,
    validateObjectId,
    validateRequiredFields
} from "#utils/validators.js";

export const register = asyncHandler(
    async (req, res) => {
        const { name, userEmail, password, organizationId, role, phone, employeeId, workType, dateOfJoining } = req.body;

        const requiredCheck = validateRequiredFields(
            { name, userEmail, password, organizationId, role, phone, employeeId, workType, dateOfJoining },
            ['name', 'userEmail', 'password', 'organizationId', 'role', 'phone', 'employeeId', 'workType', 'dateOfJoining']
        );
        if (!requiredCheck.valid) return errorResponse(res, requiredCheck.error);

        const nameValidation = validateName(name);
        if (!nameValidation.valid) return errorResponse(res, nameValidation.error);

        const emailValidation = validateEmail(userEmail);
        if (!emailValidation.valid) return errorResponse(res, emailValidation.error);

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) return errorResponse(res, passwordValidation.error);

        const orgIdValidation = validateObjectId(organizationId, "Organization ID");
        if (!orgIdValidation.valid) return errorResponse(res, orgIdValidation.error);

        const VALID_USER_ROLES = ["user", "manager", "teamlead", "employee"];
        if (!VALID_USER_ROLES.includes(role)) {
            return errorResponse(res, `Role must be one of: ${VALID_USER_ROLES.join(", ")}`);
        }

        const validWorkTypes = ["remote", "onsite", "hybrid"];
        if (!validWorkTypes.includes(workType.toLowerCase())) {
            return errorResponse(res, `workType must be one of: ${validWorkTypes.join(", ")}`);
        }

        const dojDate = new Date(dateOfJoining);
        if (isNaN(dojDate.getTime())) {
            return errorResponse(res, "Invalid dateOfJoining");
        }

        // We assume valid phone uses regex like /^\d{10}$/ etc.
        const phoneTrimmed = String(phone).trim();
        const existingPhone = await User.findOne({ phone: phoneTrimmed });
        if (existingPhone) return errorResponse(res, "Phone number already in use", 409);

        const empIdTrimmed = String(employeeId).trim();
        const existingEmpId = await User.findOne({ employeeId: empIdTrimmed, organizationId });
        if (existingEmpId) return errorResponse(res, "Employee ID already exists in this organization", 409);

        const existingAccount = await Account.findOne({ email: emailValidation.normalized });
        if (existingAccount) return errorResponse(res, "User Already Exists", 409);

        const hashedPassword = await bcrypt.hash(password, 10);

        const session = await mongoose.startSession();
        session.startTransaction();
        let user;
        try {
            ([user] = await User.create([{
                name: nameValidation.normalized,
                email: emailValidation.normalized,
                phone: phoneTrimmed,
                employeeId: empIdTrimmed,
                workType: workType.toLowerCase(),
                dateOfJoining: new Date(dojDate.toISOString().split('T')[0]),
                organizationId,
                role,
            }], { session }));

            await Account.create([{
                role,
                email: emailValidation.normalized,
                password: hashedPassword,
            }], { session });

            await session.commitTransaction();
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }

        const token = jwt.sign({ userId: user._id, role }, process.env.SECRET_KEY, {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h",
        });

        return successResponse(res, "Register Successful", {
            id: user._id,
            name: user.name,
            email: user.email,
            organizationId: user.organizationId,
            role: user.role,
        }, 201);
    }, "USER_AUTH_REGISTER_ERROR");

export const login = asyncHandler(
    async (req, res) => {
        const { userEmail, password } = req.body;

        const requiredCheck = validateRequiredFields({ userEmail, password }, ['userEmail', 'password']);
        if (!requiredCheck.valid) return errorResponse(res, requiredCheck.error);

        const emailValidation = validateEmail(userEmail);
        if (!emailValidation.valid) return errorResponse(res, emailValidation.error);

        const account = await Account.findOne({ email: emailValidation.normalized });
        if (!account || account.role === "admin") return errorResponse(res, "User does not exist", 401);

        const isMatch = await bcrypt.compare(password, account.password);
        if (!isMatch) return errorResponse(res, "Invalid credentials", 401);

        const userMetaDetails = await User.findOne({ email: emailValidation.normalized });
        if (!userMetaDetails) return errorResponse(res, "User profile does not exist", 401);

        const token = jwt.sign({ userId: userMetaDetails._id, role: account.role }, process.env.SECRET_KEY, {
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

        return successResponse(res, "Login Successful", formatUserDates(userMetaDetails));
    }, "USER_AUTH_LOGIN_ERROR");