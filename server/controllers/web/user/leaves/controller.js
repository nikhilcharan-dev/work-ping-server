import Leave from "#models/Leave.js";
import User from "#models/User.js";
import Organization from "#models/Organization.js";
import mongoose from "mongoose";
import Pagination from "#helpers/pagination.js";
import {
    validateObjectId,
    validateArray,
    validateString,
    validateDate,
    validateEnum
} from "#utils/validators.js";

export const applyLeave = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        const { dates, reason } = req.body;

        // Validate dates array
        const datesValidation = validateArray(dates, "Leave dates", {
            required: true,
            minLength: 1,
            maxLength: 365
        });
        if (!datesValidation.valid) {
            return res.status(400).json({ error: datesValidation.error });
        }
        
        // Validate each date in the array
        for (let i = 0; i < dates.length; i++) {
            const dateValidation = validateDate(dates[i], `Date at index ${i}`, {
                noPast: true
            });
            if (!dateValidation.valid) {
                return res.status(400).json({ error: dateValidation.error });
            }
        }
        
        // Validate reason if provided
        if (reason) {
            const reasonValidation = validateString(reason, "Reason", {
                maxLength: 500
            });
            if (!reasonValidation.valid) {
                return res.status(400).json({ error: reasonValidation.error });
            }
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const organization = await Organization.findById(user.organizationId);
        if (!organization) {
            return res.status(404).json({ error: "Organization not found" });
        }

        const leave = await Leave.create({
            userId,
            organizationId: user.organizationId,
            dates,
            reason: reason || "",
            appliedBy: userId,
            status: "pending"
        });

        return res.status(201).json({
            message: "Leave application submitted successfully",
            leaveDetails: leave
        });
    }, "USER_APPLY_LEAVE_ERROR"
);

export const getMyLeaves = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        let { status, page = 1, limit = 10 } = req.query;
        
        // Validate status if provided
        if (status) {
            const statusValidation = validateEnum(
                status,
                ["pending", "approved", "rejected"],
                "Status"
            );
            if (!statusValidation.valid) {
                return res.status(400).json({ error: statusValidation.error });
            }
        }

        const filter = [
            { $match: { userId: new mongoose.Types.ObjectId(userId) } }
        ];

        if (status) {
            filter.push({ $match: { status } });
        }

        filter.push({ $sort: { createdAt: -1 } });

        const pagination = await Pagination(Leave, page, limit, filter);

        return res.status(200).json({
            totalRecords: pagination.totalRecords,
            totalPages: pagination.totalPages,
            leaves: pagination.documents
        });
    }, "USER_GET_LEAVES_ERROR"
);

export const getLeaveById = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        const { leaveId } = req.params;

        // Validate leave ID
        const idValidation = validateObjectId(leaveId, "Leave ID");
        if (!idValidation.valid) {
            return res.status(400).json({ error: idValidation.error });
        }

        const leave = await Leave.findOne({ _id: leaveId, userId })
            .populate({ path: "approvedBy", select: "name email" });

        if (!leave) {
            return res.status(404).json({ error: "Leave not found" });
        }

        return res.status(200).json(leave);
    }, "USER_GET_LEAVE_BY_ID_ERROR"
);

export const cancelLeave = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        const { leaveId } = req.params;

        // Validate leave ID
        const idValidation = validateObjectId(leaveId, "Leave ID");
        if (!idValidation.valid) {
            return res.status(400).json({ error: idValidation.error });
        }

        const leave = await Leave.findOne({ _id: leaveId, userId });

        if (!leave) {
            return res.status(404).json({ error: "Leave not found" });
        }

        if (leave.status !== "pending") {
            return res.status(400).json({ error: "Only pending leaves can be cancelled" });
        }

        await Leave.findByIdAndDelete(leaveId);

        return res.status(200).json({ message: "Leave cancelled successfully" });
    }, "USER_CANCEL_LEAVE_ERROR"
);

export const getLeaveBalance = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const organization = await Organization.findById(user.organizationId);
        if (!organization) {
            return res.status(404).json({ error: "Organization not found" });
        }

        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

        const approvedLeaves = await Leave.find({
            userId,
            status: "approved",
            dates: { $elemMatch: { $gte: startOfYear, $lte: endOfYear } }
        });

        let usedDays = 0;
        approvedLeaves.forEach(leave => {
            leave.dates.forEach(date => {
                const d = new Date(date);
                if (d >= startOfYear && d <= endOfYear) {
                    usedDays++;
                }
            });
        });

        const totalCLDays = organization.clDays || 12;

        return res.status(200).json({
            totalCLDays,
            usedDays,
            remainingDays: totalCLDays - usedDays
        });
    }, "USER_LEAVE_BALANCE_ERROR"
);
