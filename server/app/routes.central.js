import otpRoutes from "../routes/web/admin/otp/router.js";

import googleServicesRoutes from "../services/google/google.signin.js"
import microservicesRoutes from "../services/microsoft/microsoft.signin.js"

import attendanceRoutes from "../routes/web/user/attendance/router.js";

import validateCookie from "../middleware/jwtBearer.js";

export default function centralRoutes(app) {
    // Default
    app.get("/", (req, res) => {
        res.json({ status: "OK", ip: req.ip });
    });

    // Verification
    app.use("/api/otp", otpRoutes);

    // Google SignIn
    app.use("/auth/google", googleServicesRoutes)

    // Microsoft SignIn
    app.use("/auth/microsoft", microservicesRoutes);

    // Attendance
    app.use("/api/attendance", validateCookie, attendanceRoutes);
}