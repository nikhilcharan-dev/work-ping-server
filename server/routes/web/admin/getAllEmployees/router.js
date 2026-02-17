import {Router} from "express";

import getAllEmployeesPage from '#webController/admin/getAllEmployees/getAllEmployeesPage.js';
import getAllEmployeesByPageNumber from '#webController/admin/getAllEmployees/getAllEmployeesByPageNumber.js'

const router = Router();

router.get('/get-all-employees-page', getAllEmployeesPage);
router.post("/get-all-employees-by-page-number", getAllEmployeesByPageNumber);

export default router;