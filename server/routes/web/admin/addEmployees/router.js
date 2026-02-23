import { Router } from "express";
import insertByForm from "#webController/admin/addEmployees/byForm.js";
import insertByExcel from "#webController/admin/addEmployees/byExcel.js";
import uploadExcel from "#middleware/uploadExcel.js";

const router = Router()

router.post("/by-form", insertByForm);
router.post("/by-excel", uploadExcel.single('file') ,insertByExcel);

export default router;