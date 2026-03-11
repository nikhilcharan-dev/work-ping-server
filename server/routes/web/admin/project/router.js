import { 
    createProject, 
    getProjects, 
    getProject, 
    updateProject, 
    deleteProject 
} from "#webController/admin/project/project.controller.js";
import { Router } from "express";

const router = Router();

router.post("/create-project", createProject);
router.get("/get-projects", getProjects);
router.get("/get-project/:id", getProject);
router.put("/update-project/:id", updateProject);
router.post("/delete-projects", deleteProject);

export default router;