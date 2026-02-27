import Project from "#models/Project.js";
import ProjectMember from "#models/ProjectMember.js";
import User from "#models/User.js";
import mongoose from "mongoose";
import Pagination from "#helpers/pagination.js";

export const getMyProjects = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        let { page = 1, limit = 10, status } = req.query;

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

        if (status) {
            filter.push({ $match: { "project.status": status } });
        }

        filter.push({ $sort: { "project.createdAt": -1 } });

        const pagination = await Pagination(ProjectMember, page, limit, filter);

        return res.status(200).json({
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

        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: "Invalid projectId" });
        }

        const membership = await ProjectMember.findOne({
            projectId,
            userId,
            isActive: true
        });

        if (!membership) {
            return res.status(403).json({ error: "You are not a member of this project" });
        }

        const project = await Project.findById(projectId)
            .populate({ path: "projectManager", select: "name email" })
            .populate({ path: "organizationId", select: "name" });

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        return res.status(200).json({
            project,
            myRole: membership.role
        });
    }, "USER_GET_PROJECT_BY_ID_ERROR"
);

export const getProjectMembers = asyncHandler(
    async (req, res) => {
        const { userId } = req.user;
        const { projectId } = req.params;

        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: "Invalid projectId" });
        }

        const membership = await ProjectMember.findOne({
            projectId,
            userId,
            isActive: true
        });

        if (!membership) {
            return res.status(403).json({ error: "You are not a member of this project" });
        }

        const members = await ProjectMember.find({
            projectId,
            isActive: true
        }).populate({ path: "userId", select: "name email phone roleInTeam profileImage" });

        return res.status(200).json(members);
    }, "USER_GET_PROJECT_MEMBERS_ERROR"
);
