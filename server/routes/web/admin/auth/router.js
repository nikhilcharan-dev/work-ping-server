import { Router } from 'express';
import { register, login } from "#webController/admin/auth/controller.js";
import {insertByFrom} from "#webController/admin/addEmployees/byForm.js";

const router = Router();

router.post('/register', register);

router.post("/login", login);

router.post("/test-fn", insertByFrom);

export default router;
