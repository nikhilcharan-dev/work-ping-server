import User from '#models/User.js';
import Account from "#models/Account.js";
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { formatUserDates } from "#helpers/data.reducer.js";
import {
    validateEmail,
    validatePhone,
    validatePassword,
    validateName,
    validateDate,
    validateEnum,
    validateString,
    validateRequiredFields
} from "#utils/validators.js";

export const getProfile = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;

        const user = await User.findById(userId)
            .populate({ path: "organizationId", select: "name type" })
            .populate({ path: "teamId", select: "teamName description" });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(formatUserDates(user));
    }, "USER_GET_PROFILE_ERROR"
);

export const updateProfile = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const allowedFields = ["name", "phone", "gender", "dob", "address", "profileImage"];
        const updates = {};
        
        // Validate name if being updated
        if (req.body.name !== undefined) {
            const nameValidation = validateName(req.body.name);
            if (!nameValidation.valid) {
                return res.status(400).json({ error: nameValidation.error });
            }
            updates.name = nameValidation.normalized;
        }
        
        // Validate phone if being updated
        if (req.body.phone !== undefined) {
            const phoneValidation = validatePhone(req.body.phone);
            if (!phoneValidation.valid) {
                return res.status(400).json({ error: phoneValidation.error });
            }
            // Check phone uniqueness
            const existingPhone = await User.findOne({ 
                phone: phoneValidation.normalized, 
                _id: { $ne: userId } 
            });
            if (existingPhone) {
                return res.status(409).json({ error: "Phone number already in use" });
            }
            updates.phone = phoneValidation.normalized;
        }
        
        // Validate gender if being updated
        if (req.body.gender !== undefined) {
            const genderValidation = validateEnum(
                req.body.gender, 
                ["male", "female", "other"], 
                "Gender"
            );
            if (!genderValidation.valid) {
                return res.status(400).json({ error: genderValidation.error });
            }
            updates.gender = genderValidation.normalized;
        }
        
        // Validate DOB if being updated
        if (req.body.dob !== undefined) {
            const dobValidation = validateDate(
                req.body.dob, 
                "Date of birth", 
                { noFuture: true, minAge: 18 }
            );
            if (!dobValidation.valid) {
                return res.status(400).json({ error: dobValidation.error });
            }
            updates.dob = dobValidation.normalized;
        }
        
        // Validate address if being updated
        if (req.body.address !== undefined) {
            const addressValidation = validateString(
                req.body.address, 
                "Address", 
                { maxLength: 500 }
            );
            if (!addressValidation.valid) {
                return res.status(400).json({ error: addressValidation.error });
            }
            updates.address = addressValidation.normalized;
        }
        
        // Validate profile image if being updated
        if (req.body.profileImage !== undefined) {
            const profileImageValidation = validateString(
                req.body.profileImage, 
                "Profile image", 
                { maxLength: 500 }
            );
            if (!profileImageValidation.valid) {
                return res.status(400).json({ error: profileImageValidation.error });
            }
            updates.profileImage = profileImageValidation.normalized;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No valid fields to update" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            message: "Profile updated successfully",
            userDetails: formatUserDates(updatedUser)
        });
    }, "USER_UPDATE_PROFILE_ERROR"
);

export const changePassword = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        const { currentPassword, newPassword } = req.body;

        // Validate required fields
        const requiredCheck = validateRequiredFields(
            { currentPassword, newPassword },
            ['currentPassword', 'newPassword']
        );
        if (!requiredCheck.valid) {
            return res.status(400).json({ error: requiredCheck.error });
        }
        
        // Validate new password strength
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({ error: passwordValidation.error });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const account = await Account.findOne({ email: user.email, role: "user" });
        if (!account) {
            return res.status(404).json({ error: "Account not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, account.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }
        
        // Check if new password is same as current
        const isSamePassword = await bcrypt.compare(newPassword, account.password);
        if (isSamePassword) {
            return res.status(400).json({ error: "New password cannot be the same as current password" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        account.password = hashedPassword;
        await account.save();

        return res.status(200).json({ message: "Password changed successfully" });
    }, "USER_CHANGE_PASSWORD_ERROR"
);

export const deactivateAccount = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: "Password is required to deactivate account" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const account = await Account.findOne({ email: user.email, role: "user" });
        if (!account) {
            return res.status(404).json({ error: "Account not found" });
        }

        const isMatch = await bcrypt.compare(password, account.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid password" });
        }

        user.isActive = false;
        await user.save();

        const isLive = process.env.MODE === "production";
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: isLive,
            sameSite: isLive ? "none" : "lax",
            path: "/"
        });

        return res.status(200).json({ message: "Account deactivated successfully" });
    }, "USER_DEACTIVATE_ACCOUNT_ERROR"
);
