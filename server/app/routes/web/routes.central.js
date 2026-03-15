import otpRoutes from "#webRoutes/admin/otp/router.js";

import googleServicesRoutes from "../../../services/google/google.signin.js"
import microservicesRoutes from "../../../services/microsoft/microsoft.signin.js"

import attendanceRoutes from "#webRoutes/user/attendance/router.js";
import forgotPasswordRouter from "#webRoutes/admin/forgotPassword/router.js";
import phonepeWebhookRouter from "#services/phonepe/phonepe.webhook.js";

import validateCookie from "#middleware/jwtBearer.js";
import jwt from "jsonwebtoken";
import Admin from "#models/Admin.js";
import User from "#models/User.js";
import Account from "#models/Account.js";

export default function centralRoutes(app) {
    // cookie verify — works for both admin and user roles
    app.get("/verify-cookie", async (req, res) => {

        try {
            const cookie = req.cookies?.accessToken;
            if (!cookie) {
                return res.status(403).json({ type: "error", message: "Unauthorized" });
            }

            let decoded;
            try {
                decoded = jwt.verify(cookie, process.env.SECRET_KEY);
            } catch (jwtErr) {
                return res.status(403).json({ type: "error", message: "Unauthorized" });
            }
            const { userId } = decoded;

            // Try Admin first, then User
            let profile = await Admin.findById(userId).lean();
            let role = "admin";

            if (!profile) {
                profile = await User.findById(userId).lean();
                role = "user";
            }

            if (!profile) {
                return res.status(404).json({ type: "error", message: "User not found" });
            }

            const authData = await Account.findOne({ email: profile.email }).lean();

            res.status(200).json({ type: "success", message: "Verified", data: { ...authData, ...profile, role } });

        } catch (err) {
            console.log(err)
            return res.status(500).json({ type: "error", message: "Internal Server Error" });
        }
    });

    // Verification
    app.use("/api/otp", otpRoutes);

    app.use("/api/admin/forgot-password", forgotPasswordRouter);

    // Google SignIn
    app.use("/auth/google", googleServicesRoutes)

    // Microsoft SignIn
    app.use("/auth/microsoft", microservicesRoutes);

    // Attendance
    app.use("/api/attendance", validateCookie, attendanceRoutes);

    // PhonePe webhook — no auth (PhonePe calls this directly, verified by signature)
    app.use("/api/phonepe", phonepeWebhookRouter);
}
