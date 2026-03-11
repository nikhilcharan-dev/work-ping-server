import Project, { requiredProjectFields, optionalProjectFields  } from "#models/Project.js";
import { pick } from "#helpers/data.reducer.js";
import Pagination from "#helpers/pagination.js";
import OrgAdmin from "#models/Admin.Org.js"
import mongoose from "mongoose";
import {
    validateObjectId,
    validateString,
    validatePagination
} from "#utils/validators.js";

export const createProject = asyncHandler(
    async (req, res) => {

        const requiredData = pick(req.body, requiredProjectFields);

        if (Object.keys(requiredData).length !== requiredProjectFields.length) {
            return res.status(400).json({
                status: "error",
                error: "Missing required fields"
            });
        }

        const data = {
            ...requiredData,
            ...pick(req.body, optionalProjectFields)
        }

        const isExisting = await Project.findOne({
            name: data.name,
            organizationId: data.organizationId
        })

        if(isExisting) {
            return res.status(400).json({
                status: "error",
                error: "Project already exists"
            })
        }

        const project = await Project.create(data);

        return res.status(201).json({
            status: "success",
            data: project,
        })
    },
    "CREATE_PROJECT_ERROR");
export const getProjects = asyncHandler(
    async (req, res) => {
        let { organizationId, search="" , page = 1, limit = 10 } = req.query;
        
        let filter = []

        if (search) {
            search = search.trim()
            filter.push({
                $match: {
                    name: {
                        $regex: search,
                        $options: "i"
                    }
                }
            });
        }
    
        if (organizationId) {
            filter.push({
                $match: {
                    organizationId: new mongoose.Types.ObjectId(organizationId)
                }
            });
        }
        else {

            const orgAdmins = await OrgAdmin.find(
                { primaryAdmin: req.user.userId },
                { organizationId: 1 }
            );

            const organizationIds = orgAdmins.map(org => org.organizationId);

            filter.push({
                $match: {
                    organizationId: { $in: organizationIds }
                }
            });

        }

        // 🔹 Join Organization collection
        filter.push({
            $lookup: {
                from: "organizations",
                localField: "organizationId",
                foreignField: "_id",
                as: "organization"
            }
        });

        filter.push({
            $unwind: {
                path: "$organization",
                preserveNullAndEmptyArrays: true
            }
        });

        // 🔹 Return organization name
        filter.push({
            $addFields: {
                organizationName: "$organization.name"
            }
        });

        const pagination = await Pagination(Project,page, limit,filter);

        console.log("data ", pagination)

        return res.status(200).json({
            projects: pagination.documents,
            totalPages: pagination.totalPages,
            totalRecords: pagination.totalRecords
        });
    },
    "GET_PROJECTS_ERROR"
);
export const getProject = asyncHandler(
    async (req, res) => {
        const { id } = req.params;
        
        // Validate project ID
        const idValidation = validateObjectId(id, "Project ID");
        if (!idValidation.valid) {
            return res.status(400).json({
                status: "error",
                error: idValidation.error
            });
        }

        const project = await Project.findById(id);

        if (!project) {
            return res.status(404).json({
                status: "error",
                error: "Project not found"
            });
        }

        return res.status(200).json({
            ...project
        });
    },
    "GET_PROJECT_ERROR");

export const updateProject = asyncHandler(
    async (req, res) => {
        const { id } = req.params;
        
        // Validate project ID
        const idValidation = validateObjectId(id, "Project ID");
        if (!idValidation.valid) {
            return res.status(400).json({
                status: "error",
                error: idValidation.error
            });
        }

        const project = await Project.findById(id);

        if (!project) {
            return res.status(404).json({
                status: "error",
                error: "Project not found"
            });
        }

        const updateData = pick(req.body, [...requiredProjectFields, ...optionalProjectFields]);
        
        // Validate name if being updated
        if (updateData.name) {
            const nameValidation = validateString(updateData.name, "Project name", {
                minLength: 2,
                maxLength: 200
            });
            if (!nameValidation.valid) {
                return res.status(400).json({
                    status: "error",
                    error: nameValidation.error
                });
            }
        }

        if (updateData.name && updateData.name !== project.name) {
            const isExisting = await Project.findOne({
                name: updateData.name,
                organizationId: project.organizationId,
                _id: { $ne: id }
            });

            if (isExisting) {
                return res.status(400).json({
                    status: "error",
                    error: "Project with this name already exists"
                });
            }
        }

        const updatedProject = await Project.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            status: "success",
            data: updatedProject
        });
    },
    "UPDATE_PROJECT_ERROR");
export const deleteProject = asyncHandler(
  async (req, res) => {
    const { data : ids } = req.body; // expecting array of ids

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: "error",
        error: "ids must be a non-empty array",
      });
    }

    // Validate all IDs
    for (const id of ids) {
      const idValidation = validateObjectId(id, "Project ID");
      if (!idValidation.valid) {
        return res.status(400).json({
          status: "error",
          error: idValidation.error,
        });
      }
    }

    // Convert to ObjectId if needed
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

    // Delete projects
    const result = await Project.deleteMany({
      _id: { $in: objectIds },
    });

    return res.status(200).json({
      status: "success",
      message: "Projects deleted successfully",
      deletedCount: result.deletedCount,
    });
  },
  "DELETE_PROJECT_ERROR"
);