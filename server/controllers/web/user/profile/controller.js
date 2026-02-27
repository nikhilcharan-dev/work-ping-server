import User from '#models/User.js';
import Account from "#models/Account.js";
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

export const getProfile = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;

        const user = await User.findById(userId)
            .populate({ path: "organizationId", select: "name type" })
            .populate({ path: "teamId", select: "teamName description" });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(user);
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
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
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
            userDetails: updatedUser
        });
    }, "USER_UPDATE_PROFILE_ERROR"
);

export const changePassword = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current password and new password are required" });
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
