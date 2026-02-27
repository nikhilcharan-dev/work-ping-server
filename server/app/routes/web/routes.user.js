import authRoutes from "#webRoutes/user/auth/router.js";
import userRoutes from "#webRoutes/user/users/router.js";
import leaveRoutes from "#webRoutes/user/leaves/router.js";
import organisationRoutes from "#webRoutes/user/organisation/router.js";
import payrollRoutes from "#webRoutes/user/payroll/router.js";
import projectRoutes from "#webRoutes/user/projects/router.js";
import attendanceHistoryRoutes from "#webRoutes/user/attendance/history.router.js";

import validateCookie from "#middleware/jwtBearer.js";

export default function userRoutesSetup(app) {
    app.use("/api/auth", authRoutes);
    app.use("/api/user", validateCookie, userRoutes);
    app.use("/api/user/leaves", validateCookie, leaveRoutes);
    app.use("/api/user/organisation", validateCookie, organisationRoutes);
    app.use("/api/user/payroll", validateCookie, payrollRoutes);
    app.use("/api/user/projects", validateCookie, projectRoutes);
    app.use("/api/user/attendance", validateCookie, attendanceHistoryRoutes);
}
