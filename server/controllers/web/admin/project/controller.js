import Project, { requiredProjectFields, optionalProjectFields  } from "#models/Project.js";
import { pick } from "#helpers/data.reducer.js";
import Pagination from "#helpers/pagination.js";

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
                    "name": {
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
    

        const pagination = await Pagination(Project,page, limit,filter);

        return res.status(200).json({
            projects: pagination.documents,
            totalPages: pagination.totalPages,
            totalRecords: pagination.totalRecords
        });
    },
    "GET_PROJECTS_ERROR");

export const getProject = asyncHandler(
    async (req, res) => {
        const { id } = req.params;

        const project = await Project.findById(id);

        if (!project) {
            return res.status(404).json({
                status: "error",
                error: "Project not found"
            });
        }

        return res.status(200).json({
            status: "success",
            data: project
        });
    },
    "GET_PROJECT_ERROR");

export const updateProject = asyncHandler(
    async (req, res) => {
        const { id } = req.params;

        const project = await Project.findById(id);

        if (!project) {
            return res.status(404).json({
                status: "error",
                error: "Project not found"
            });
        }

        const updateData = pick(req.body, [...requiredProjectFields, ...optionalProjectFields]);

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
        const { id } = req.params;

        const project = await Project.findById(id);

        if (!project) {
            return res.status(404).json({
                status: "error",
                error: "Project not found"
            });
        }

        await Project.findByIdAndDelete(id);

        return res.status(200).json({
            status: "success",
            message: "Project deleted successfully"
        });
    },
    "DELETE_PROJECT_ERROR");