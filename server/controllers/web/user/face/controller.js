import User from "#models/User.js";
import { successResponse, errorResponse } from "#utils/response.helper.js";
import { enrollFace } from "#services/face_recognition/enroll.js";

// POST /api/user/face/enroll
// Authenticated employee enrolls their own face (used from mobile).
export const enrollOwnFace = asyncHandler(async (req, res) => {
    if (!req.file) {
        return errorResponse(res, "face_photo is required");
    }

    const user = await User.findById(req.user.userId).lean();
    if (!user) return errorResponse(res, "User not found", 404);

    await enrollFace(req.file.buffer, user);

    return successResponse(res, "Face enrolled successfully", {
        employeeId: user.employeeId,
        name: user.name,
    });
}, "USER_ENROLL_FACE_ERROR");
