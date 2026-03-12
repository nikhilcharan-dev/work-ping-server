import axios from "axios";
import FormData from "form-data";
import { validateArray } from "#utils/validators.js";
import { successResponse, errorResponse } from "#utils/response.helper.js";

export const verify_mark_attendance = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const frames = req.files;

    const framesValidation = validateArray(frames, "Frames", {
        required: true,
        minLength: 2
    });
    if (!framesValidation.valid) return errorResponse(res, framesValidation.error);

    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    for (let i = 0; i < frames.length; i++) {
        if (!validMimeTypes.includes(frames[i].mimetype)) {
            return errorResponse(res, `Frame ${i + 1} has invalid file type. Only JPEG and PNG are allowed`);
        }
        if (frames[i].size > 5 * 1024 * 1024) {
            return errorResponse(res, `Frame ${i + 1} exceeds maximum size of 5MB`);
        }
    }

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

    if (!verified || confidence < 0.75) {
        return errorResponse(res, "Attendance verification failed", 403);
    }

    return successResponse(res, "Attendance marked", { confidence });
}, "USER_VERIFY_MARK_ATTENDANCE_ERROR");
