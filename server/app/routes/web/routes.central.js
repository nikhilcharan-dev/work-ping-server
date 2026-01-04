import otpRoutes from "#webRoutes/admin/otp/router.js";

import googleServicesRoutes from "../../../services/google/google.signin.js"
import microservicesRoutes from "../../../services/microsoft/microsoft.signin.js"

import attendanceRoutes from "#webRoutes/user/attendance/router.js";

import validateCookie from "#middleware/jwtBearer.js";

export default function centralRoutes(app) {
    // Default
    app.get("/", (req, res) => {
        const isLive = process.env.MODE === "production";
        res.cookie("accessToken", "IAmACookie", {
            httpOnly: true,
            secure: isLive,
            sameSite: isLive ? "none" : "lax",
        })
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