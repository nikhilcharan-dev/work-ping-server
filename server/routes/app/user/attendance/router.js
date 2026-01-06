import express from "express";
import { upload } from "./multer.js";
import validateCookie from "#middleware/jwtBearer.js";
import { verify_mark_attendance } from "#appController/user/attendance/controller.js";

const router = express.Router();

router.post("/verify-mark-attendance", validateCookie,  upload.array("frames", 5), // 👈 matches frontend
    verify_mark_attendance    
);

export default router;
