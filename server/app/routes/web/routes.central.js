import otpRoutes from "#webRoutes/admin/otp/router.js";

import googleServicesRoutes from "../../../services/google/google.signin.js"
import microservicesRoutes from "../../../services/microsoft/microsoft.signin.js"

import attendanceRoutes from "#webRoutes/user/attendance/router.js";
import forgotPasswordRouter from "#webRoutes/admin/forgotPassword/router.js";

import validateCookie from "#middleware/jwtBearer.js";
import jwt from "jsonwebtoken";
import Account from "#models/Account.js";
import Admin from "#models/Admin.js";

export default function centralRoutes(app) {
    // cookie verify
    app.get("/verify-cookie", async (req, res) => {

        try {
            const cookie = req.cookies?.accessToken;
            console.log(cookie);
            if (!cookie) {
                return res.status(403).json({
                    error: "Unauthorized",
                })
            }

            const { userId } = jwt.decode(cookie, process.env.SECRET_KEY, (err, decoded) => {
                if (err) {
                    return res.status(403).json({
                        error: "Unauthorized",
                    })
                }
            })

            console.log(userId)
            const user = await Admin.findById(userId)
            const acc = await Account.findOne({ email: user.email})
            res.status(200).json(user)

        } catch (err) {
            console.log(err)
            return res.status(500).send({
                error: "Internal Server Error",
            })
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

    // app.use("/api/profile", validateCookie, profileRoutes);
}