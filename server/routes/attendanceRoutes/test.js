import express from "express";
import multer from "multer";
import 'dotenv/config';

import recognize from "../../services/faceRecognition/model.js";

const router = express.Router();

/* ---------------------------
   Multer (memory storage)
---------------------------- */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB
    }
});

/* ---------------------------
   TEST: React → Node → Flask
---------------------------- */
router.post(
    "/test-detect-face",
    upload.single("image"), // React must send key: "image"
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    status: "failed",
                    message: "No image received"
                });
            }

            const faceResponse = await recognize(req);

            console.log(faceResponse);

            return res.status(200).json({
                status: "ok",
                ...faceResponse
            });

        } catch (err) {
            console.error("Test detect error:", err.message);
            return res.status(500).json({
                status: "error",
                message: "Flask detect failed"
            });
        }
    }
);

export default router;
