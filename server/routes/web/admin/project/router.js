import { 
    createProject, 
    getProjects, 
    getProject, 
    updateProject, 
    deleteProject 
} from "#webController/admin/project/controller.js";
import { Router } from "express";

const router = Router();

router.post("/create-project", createProject);
router.get("/get-projects", getProjects);
router.get("/project/:id", getProject);
router.put("/project/:id", updateProject);
router.delete("/project/:id", deleteProject);

export default router;