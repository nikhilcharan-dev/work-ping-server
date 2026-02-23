import otpRoutes from "#webRoutes/admin/otp/router.js";

import googleServicesRoutes from "../../../services/google/google.signin.js"
import microservicesRoutes from "../../../services/microsoft/microsoft.signin.js"

import attendanceRoutes from "#webRoutes/user/attendance/router.js";
import forgotPasswordRouter from "#webRoutes/admin/forgotPassword/router.js";

import validateCookie from "#middleware/jwtBearer.js";
import jwt from "jsonwebtoken";

export default function centralRoutes(app) {
    // cookie verify
    app.get("/verify-cookie", (req, res) => {

        try {
            const cookie = req.cookies?.accessToken;
            console.log(cookie);
            if (!cookie) {
                return res.status(403).json({
                    error: "Unauthorized",
                })
            }

            jwt.verify(cookie, process.env.SECRET_KEY, (err, decoded) => {
                if (err) {
                    return res.status(403).json({
                        error: "Unauthorized",
                    })
                }else{
                     return res.status(200).json({
                        error: "authorized",
                    })
                }


            })

        } catch (err) {
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