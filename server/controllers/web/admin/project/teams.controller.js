import ProjectMember from "#models/ProjectMember.js";
import User from "#models/User.js";
import mongoose from "mongoose";
import pagination from "#helpers/pagination.js";
import { successResponse, errorResponse } from "#utils/response.helper.js";
import {
    validateObjectId,
    validateRequiredFields
} from "#utils/validators.js";

export const addProjectMember = asyncHandler(
    async (req, res) => {
        const { projectId, employeeIds, organizationId } = req.body;

        const requiredCheck = validateRequiredFields(
            { projectId, employeeIds, organizationId },
            ["projectId", "employeeIds", "organizationId"]
        );
        if (!requiredCheck.valid) return errorResponse(res, requiredCheck.error);

        if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
            return errorResponse(res, "employeeIds must be a non-empty array");
        }

        for (const [field, value] of [["Project ID", projectId], ["Organization ID", organizationId]]) {
            const v = validateObjectId(value, field);
            if (!v.valid) return errorResponse(res, v.error);
        }

        const users = await User.find({
            organizationId,
            $or: [
                { _id: { $in: employeeIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
                { employeeId: { $in: employeeIds } }
            ]
        });

        if (users.length === 0) {
            return errorResponse(res, "No valid employees found");
        }

        const validUserIds = users.map(user => user._id);
        
        const existingMembers = await ProjectMember.find({ 
            projectId, 
            userId: { $in: validUserIds } 
        });
        
        const existingUserIds = existingMembers.map(m => m.userId.toString());
        const newMembersToInsert = validUserIds
            .filter(id => !existingUserIds.includes(id.toString()))
            .map(userId => ({
                projectId,
                userId,
                organizationId
            }));

        if (newMembersToInsert.length === 0) {
            return errorResponse(res, "All provided employees are already in the project", 409);
        }

        const members = await ProjectMember.insertMany(newMembersToInsert);
        return successResponse(res, "Members added to project", { 
            addedCount: members.length,
            members 
        }, 201);
    },
    "ADD_PROJECT_MEMBER_ERROR");

export const getProjectMembers = asyncHandler(
    async (req, res) => {
        const { projectId, page = 1, limit = 10, search = "" } = req.query;

        if (!projectId) return errorResponse(res, "projectId is required");

        const idValidation = validateObjectId(projectId, "Project ID");
        if (!idValidation.valid) return errorResponse(res, idValidation.error);

        const filter = [
            { $match: { projectId: new mongoose.Types.ObjectId(projectId) } }
        ];

        filter.push({
            $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" }
        });
        filter.push({ $unwind: { path: "$user", preserveNullAndEmptyArrays: true } });

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
        filter.push({ $project: { user: 0 } });

        const results = await pagination(ProjectMember, page, limit, filter);
        return successResponse(res, "Project members fetched", {
            members: results.documents,
            totalRecords: results.totalRecords,
            totalPages: results.totalPages
        });
    },
    "GET_PROJECT_MEMBERS_ERROR");

export const getProjectMember = asyncHandler(
    async (req, res) => {
        const { id } = req.params;

        const idValidation = validateObjectId(id, "Member ID");
        if (!idValidation.valid) return errorResponse(res, idValidation.error);

        const [member] = await ProjectMember.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    pipeline: [{ $project: { name: 1, email: 1, employeeId: 1 } }],
                    as: "user"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "projects",
                    localField: "projectId",
                    foreignField: "_id",
                    pipeline: [{ $project: { name: 1, status: 1 } }],
                    as: "project"
                }
            },
            { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "organizations",
                    localField: "organizationId",
                    foreignField: "_id",
                    pipeline: [{ $project: { name: 1 } }],
                    as: "organization"
                }
            },
            { $unwind: { path: "$organization", preserveNullAndEmptyArrays: true } }
        ]);

        if (!member) return errorResponse(res, "Project member not found", 404);
        return successResponse(res, "Project member fetched", member);
    },
    "GET_PROJECT_MEMBER_ERROR");

export const updateProjectMember = asyncHandler(
    async (req, res) => {
        const { id } = req.params;
        const { isActive } = req.body;

        const idValidation = validateObjectId(id, "Member ID");
        if (!idValidation.valid) return errorResponse(res, idValidation.error);

        const member = await ProjectMember.findById(id);
        if (!member) return errorResponse(res, "Project member not found", 404);

        const updateData = {};

        if (isActive !== undefined) {
            if (typeof isActive !== "boolean") return errorResponse(res, "isActive must be a boolean");
            updateData.isActive = isActive;
        }

        if (Object.keys(updateData).length === 0) return errorResponse(res, "No valid fields to update");

        const updated = await ProjectMember.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        return successResponse(res, "Project member updated", updated);
    },
    "UPDATE_PROJECT_MEMBER_ERROR");

export const removeProjectMembers = asyncHandler(
    async (req, res) => {
        const { data: ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return errorResponse(res, "ids must be a non-empty array");
        }

        for (const id of ids) {
            const v = validateObjectId(id, "Member ID");
            if (!v.valid) return errorResponse(res, v.error);
        }

        const result = await ProjectMember.deleteMany({
            _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) }
        });

        if (result.deletedCount === 0) return errorResponse(res, "No matching members found to delete", 404);
        return successResponse(res, `${result.deletedCount} member(s) removed successfully`, { deletedCount: result.deletedCount });
    },
    "REMOVE_PROJECT_MEMBERS_ERROR");
