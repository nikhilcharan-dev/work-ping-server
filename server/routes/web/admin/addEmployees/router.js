import { Router } from "express";
import { insertByForm } from "#webController/admin/addEmployees/byForm.js";
const router = Router()

router.post("/byForm", insertByForm);

export default router;


