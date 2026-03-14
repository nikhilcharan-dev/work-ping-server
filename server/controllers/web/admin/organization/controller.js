import mongoose from 'mongoose';
import Organization from '#models/Organization.js';
import OrgAdmin from '#models/Admin.Org.js';
import Admin from '#models/Admin.js'
import Pagination from "#helpers/pagination.js";
import AdminOrg from "#models/Admin.Org.js";
import { successResponse, errorResponse } from "#utils/response.helper.js";
import {
    validateObjectId,
    validateString,
    validateNumber,
    validatePagination
} from "#utils/validators.js";

const formatOrg = (org) => {
    if (!org) return org;
    if (org.foundedAt) {
        const date = new Date(org.foundedAt);
        if (!isNaN(date.getTime())) {
            org.foundedAt = date.toISOString().split('T')[0];
        }
    }
    return org;
};

const existingOrganizationWithSameName = async (organizationName) => {
    return await Organization.findOne({ name: organizationName });
};

const addOrganization = asyncHandler(async (req, res) => {
    let { name, type, description, clDays, foundedAt, IPWhitelist } = req.body;

    const nameValidation = validateString(name, "Organization name", {
        required: true,
        minLength: 2,
        maxLength: 100
    });
    if (!nameValidation.valid) return errorResponse(res, nameValidation.error);

    if (clDays !== undefined) {
        const clDaysValidation = validateNumber(clDays, "CL Days", { min: 0, max: 365, integer: true });
        if (!clDaysValidation.valid) return errorResponse(res, clDaysValidation.error);
        clDays = clDaysValidation.normalized;
    }

    let { userId } = req.user;
    userId = new mongoose.Types.ObjectId(userId);

    const duplicate = await existingOrganizationWithSameName(nameValidation.normalized);
    if (duplicate) return errorResponse(res, "Organization Name is already taken", 409);

    const orgData = { name: nameValidation.normalized };
    if (type !== undefined) orgData.type = String(type).trim();
    if (description !== undefined) orgData.description = String(description).trim();
    if (clDays !== undefined) orgData.clDays = clDays;
    if (foundedAt !== undefined) orgData.foundedAt = foundedAt;
    if (IPWhitelist !== undefined) orgData.IPWhitelist = Array.isArray(IPWhitelist) ? IPWhitelist : [IPWhitelist];
    if (req.body.coordinates !== undefined) orgData.coordinates = req.body.coordinates;
    if (req.body.msl !== undefined) orgData.msl = String(req.body.msl).trim();

    const session = await mongoose.startSession();
    session.startTransaction();
    let newOrganization;
    try {
        ([newOrganization] = await Organization.create([orgData], { session }));
        await OrgAdmin.create([{
            organizationId: newOrganization._id,
            primaryAdmin: userId,
        }], { session });
        await session.commitTransaction();
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }

    return successResponse(res, "Organization created successfully", newOrganization, 201);
}, "ADMIN_ADD_ORG_ERROR");

const getOrganizationsOfAdmin = asyncHandler(async (req, res) => {
    let { userId } = req.user;
    userId = new mongoose.Types.ObjectId(userId);

    const existingAdmin = await Admin.findById(userId);
    if (!existingAdmin) return errorResponse(res, "Admin doesn't exist", 404);

    let { search = "", page = 1, limit = 10 } = req.query;
    search = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    page = Number(page);

    const filter = [
        { $match: { primaryAdmin: userId } },
        {
            $lookup: {
                from: "organizations",
                localField: "organizationId",
                foreignField: "_id",
                as: "organization"
            }
        },
        { $unwind: "$organization" },
        {
            $match: {
                "organization.name": { $regex: search, $options: "i" }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "organizationId",
                foreignField: "organizationId",
                as: "employees"
            }
        },
        {
            $lookup: {
                from: "teams",
                localField: "organizationId",
                foreignField: "organizationId",
                as: "teams"
            }
        },
        {
            $addFields: {
                "organization.employeeCount": { $size: "$employees" },
                "organization.teamCount": { $size: "$teams" }
            }
        },
        { $sort: { "organization.name": 1 } },
    ];

    const pagination = await Pagination(AdminOrg, page, limit, filter);
    const organizations = pagination.documents.map(item => formatOrg(item.organization));

    return successResponse(res, "Organizations fetched", {
        totalRecords: pagination.totalRecords,
        totalPages: pagination.totalPages,
        organizations
    });
}, "ADMIN_GET_ORG_ERROR");

