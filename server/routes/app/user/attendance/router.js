import express from "express";
import { upload } from "./multer.js";
import validateJWT from "../../../../middleware/jwtBearer.js";
import { verify_mark_attendance } from "../../../../controllers/app/user/attendance/controller.js";

const router = express.Router();

router.post("/verify-mark-attendance", validateJWT,  upload.array("frames", 5), // 👈 matches frontend
    verify_mark_attendance    
);

export default router;
