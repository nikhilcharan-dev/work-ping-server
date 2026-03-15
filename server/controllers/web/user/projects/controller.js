import Project from "#models/Project.js";
import ProjectMember from "#models/ProjectMember.js";
import User from "#models/User.js";
import mongoose from "mongoose";
import Pagination from "#helpers/pagination.js";
import { successResponse, errorResponse } from "#utils/response.helper.js";
import {
    validateObjectId,
    validateEnum
} from "#utils/validators.js";

export const getMyProjects = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        let { page = 1, limit = 10, status } = req.query;

        if (status) {
            const statusValidation = validateEnum(status, ["active", "completed", "onHold"], "Status");
            if (!statusValidation.valid) return errorResponse(res, statusValidation.error);
        }

        const filter = [
            { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
            {
                $lookup: {
                    from: "projects",
                    localField: "projectId",
                    foreignField: "_id",
                    as: "project"
                }
            },
            { $unwind: "$project" }
        ];

        if (status) filter.push({ $match: { "project.status": status } });
        filter.push({ $sort: { "project.createdAt": -1 } });

        const pagination = await Pagination(ProjectMember, page, limit, filter);

        return successResponse(res, "Projects fetched", {
            totalRecords: pagination.totalRecords,
            totalPages: pagination.totalPages,
            projects: pagination.documents
        });
    }, "USER_GET_MY_PROJECTS_ERROR"
);

export const getProjectById = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        const { projectId } = req.params;

        const idValidation = validateObjectId(projectId, "Project ID");
        if (!idValidation.valid) return errorResponse(res, idValidation.error);

        const membership = await ProjectMember.findOne({ projectId, userId, isActive: true });
        if (!membership) return errorResponse(res, "You are not a member of this project", 403);

        const [project] = await Project.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "projectManager",
                    foreignField: "_id",
                    pipeline: [{ $project: { name: 1, email: 1, employeeId: 1, workType: 1, profileImage: 1 } }],
                    as: "projectManager"
                }
            },
            { $unwind: { path: "$projectManager", preserveNullAndEmptyArrays: true } },
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

        if (!project) return errorResponse(res, "Project not found", 404);

        return successResponse(res, "Project fetched", { project });
    }, "USER_GET_PROJECT_BY_ID_ERROR"
);

export const getProjectMembers = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        const { projectId } = req.params;

        const idValidation = validateObjectId(projectId, "Project ID");
        if (!idValidation.valid) return errorResponse(res, idValidation.error);

        const membership = await ProjectMember.findOne({ projectId, userId, isActive: true });
        if (!membership) return errorResponse(res, "You are not a member of this project", 403);

        const members = await ProjectMember.aggregate([
            { $match: { projectId: new mongoose.Types.ObjectId(projectId), isActive: true } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    pipeline: [{ $project: { name: 1, email: 1, phone: 1, role: 1, profileImage: 1, employeeId: 1, workType: 1 } }],
                    as: "user"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } }
        ]);

        return successResponse(res, "Project members fetched", members);
    }, "USER_GET_PROJECT_MEMBERS_ERROR"
);
