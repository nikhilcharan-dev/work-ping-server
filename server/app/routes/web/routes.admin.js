import authRoutes from "#webRoutes/admin/auth/router.js";
import otpRoutes from "#webRoutes/admin/otp/router.js";
import organizationRouter from "#webRoutes/admin/organization/router.js"
import teamRoutes from "#webRoutes/admin/team/routes.js";
import validateCookie from "#middleware/jwtBearer.js";
import addEmployeesRouter from "#webRoutes/admin/addEmployees/router.js"
import forgotPasswordRouter from "#webRoutes/admin/forgotPassword/router.js";
import getAllEmployeesRouter from "#webRoutes/admin/getAllEmployees/router.js"
// import teamMemberRoutes from "#webRoutes/admin/teamMembers/routes.js";


import projectRoutes from "#webRoutes/admin/project/router.js"

export default function adminRoutes(app) {
    app.use("/api/admin/auth", authRoutes);
    app.use("/api/admin/organization", validateCookie ,organizationRouter);
    // OTP
    app.use("/api/admin/otp", otpRoutes);

    // Forgot Password
    

    //create-team
    app.use("/api/admin/get-all-employees", validateCookie, getAllEmployeesRouter);
    app.use("/api/admin/team", validateCookie, teamRoutes);
    app.use("/api/admin/add-employees", validateCookie, addEmployeesRouter );

    // Project
    app.use("/api/project", validateCookie, projectRoutes);

}
