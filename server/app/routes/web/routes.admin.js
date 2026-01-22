import authRoutes from "#webRoutes/admin/auth/router.js";
import otpRoutes from "#webRoutes/admin/otp/router.js";
import teamRoutes from "#webRoutes/admin/team/routes.js";
import validateCookie from "#middleware/jwtBearer.js";

export default function adminRoutes(app) {
    app.use("/api/admin/auth", authRoutes);

    // OTP
    app.use("/api/admin/otp", otpRoutes);

    //create-team
    app.use("/api/admin/team", teamRoutes);
}
