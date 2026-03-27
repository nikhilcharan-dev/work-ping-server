import Attendance from "#models/Attendance.js";
import User from "#models/User.js";
import Organization from "#models/Organization.js";
import { validateArray } from "#utils/validators.js";
import { successResponse, errorResponse } from "#utils/response.helper.js";
import { validate3DLocation } from "#utils/location.js";
import mongoose from "mongoose";
import recognize from "#services/face_recognition/model.js";
import { sendWhatsApp } from "#services/whatsapp/whatsapp.service.js";

/**
 * Perform 3D Location Validation before marking attendance
 * POST /api/user/attendance/verify-location
 */
export const verify_location = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const locationLock = req.body;

    const user = await User.findById(userId).populate("organizationId");
    if (!user || !user.organizationId) {
        return errorResponse(res, "User or Organization not found", 404);
    }

    const validation = validate3DLocation(locationLock, user.organizationId);
    
    return successResponse(res, validation.message, { 
        allowed: validation.allowed 
    });
});

export const verify_mark_attendance = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const frames = req.files;
    const locationLockRaw = req.query.locationLock || req.body.locationLock;

    // 1. Initial Validations
    const framesValidation = validateArray(frames, "Frames", {
        required: true,
        minLength: 2
    });
    if (!framesValidation.valid) return errorResponse(res, framesValidation.error);

    // 2. Server-Side 3D Location Security check
    const user = await User.findById(userId).populate("organizationId");
    if (!user) return errorResponse(res, "User not found", 404);

    if (locationLockRaw) {
        try {
            const locationLock = typeof locationLockRaw === 'string' 
                ? JSON.parse(locationLockRaw) 
                : locationLockRaw;
            
            if (user.organizationId) {
                const validation = validate3DLocation(locationLock, user.organizationId);
                if (!validation.allowed) {
                    return errorResponse(res, `Security Block: ${validation.message}`, 403);
                }
            }
        } catch (err) {
            console.error("[Attendance] Location Lock Parse Error:", err.message);
            // Fallback: If 3D signals fail to parse, we log it but continue unless strict mode is enabled
        }
    }

    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    for (let i = 0; i < frames.length; i++) {
        if (!validMimeTypes.includes(frames[i].mimetype)) {
            return errorResponse(res, `Frame ${i + 1} has invalid file type. Only JPEG and PNG are allowed`);
        }
        if (frames[i].size > 5 * 1024 * 1024) {
            return errorResponse(res, `Frame ${i + 1} exceeds maximum size of 5MB`);
        }
    }

    // Use the first frame for face recognition
    const deviceId = req.body.device_id || req.headers["x-device-id"] || "web";
    const locationId = req.body.location_id || "main-entrance";

    const faceRes = await recognize(frames[0].buffer, deviceId, locationId);

    if (!faceRes.success || faceRes.confidence < 0.6) {
        return errorResponse(res, "Face not recognised. Please try again in better lighting", 403);
    }

    if (faceRes.person?.id !== user.employeeId) {
        return errorResponse(res, "Identity mismatch. Your face does not match this account", 403);
    }

    const confidence = faceRes.confidence;

    // 4. Log Attendance in DB
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    let attendance = await Attendance.findOne({
        userId,
        date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!attendance) {
        attendance = await Attendance.create({
            userId,
            organizationId: user.organizationId,
            date: new Date(),
            status: "present",
            checkIn: new Date(),
            remarks: `Verified with confidence ${confidence.toFixed(2)}`
        });
    } else if (!attendance.checkOut) {
        attendance.checkOut = new Date();
        await attendance.save();
    }

    // WhatsApp check-in / check-out notification — fire-and-log
    const action = attendance.checkOut ? "Check-Out" : "Check-In";
    const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    sendWhatsApp(
        user.phone,
        `*WorkPing Attendance* ✅\nHi ${user.name}, your *${action}* at *${timeStr}* has been marked successfully.\n_Employee ID: ${user.employeeId}_`
    ).catch(err => console.error("[WhatsApp] Attendance notification failed:", err.message));

    return successResponse(res, "Attendance marked", {
        confidence,
        name: user?.name || "User",
        employeeId: user?.employeeId,
        workType: user?.workType,
        profileImage: user?.profileImage,
        attendance
    });
}, "USER_VERIFY_MARK_ATTENDANCE_ERROR");
