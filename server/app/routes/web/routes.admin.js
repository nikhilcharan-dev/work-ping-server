import authRoutes from "#webRoutes/admin/auth/router.js";
import otpRoutes from "#webRoutes/admin/otp/router.js";
import forgotPasswordRouter from "#webRoutes/admin/forgotPassword/router.js";
import mailRouter from "#webRoutes/admin/mail/router.js";
import organizationRouter from "#webRoutes/admin/organization/router.js"
import teamRoutes from "#webRoutes/admin/team/routes.js";
import profileRoutes from "#webRoutes/admin/profile/router.js";
import validateCookie from "#middleware/jwtBearer.js";
import requireRole from "#middleware/requireRole.js";
import addEmployeesRouter from "#webRoutes/admin/addEmployees/router.js"
import getAllEmployeesRouter from "#webRoutes/admin/getAllEmployees/router.js"
// import teamMemberRoutes from "#webRoutes/admin/teamMembers/routes.js";
import getEmployee from "#webRoutes/admin/employee/router.js";


import projectRoutes from "#webRoutes/admin/project/router.js"
import deleteEmployeesById from "#webController/admin/deleteEmployees/deleteEmployeesByid.js";
import paymentsRouter from "#webRoutes/admin/payments/router.js";
import ordersRouter from "#webRoutes/admin/orders/router.js";
import phonepeGatewayRouter from "#services/phonepe/phonepe.gateway.js";

const adminOnly = [validateCookie, requireRole("admin")];

export default function adminRoutes(app) {
    app.use("/api/admin/auth", authRoutes);
    app.use("/api/admin", ...adminOnly, profileRoutes);
    app.use("/api/admin/organization", ...adminOnly, organizationRouter);
    // OTP
    app.use("/api/admin/otp", otpRoutes);
    app.use("/api/admin/forgot-password", forgotPasswordRouter);
    app.use("/api/admin/mail", ...adminOnly, mailRouter);

    // Forgot Password

    //create-team
    app.use("/api/admin/employee", ...adminOnly, getEmployee);
    app.use("/api/admin/get-all-employees", ...adminOnly, getAllEmployeesRouter);
    app.use("/api/admin/employees", ...adminOnly, deleteEmployeesById);
    app.use("/api/admin/team", ...adminOnly, teamRoutes);
    app.use("/api/admin/add-employees", ...adminOnly, addEmployeesRouter);

    // Project
    app.use("/api/admin/project", ...adminOnly, projectRoutes);

    // Payments & Orders (read)
    app.use("/api/admin/payments", ...adminOnly, paymentsRouter);
    app.use("/api/admin/orders", ...adminOnly, ordersRouter);

    // PhonePe — initiate payment (admin only)
    app.use("/api/admin/phonepe", ...adminOnly, phonepeGatewayRouter);

}
