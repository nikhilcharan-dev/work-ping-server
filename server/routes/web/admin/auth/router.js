import { Router } from 'express';
import * as Auth from "#webController/admin/auth/controller.js";

const router = Router();

router.post('/register', Auth.register);
router.post("/login", Auth.login);
router.post("/logout", Auth.logout);

export default router;
