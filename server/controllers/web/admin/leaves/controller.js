import Leave from "#models/Leave.js";
import User from "#models/User.js";
import Organization from "#models/Organization.js";
import mongoose from "mongoose";
import Pagination from "#helpers/pagination.js";
import { successResponse, errorResponse } from "#utils/response.helper.js";
import { validateObjectId, validateEnum, validateString } from "#utils/validators.js";
import { sendWhatsApp } from "#services/whatsapp/whatsapp.service.js";

// GET /api/admin/leaves/all?organizationId=&status=&page=&limit=
export const getAllLeaves = asyncHandler(async (req, res) => {
    const { organizationId, status, page = 1, limit = 10 } = req.query;

    if (!organizationId) return errorResponse(res, "organizationId is required");

    const orgIdValidation = validateObjectId(organizationId, "Organization ID");
    if (!orgIdValidation.valid) return errorResponse(res, orgIdValidation.error);

    if (status) {
        const statusValidation = validateEnum(status, ["pending", "approved", "rejected"], "Status");
        if (!statusValidation.valid) return errorResponse(res, statusValidation.error);
    }

    const pipeline = [
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        ...(status ? [{ $match: { status } }] : []),
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                pipeline: [{ $project: { name: 1, email: 1, employeeId: 1, teamId: 1 } }],
                as: "employee",
            },
        },
        { $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "teams",
                localField: "employee.teamId",
                foreignField: "_id",
                pipeline: [{ $project: { teamName: 1 } }],
                as: "team",
            },
        },
        { $unwind: { path: "$team", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "users",
                localField: "approvedBy",
                foreignField: "_id",
                pipeline: [{ $project: { name: 1, email: 1 } }],
                as: "approvedByUser",
            },
        },
        { $unwind: { path: "$approvedByUser", preserveNullAndEmptyArrays: true } },
        { $addFields: { teamName: "$team.teamName" } },
        { $project: { team: 0 } },
        { $sort: { createdAt: -1 } },
    ];

    const pagination = await Pagination(Leave, page, limit, pipeline);

    return successResponse(res, "Leaves fetched", {
        totalRecords: pagination.totalRecords,
        totalPages: pagination.totalPages,
        leaves: pagination.documents,
    });
}, "ADMIN_GET_ALL_LEAVES");

// POST /api/admin/leaves/approve/:leaveId
export const approveLeave = asyncHandler(async (req, res) => {
    const { leaveId } = req.params;
    const { userId: adminId } = req.user;

    const idValidation = validateObjectId(leaveId, "Leave ID");
    if (!idValidation.valid) return errorResponse(res, idValidation.error);

    const leave = await Leave.findById(leaveId);
    if (!leave) return errorResponse(res, "Leave request not found", 404);

    if (leave.status !== "pending") return errorResponse(res, `Leave is already ${leave.status}`);

    leave.status = "approved";
    leave.approvedBy = adminId;
    await leave.save();

    // Notify employee — fire-and-forget
    User.findById(leave.userId).select("name phone").lean().then(emp => {
        if (!emp?.phone) return;
        const dateList = leave.dates.slice(0, 3).map(d => new Date(d).toLocaleDateString("en-IN")).join(", ")
            + (leave.dates.length > 3 ? ` +${leave.dates.length - 3} more` : "");
        sendWhatsApp(emp.phone,
            `*Leave Approved* ✅\nHi ${emp.name}, your leave request for *${leave.dates.length} day(s)* (${dateList}) has been *approved*.`
        ).catch(() => {});
    }).catch(() => {});

    return successResponse(res, "Leave approved successfully", leave);
}, "ADMIN_APPROVE_LEAVE");

// POST /api/admin/leaves/reject/:leaveId
export const rejectLeave = asyncHandler(async (req, res) => {
    const { leaveId } = req.params;
    const { userId: adminId } = req.user;
    const { reason } = req.body;

    const idValidation = validateObjectId(leaveId, "Leave ID");
    if (!idValidation.valid) return errorResponse(res, idValidation.error);

    if (reason) {
        const reasonValidation = validateString(reason, "Reason", { maxLength: 500 });
        if (!reasonValidation.valid) return errorResponse(res, reasonValidation.error);
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) return errorResponse(res, "Leave request not found", 404);

    if (leave.status !== "pending") return errorResponse(res, `Leave is already ${leave.status}`);

    leave.status = "rejected";
    leave.approvedBy = adminId;
    if (reason) leave.reason = reason;
    await leave.save();

    // Notify employee — fire-and-forget
    User.findById(leave.userId).select("name phone").lean().then(emp => {
        if (!emp?.phone) return;
        const dateList = leave.dates.slice(0, 3).map(d => new Date(d).toLocaleDateString("en-IN")).join(", ")
            + (leave.dates.length > 3 ? ` +${leave.dates.length - 3} more` : "");
        sendWhatsApp(emp.phone,
            `*Leave Rejected* ❌\nHi ${emp.name}, your leave request for *${leave.dates.length} day(s)* (${dateList}) has been *rejected*.${reason ? `\nReason: ${reason}` : ""}`
        ).catch(() => {});
    }).catch(() => {});

    return successResponse(res, "Leave rejected", leave);
}, "ADMIN_REJECT_LEAVE");

// GET /api/admin/leaves/pending-count
export const getPendingCount = asyncHandler(async (req, res) => {
    const count = await Leave.countDocuments({ status: "pending" });
    return successResponse(res, "Pending count fetched", { count });
}, "ADMIN_PENDING_COUNT_ERROR");
