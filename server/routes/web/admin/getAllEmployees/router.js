import {Router} from "express";

import getOrgInfo from '#webController/admin/getAllEmployees/getOrgInfo.js';
import getAllEmployeesByPageNumber from '#webController/admin/getAllEmployees/getAllEmployeesByPageNumber.js'

const router = Router();

router.get('/get-org-info', getOrgInfo);
router.post("/get-all-employees-by-page-number", getAllEmployeesByPageNumber);

export default router;