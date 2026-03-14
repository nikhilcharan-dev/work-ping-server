import Project, { requiredProjectFields, optionalProjectFields } from "#models/Project.js";
import { pick } from "#helpers/data.reducer.js";
import Pagination from "#helpers/pagination.js";
import OrgAdmin from "#models/Admin.Org.js";
import mongoose from "mongoose";
import { successResponse, errorResponse } from "#utils/response.helper.js";
import {
    validateObjectId,
    validateString,
    validatePagination
} from "#utils/validators.js";

export const createProject = asyncHandler(
    async (req, res) => {
        const requiredData = pick(req.body, requiredProjectFields);

        if (Object.keys(requiredData).length !== requiredProjectFields.length) {
            return errorResponse(res, "Missing required fields");
        }

        const data = {
            ...requiredData,
            ...pick(req.body, optionalProjectFields)
        };

        if (data.name) data.name = String(data.name).trim();

        const isExisting = await Project.findOne({ name: data.name, organizationId: data.organizationId });
        if (isExisting) return errorResponse(res, "Project already exists", 409);

        const project = await Project.create(data);
        return successResponse(res, "Project created successfully", project, 201);
    },
    "CREATE_PROJECT_ERROR");


export const getProjects = asyncHandler(
    async (req, res) => {
        let { organizationId, search = "", page = 1, limit = 10 } = req.query;

        const paginationValidation = validatePagination(page, limit);
        if (!paginationValidation.valid) return errorResponse(res, paginationValidation.error);

        page = Number(page);
        limit = Number(limit);

        let filter = [];

        if (search) {
            search = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.push({ $match: { name: { $regex: search, $options: "i" } } });
        }

        if (organizationId) {
            const orgValidation = validateObjectId(organizationId, "Organization ID");
            if (!orgValidation.valid) return errorResponse(res, orgValidation.error);
            filter.push({ $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } });
        } else {
            const orgAdmins = await OrgAdmin.find({ primaryAdmin: req.user.userId }, { organizationId: 1 });
            const organizationIds = orgAdmins.map(org => org.organizationId);

            if (organizationIds.length === 0) {
                return successResponse(res, "Projects fetched", { projects: [], totalPages: 0, totalRecords: 0 });
            }
            filter.push({ $match: { organizationId: { $in: organizationIds } } });
        }

        filter.push({
            $lookup: { from: "organizations", localField: "organizationId", foreignField: "_id", as: "organization" }
        });
        filter.push({
            $lookup: { from: "users", localField: "projectManager", foreignField: "_id", as: "manager" }
        });
        filter.push({
            $lookup: { from: "projectmembers", localField: "_id", foreignField: "projectId", as: "members" }
        });
        filter.push({
            $addFields: {
                organizationName: { $arrayElemAt: ["$organization.name", 0] },
                projectManagerName: { $arrayElemAt: ["$manager.name", 0] },
                memberCount: { $size: "$members" }
            }
        });
        filter.push({ $project: { members: 0, manager: 0, organization: 0 } });

        const pagination = await Pagination(Project, page, limit, filter);
        return successResponse(res, "Projects fetched", {
            projects: pagination.documents,
            totalPages: pagination.totalPages,
            totalRecords: pagination.totalRecords
        });
    },
    "GET_PROJECTS_ERROR");

export const getProject = asyncHandler(
    async (req, res) => {
        const { projectId: id } = req.query;

        const idValidation = validateObjectId(id, "Project ID");
        if (!idValidation.valid) return errorResponse(res, idValidation.error);

        const [project] = await Project.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: "users",
                    localField: "projectManager",
                    foreignField: "_id",
                    pipeline: [{ $project: { name: 1 } }],
                    as: "projectManager"
                }
            },
            { $unwind: { path: "$projectManager", preserveNullAndEmptyArrays: true } }
        ]);

        if (!project) return errorResponse(res, "Project not found", 404);
        return successResponse(res, "Project fetched", project);
    },
    "GET_PROJECT_ERROR");

export const updateProject = asyncHandler(
    async (req, res) => {
        const { id } = req.body;

        const idValidation = validateObjectId(id, "Project ID");
        if (!idValidation.valid) return errorResponse(res, idValidation.error);

        const project = await Project.findById(id);
        if (!project) return errorResponse(res, "Project not found", 404);

        const updateData = pick(req.body, [...requiredProjectFields, ...optionalProjectFields]);

        if (updateData.name) {
            const nameValidation = validateString(updateData.name, "Project name", { minLength: 2, maxLength: 200 });
            if (!nameValidation.valid) return errorResponse(res, nameValidation.error);
            updateData.name = nameValidation.normalized;
        }

        if (updateData.name && updateData.name !== project.name) {
            const isExisting = await Project.findOne({
                name: updateData.name,
                organizationId: project.organizationId,
                _id: { $ne: id }
            });
            if (isExisting) return errorResponse(res, "Project with this name already exists", 409);
        }

        const updatedProject = await Project.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        return successResponse(res, "Project updated successfully", updatedProject);
    },
    "UPDATE_PROJECT_ERROR");

export const deleteProject = asyncHandler(
    async (req, res) => {
        const { data: ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return errorResponse(res, "ids must be a non-empty array");
        }

        for (const id of ids) {
            const idValidation = validateObjectId(id, "Project ID");
            if (!idValidation.valid) return errorResponse(res, idValidation.error);
        }

        const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));
        const result = await Project.deleteMany({ _id: { $in: objectIds } });
        return successResponse(res, "Projects deleted successfully", { deletedCount: result.deletedCount });
    },
    "DELETE_PROJECT_ERROR");
