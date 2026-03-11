import ProjectMember from "#models/ProjectMember.js";
import mongoose from "mongoose";
import pagination from "#helpers/pagination.js";
import {
    validateObjectId,
    validateRequiredFields
} from "#utils/validators.js";

const VALID_ROLES = ["manager", "developer", "tester"];

export const addProjectMember = asyncHandler(
    async (req, res) => {
        const { projectId, userId, organizationId, role = "developer" } = req.body;

        const requiredCheck = validateRequiredFields(
            { projectId, userId, organizationId },
            ["projectId", "userId", "organizationId"]
        );
        if (!requiredCheck.valid) {
            return res.status(400).json({ status: "error", error: requiredCheck.error });
        }

        for (const [field, value] of [["Project ID", projectId], ["User ID", userId], ["Organization ID", organizationId]]) {
            const v = validateObjectId(value, field);
            if (!v.valid) return res.status(400).json({ status: "error", error: v.error });
        }

        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({
                status: "error",
                error: `role must be one of: ${VALID_ROLES.join(", ")}`
            });
        }

        const existing = await ProjectMember.findOne({ projectId, userId });
        if (existing) {
            return res.status(400).json({
                status: "error",
                error: "User is already a member of this project"
            });
        }

        const member = await ProjectMember.create({ projectId, userId, organizationId, role });

        return res.status(201).json({
            status: "success",
            data: member
        });
    },
    "ADD_PROJECT_MEMBER_ERROR"
);

export const getProjectMembers = asyncHandler(
    async (req, res) => {
        const { projectId, page = 1, limit = 10, search = "", role } = req.query;

        if (!projectId) {
            return res.status(400).json({ status: "error", error: "projectId is required" });
        }

        const idValidation = validateObjectId(projectId, "Project ID");
        if (!idValidation.valid) {
            return res.status(400).json({ status: "error", error: idValidation.error });
        }

        const filter = [
            { $match: { projectId: new mongoose.Types.ObjectId(projectId) } }
        ];

        if (role && VALID_ROLES.includes(role)) {
            filter.push({ $match: { role } });
        }

        filter.push({
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }
        });

        filter.push({
            $unwind: { path: "$user", preserveNullAndEmptyArrays: true }
        });

        if (search.trim()) {
            filter.push({
                $match: {
                    "user.name": {
                        $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                        $options: "i"
                    }
                }
            });
        }

        filter.push({
            $addFields: {
                userName: "$user.name",
                userEmail: "$user.email",
                employeeId: "$user.employeeId"
            }
        });

        filter.push({
            $project: { user: 0 }
        });

        const results = await pagination(ProjectMember, page, limit, filter);

        return res.status(200).json({
            status: "success",
            members: results.documents,
            totalRecords: results.totalRecords,
            totalPages: results.totalPages
        });
    },
    "GET_PROJECT_MEMBERS_ERROR"
);

export const getProjectMember = asyncHandler(
    async (req, res) => {
        const { id } = req.params;

        const idValidation = validateObjectId(id, "Member ID");
        if (!idValidation.valid) {
            return res.status(400).json({ status: "error", error: idValidation.error });
        }

        const member = await ProjectMember.findById(id)
            .populate({ path: "userId", select: "name email employeeId" })
            .populate({ path: "projectId", select: "name status" })
            .populate({ path: "organizationId", select: "name" });

        if (!member) {
            return res.status(404).json({ status: "error", error: "Project member not found" });
        }

        return res.status(200).json({ status: "success", data: member });
    },
    "GET_PROJECT_MEMBER_ERROR"
);

export const updateProjectMember = asyncHandler(
    async (req, res) => {
        const { id } = req.params;
        const { role, isActive } = req.body;

        const idValidation = validateObjectId(id, "Member ID");
        if (!idValidation.valid) {
            return res.status(400).json({ status: "error", error: idValidation.error });
        }

        const member = await ProjectMember.findById(id);
        if (!member) {
            return res.status(404).json({ status: "error", error: "Project member not found" });
        }

        const updateData = {};

        if (role !== undefined) {
            if (!VALID_ROLES.includes(role)) {
                return res.status(400).json({
                    status: "error",
                    error: `role must be one of: ${VALID_ROLES.join(", ")}`
                });
            }
            updateData.role = role;
        }

        if (isActive !== undefined) {
            if (typeof isActive !== "boolean") {
                return res.status(400).json({ status: "error", error: "isActive must be a boolean" });
            }
            updateData.isActive = isActive;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ status: "error", error: "No valid fields to update" });
        }

        const updated = await ProjectMember.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        return res.status(200).json({ status: "success", data: updated });
    },
    "UPDATE_PROJECT_MEMBER_ERROR"
);

export const removeProjectMembers = asyncHandler(
    async (req, res) => {
        const { data: ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ status: "error", error: "ids must be a non-empty array" });
        }

        for (const id of ids) {
            const v = validateObjectId(id, "Member ID");
            if (!v.valid) return res.status(400).json({ status: "error", error: v.error });
        }

        const result = await ProjectMember.deleteMany({
            _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) }
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ status: "error", error: "No matching members found to delete" });
        }

        return res.status(200).json({
            status: "success",
            message: `${result.deletedCount} member(s) removed successfully`
        });
    },
    "REMOVE_PROJECT_MEMBERS_ERROR"
);