const updateOrganization = asyncHandler(async (req, res) => {
    const { _id } = req.body;

    const idValidation = validateObjectId(_id, "Organization ID");
    if (!idValidation.valid) return errorResponse(res, idValidation.error);

    const updates = {};

    if (req.body.name !== undefined) {
        const nameValidation = validateString(req.body.name, "Organization name", { minLength: 2, maxLength: 100 });
        if (!nameValidation.valid) return errorResponse(res, nameValidation.error);
        
        const duplicate = await existingOrganizationWithSameName(nameValidation.normalized);
        if (duplicate && duplicate._id.toString() !== _id.toString()) {
            return errorResponse(res, "Organization Name is already taken", 409);
        }
        
        updates.name = nameValidation.normalized;
    }

    if (req.body.clDays !== undefined) {
        const clDaysValidation = validateNumber(req.body.clDays, "CL Days", { min: 0, max: 365, integer: true });
        if (!clDaysValidation.valid) return errorResponse(res, clDaysValidation.error);
        updates.clDays = clDaysValidation.normalized;
    }

    if (req.body.description !== undefined) updates.description = String(req.body.description).trim();
    if (req.body.type !== undefined) updates.type = String(req.body.type).trim();
    if (req.body.foundedAt !== undefined) updates.foundedAt = req.body.foundedAt;
    if (req.body.IPWhitelist !== undefined) updates.IPWhitelist = Array.isArray(req.body.IPWhitelist) ? req.body.IPWhitelist : [req.body.IPWhitelist];
    if (req.body.coordinates !== undefined) updates.coordinates = req.body.coordinates;
    if (req.body.msl !== undefined) updates.msl = String(req.body.msl).trim();

    const existingOrganization = await Organization.findById(_id);
    if (!existingOrganization) return errorResponse(res, "Organization doesn't exist", 404);

    const updated = await Organization.findByIdAndUpdate(_id, updates, { new: true, runValidators: true }).lean();
    return successResponse(res, "Organization updated successfully", formatOrg(updated));
}, "ADMIN_UPDATE_ORG_ERROR");

const getOrganizationById = asyncHandler(async (req, res) => {
    const { id: organizationId } = req.params;

    const idValidation = validateObjectId(organizationId, "Organization ID");
    if (!idValidation.valid) return errorResponse(res, idValidation.error);

    const existingOrganization = await Organization.findById(organizationId).lean();
    if (!existingOrganization) return errorResponse(res, "Organization doesn't exist", 404);

    return successResponse(res, "Organization fetched", formatOrg(existingOrganization));
}, "ADMIN_GET_ORG_BY_ID_ERROR");

const deleteOrganization = asyncHandler(async (req, res) => {
    const { data: organizationIds } = req.body;

    if (!Array.isArray(organizationIds) || organizationIds.length === 0) {
        return errorResponse(res, "organizationIds must be a non-empty array");
    }

    for (const organizationId of organizationIds) {
        const idValidation = validateObjectId(organizationId, "Organization ID");
        if (!idValidation.valid) return errorResponse(res, idValidation.error);
    }

    const objectIds = organizationIds.map(id => new mongoose.Types.ObjectId(id));

    const existingOrganizations = await Organization.find({ _id: { $in: objectIds } }).lean();
    if (existingOrganizations.length === 0) return errorResponse(res, "Organizations don't exist", 404);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        await OrgAdmin.deleteMany({ organizationId: { $in: objectIds } }, { session });
        await Organization.deleteMany({ _id: { $in: objectIds } }, { session });
        await session.commitTransaction();
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }

    return successResponse(res, "Organizations deleted successfully", { deletedCount: existingOrganizations.length });
}, "ADMIN_DELETE_ORG_ERROR");

const getOrganizationIDsOfAdmin = asyncHandler(async (req, res) => {
    let { userId } = req.user;
    userId = new mongoose.Types.ObjectId(userId);

    const existingAdmin = await Admin.findById(userId);
    if (!existingAdmin) return errorResponse(res, "Admin doesn't exist", 404);

    const organizationIds = await OrgAdmin.aggregate([
        { $match: { primaryAdmin: userId } },
        {
            $lookup: {
                from: "organizations",
                localField: "organizationId",
                foreignField: "_id",
                pipeline: [{ $project: { _id: 1, name: 1 } }],
                as: "org"
            }
        },
        { $unwind: "$org" },
        {
            $project: {
                _id: 0,
                organizationId: "$org._id",
                name: "$org.name"
            }
        }
    ]);

    return successResponse(res, "Organization IDs fetched", organizationIds);
}, "ADMIN_GET_ORG_IDS_ERROR");


export {
    addOrganization,
    updateOrganization,
    getOrganizationById,
    getOrganizationsOfAdmin,
    deleteOrganization,
    getOrganizationIDsOfAdmin
}
