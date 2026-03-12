import Leave from "#models/Leave.js";
import User from "#models/User.js";
import Organization from "#models/Organization.js";
import mongoose from "mongoose";
import Pagination from "#helpers/pagination.js";
import { successResponse, errorResponse } from "#utils/response.helper.js";
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

        const datesValidation = validateArray(dates, "Leave dates", {
            required: true,
            minLength: 1,
            maxLength: 365
        });
        if (!datesValidation.valid) return errorResponse(res, datesValidation.error);

        for (let i = 0; i < dates.length; i++) {
            const dateValidation = validateDate(dates[i], `Date at index ${i}`, { noPast: true });
            if (!dateValidation.valid) return errorResponse(res, dateValidation.error);
        }

        if (reason) {
            const reasonValidation = validateString(reason, "Reason", { maxLength: 500 });
            if (!reasonValidation.valid) return errorResponse(res, reasonValidation.error);
        }

        const user = await User.findById(userId);
        if (!user) return errorResponse(res, "User not found", 404);

        const organization = await Organization.findById(user.organizationId);
        if (!organization) return errorResponse(res, "Organization not found", 404);

        const leave = await Leave.create({
            userId,
            organizationId: user.organizationId,
            dates,
            reason: reason || "",
            appliedBy: userId,
            status: "pending"
        });

        return successResponse(res, "Leave application submitted successfully", leave, 201);
    }, "USER_APPLY_LEAVE_ERROR"
);

export const getMyLeaves = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        let { status, page = 1, limit = 10 } = req.query;

        if (status) {
            const statusValidation = validateEnum(status, ["pending", "approved", "rejected"], "Status");
            if (!statusValidation.valid) return errorResponse(res, statusValidation.error);
        }

        const filter = [{ $match: { userId: new mongoose.Types.ObjectId(userId) } }];
        if (status) filter.push({ $match: { status } });
        filter.push({ $sort: { createdAt: -1 } });

        const pagination = await Pagination(Leave, page, limit, filter);

        return successResponse(res, "Leaves fetched", {
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

        const idValidation = validateObjectId(leaveId, "Leave ID");
        if (!idValidation.valid) return errorResponse(res, idValidation.error);

        const [leave] = await Leave.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(leaveId), userId: new mongoose.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "approvedBy",
                    foreignField: "_id",
                    pipeline: [{ $project: { name: 1, email: 1 } }],
                    as: "approvedByUser"
                }
            },
            { $unwind: { path: "$approvedByUser", preserveNullAndEmptyArrays: true } }
        ]);

        if (!leave) return errorResponse(res, "Leave not found", 404);

        return successResponse(res, "Leave fetched", leave);
    }, "USER_GET_LEAVE_BY_ID_ERROR"
);

export const cancelLeave = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        const { leaveId } = req.params;

        const idValidation = validateObjectId(leaveId, "Leave ID");
        if (!idValidation.valid) return errorResponse(res, idValidation.error);

        const leave = await Leave.findOne({ _id: leaveId, userId });
        if (!leave) return errorResponse(res, "Leave not found", 404);

        if (leave.status !== "pending") return errorResponse(res, "Only pending leaves can be cancelled");

        await Leave.findByIdAndDelete(leaveId);

        return successResponse(res, "Leave cancelled successfully");
    }, "USER_CANCEL_LEAVE_ERROR"
);

export const getLeaveBalance = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;

        const user = await User.findById(userId);
        if (!user) return errorResponse(res, "User not found", 404);

        const organization = await Organization.findById(user.organizationId);
        if (!organization) return errorResponse(res, "Organization not found", 404);

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
                if (d >= startOfYear && d <= endOfYear) usedDays++;
            });
        });

        const totalCLDays = organization.clDays || 12;

        return successResponse(res, "Leave balance fetched", {
            totalCLDays,
            usedDays,
            remainingDays: totalCLDays - usedDays
        });
    }, "USER_LEAVE_BALANCE_ERROR"
);
