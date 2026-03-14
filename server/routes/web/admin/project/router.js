import {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject
} from "#webController/admin/project/project.controller.js";
import {
    addProjectMember,
    getProjectMembers,
    getProjectMember,
    updateProjectMember,
    removeProjectMembers
} from "#webController/admin/project/teams.controller.js";
import { Router } from "express";

const router = Router();

router.get("/", getProjects);
router.post("/create-project", createProject);
router.get("/get-projects", getProjects);
router.get("/get-project", getProject);
router.post("/update-project", updateProject);
router.post("/delete-projects", deleteProject);

// Project Members
router.post("/add-member", addProjectMember);
router.get("/get-members", getProjectMembers);
router.get("/get-member/:id", getProjectMember);
router.put("/update-member/:id", updateProjectMember);
router.post("/remove-members", removeProjectMembers);

export default router;