import express from "express";
import axios from "axios";
import FormData from "form-data";
import { upload } from "./multer.js";
import validateJWT from "../../../middleware/jwtBearer.js";

const router = express.Router();

router.post("/verify-mark-attendance", validateJWT,  upload.array("frames", 5), // 👈 matches frontend
    async (req, res) => {
        try {
            const userId = req.user.id;
            const frames = req.files;

            if (!frames || frames.length < 2) {
                return res.status(400).json({
                    status: "failed",
                    message: "Insufficient frames"
                });
            }

            // 🔁 Forward to Flask
            const formData = new FormData();

            frames.forEach((file, idx) => {
                formData.append("frames", file.buffer, {
                    filename: `frame_${idx}.jpg`,
                    contentType: file.mimetype
                });
            });

            formData.append("user_id", userId);

            const flaskRes = await axios.post(
                "http://127.0.0.1:5000/verify-attendance",
                formData,
                {
                    headers: formData.getHeaders(),
                    timeout: 15000
                }
            );

            const { verified, confidence } = flaskRes.data;

            // ❌ Verification failed
            if (!verified || confidence < 0.75) {
                return res.status(403).json({
                    status: "failed",
                    confidence
                });
            }

            // ✅ Mark attendance (DB)
            // await Attendance.create({
            //   userId,
            //   timestamp: new Date(),
            //   confidence
            // });

            return res.json({
                status: "marked",
                confidence
            });

        } catch (err) {
            console.error("Attendance verify error:", err.message);

            return res.status(500).json({
                status: "error",
                message: "Verification service unavailable"
            });
        }
    }
);



export default router;
