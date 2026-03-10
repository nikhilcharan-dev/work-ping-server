import { getEmployee } from "#webController/admin/addEmployees/controller.js";
import { Router } from "express";

const router = Router();

router.get("/get-employee/:id", getEmployee);

export default router;