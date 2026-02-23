import { Router } from 'express';
import { register, login, logout, forgot_password_send_otp, forgot_password_verify_otp, forgot_password_reset } from "#webController/admin/auth/controller.js";

const router = Router();

router.post('/register', register);

router.post("/login", login);

router.post("/logout", logout);

// Forgot password routes
router.post("/forgot-password/send-otp", forgot_password_send_otp);
router.post("/forgot-password/verify-otp", forgot_password_verify_otp);
router.post("/forgot-password/reset", forgot_password_reset);

export default router;
