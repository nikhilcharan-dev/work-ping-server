import express from "express";
import axios from "axios";
import FormData from "form-data";
import multer from "multer";
import https from "https";

import 'dotenv/config';


const agent = new https.Agent({
    rejectUnauthorized: false // allow self-signed
});

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

const FLASK_API = process.env.FLASK_API;

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

            // 🔁 Forward to Flask
            const formData = new FormData();
            formData.append("image", req.file.buffer, {
                filename: "frame.jpg",
                contentType: req.file.mimetype
            });


            // after nag broo setup flask add flask endpoint in env and update it in render.com
        console.log(`${FLASK_API}/recognize`);
            const flaskRes = await axios.post(
                `${FLASK_API}/recognize`, // 👈 Flask detect API
                formData,
                {
                    headers: formData.getHeaders(),
                    timeout: 100000
                },
                { httpsAgent: agent }
            );

            console.log(flaskRes.data);

            // 🔁 Return Flask response directly
            return res.status(200).json({
                status: "ok",
                roll: flaskRes.data
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
