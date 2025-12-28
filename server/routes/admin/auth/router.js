import { Router } from 'express';
import {AppError} from "../../../utils/app.error.js";
import {register, login} from "../../../controllers/admin/auth/controller.js";

const router = Router();

router.post('/register', register);

router.post("/login", login);

export default router;
