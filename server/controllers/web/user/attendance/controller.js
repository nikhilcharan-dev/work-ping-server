import axios from "axios";
import FormData from "form-data";

export const verify_mark_attendance =  asyncHandler(async(req, res) => {
    const userId = req.user.userId;
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

