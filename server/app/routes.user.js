import authRoutes from "../routes/user/auth/router.js";

import validateCookie from "../middleware/jwtBearer.js";

export default function userRoutes(app) {
    app.use("/api/auth", authRoutes);
}