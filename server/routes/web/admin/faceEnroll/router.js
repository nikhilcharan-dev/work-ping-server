import { Router } from "express";
import multer from "multer";
import { enrollEmployeeFace } from "#webController/admin/faceEnroll/controller.js";

const router = Router();

const faceUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.post("/:id/enroll-face", faceUpload.single("face_photo"), enrollEmployeeFace);

export default router;
