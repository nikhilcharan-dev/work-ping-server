import { createProject } from "#webController/admin/project/controller.js";
import { Router } from "express";

const router = Router();

router.post("/create-project", createProject);

export default router;