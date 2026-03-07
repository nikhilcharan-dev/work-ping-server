import axios from "axios";
import FormData from "form-data";
import { validateArray } from "#utils/validators.js";

export const verify_mark_attendance =  asyncHandler(async(req, res) => {
    const userId = req.user.userId;
    const frames = req.files;

    // Validate frames array
    const framesValidation = validateArray(frames, "Frames", {
        required: true,
        minLength: 2
    });
    if (!framesValidation.valid) {
        return res.status(400).json({
            status: "failed",
            message: framesValidation.error
        });
    }

    // Validate each frame file type
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    for (let i = 0; i < frames.length; i++) {
        if (!validMimeTypes.includes(frames[i].mimetype)) {
            return res.status(400).json({
                status: "failed",
                message: `Frame ${i + 1} has invalid file type. Only JPEG and PNG are allowed`
            });
        }
        
        // Validate file size (max 5MB per frame)
        if (frames[i].size > 5 * 1024 * 1024) {
            return res.status(400).json({
                status: "failed",
                message: `Frame ${i + 1} exceeds maximum size of 5MB`
            });
        }
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
        (process.env.FLASK_SERVICE_URI || "http://127.0.0.1:5000") + "/verify-attendance",
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
}, "USER_VERIFY_MARK_ATTENDANCE_ERROR");

