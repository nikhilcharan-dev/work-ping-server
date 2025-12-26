import authRoutes from "../routes/userRoutes/auth/router.js";
import googleServicesRoutes from "../services/google/google.signin.js"
import microservicesRoutes from "../services/microsoft/microsoft.signin.js"

import attendanceRoutes from "../routes/userRoutes/attendanceRoutes/router.js";
import testRoutes from "../routes/userRoutes/attendanceRoutes/test.js";

import validateJWT from "../middleware/jwtBearer.js";

export default function routes(app) {
    app.get("/", (req, res) => {
        res.json({ status: "OK", ip: req.ip });
    });

    app.use("/api/auth", authRoutes);

    // Google SignIn
    app.use("/auth/google", googleServicesRoutes);

    // Microsoft SignIn
    app.use("/auth/microsoft", microservicesRoutes);

    app.use("/api/attendance", validateJWT, attendanceRoutes);

    app.use("/api/test", testRoutes);
}
