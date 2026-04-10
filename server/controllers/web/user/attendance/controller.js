import Attendance from "#models/Attendance.js";
import User from "#models/User.js";
import Organization from "#models/Organization.js";
import { validateArray } from "#utils/validators.js";
import { successResponse, errorResponse } from "#utils/response.helper.js";
import { validate3DLocation } from "#utils/location.js";
import { submitRecognitionTask, checkRecognitionStatus } from "#services/face_recognition/model.js";
import { sendWhatsApp } from "#services/whatsapp/whatsapp.service.js";
import { trace } from "#utils/traceLogger.js";

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

    trace('REQUEST', `verify_mark_attendance started for user: ${userId}`);

    // 1. Initial Validations
    const framesValidation = validateArray(frames, "Frames", {
        required: true,
        minLength: 1
    });
    if (!framesValidation.valid) {
        trace('FAILURE', `Frames validation failed: ${framesValidation.error}`);
        return errorResponse(res, framesValidation.error);
    }
    trace('CHECK', 'Frames validation passed');

    // 2. Server-Side 3D Location Security check
    const user = await User.findById(userId).populate("organizationId");
    if (!user) {
        trace('FAILURE', `User not found: ${userId}`);
        return errorResponse(res, "User not found", 404);
    }
    trace('CHECK', `User identified: ${user.name} (${user.employeeId})`);

    if (locationLockRaw) {
        try {
            const locationLock = typeof locationLockRaw === 'string' 
                ? JSON.parse(locationLockRaw) 
                : locationLockRaw;
            
            if (user.organizationId) {
                const validation = validate3DLocation(locationLock, user.organizationId);
                if (!validation.allowed) {
                    trace('FAILURE', `Location security block: ${validation.message}`);
                    return errorResponse(res, `Security Block: ${validation.message}`, 403);
                }
                trace('CHECK', 'Location validation passed');
            }
        } catch (err) {
            trace('FAILURE', `Location Lock Parse Error: ${err.message}`);
            console.error("[Attendance] Location Lock Parse Error:", err.message);
        }
    } else {
        trace('CHECK', 'No locationLock provided, skipping security check');
    }

    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    for (let i = 0; i < frames.length; i++) {
        if (!validMimeTypes.includes(frames[i].mimetype)) {
            trace('FAILURE', `Frame ${i + 1} has invalid file type: ${frames[i].mimetype}`);
            return errorResponse(res, `Frame ${i + 1} has invalid file type. Only JPEG and PNG are allowed`);
        }
        if (frames[i].size > 5 * 1024 * 1024) {
            trace('FAILURE', `Frame ${i + 1} exceeds maximum size: ${frames[i].size}`);
            return errorResponse(res, `Frame ${i + 1} exceeds maximum size of 5MB`);
        }
    }
    trace('CHECK', 'Frame mime-types and sizes validated');

    // 3. Submit Queue task
    const taskRes = await submitRecognitionTask(frames[0].buffer, user.employeeId, user.organizationId._id);
    trace('SUCCESS', `Face detection queued. Ticket: ${taskRes.ticket_id}`);

    const responseData = {
        ticketId: taskRes.ticket_id,
        status: taskRes.status,
        position: taskRes.position
    };
    trace('DATA', `Response sent: ${JSON.stringify(responseData)}`);

    return successResponse(res, "Face detection queued", responseData);
}, "USER_VERIFY_MARK_ATTENDANCE_ERROR");

export const verify_mark_attendance_status = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { ticketId } = req.params;

    trace('REQUEST', `verify_mark_attendance_status started for ticket: ${ticketId}`);

    const user = await User.findById(userId).populate("organizationId");
    if (!user) {
        trace('FAILURE', `User not found: ${userId}`);
        return errorResponse(res, "User not found", 404);
    }

    const faceResParent = await checkRecognitionStatus(ticketId);
    trace('CHECK', `Face recognition status: ${faceResParent.status}`);
    
    if (faceResParent.status !== "completed") {
        return successResponse(res, "Processing", { 
            status: faceResParent.status, 
            ticketId 
        });
    }

    const faceRes = faceResParent.result;
    trace('CHECK', `Face recognition completed. Success: ${faceRes.success}, Confidence: ${faceRes.confidence}`);
    
    if (!faceRes.success || faceRes.confidence < 0.6) {
        trace('FAILURE', `Face not recognised. Success: ${faceRes.success}, Confidence: ${faceRes.confidence}`);
        return errorResponse(res, "Face not recognised. Please try again in better lighting", 403);
    }

    if (faceRes.person?.id !== user.employeeId) {
        trace('FAILURE', `Identity mismatch. Expected: ${user.employeeId}, Found: ${faceRes.person?.id}`);
        return errorResponse(res, "Identity mismatch. Your face does not match this account", 403);
    }
    trace('CHECK', 'Identity verified');

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
        trace('SUCCESS', `New Check-In created for user: ${userId}`);
    } else if (!attendance.checkOut) {
        attendance.checkOut = new Date();
        await attendance.save();
        trace('SUCCESS', `Check-Out recorded for user: ${userId}`);
    } else {
        trace('CHECK', `Attendance already completed for today for user: ${userId}`);
    }

    // WhatsApp check-in / check-out notification — fire-and-log
    const action = attendance.checkOut ? "Check-Out" : "Check-In";
    const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    sendWhatsApp(
        user.phone,
        `*WorkPing Attendance* ✅\nHi ${user.name}, your *${action}* at *${timeStr}* has been marked successfully.\n_Employee ID: ${user.employeeId}_`
    ).catch(err => {
        trace('FAILURE', `WhatsApp notification failed: ${err.message}`);
        console.error("[WhatsApp] Attendance notification failed:", err.message);
    });

    const finalResponse = {
        confidence,
        status: "completed",
        name: user?.name || "User",
        employeeId: user?.employeeId,
        workType: user?.workType,
        profileImage: user?.profileImage,
        attendance
    };
    trace('DATA', `Attendance marked successfully. Sending data: ${JSON.stringify(finalResponse)}`);

    return successResponse(res, "Attendance marked", finalResponse);

}, "USER_VERIFY_MARK_ATTENDANCE_STATUS_ERROR");
