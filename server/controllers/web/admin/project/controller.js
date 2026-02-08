import Project, { requiredProje`    ctFields, optionalProjectFields  } from "#models/Project.js";
import { pick } from "#helpers/data.reducer.js";

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