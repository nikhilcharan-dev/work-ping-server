import express from "express";
import 'dotenv/config';

import middlewares from "./middleware.js";

import twoFactorRoutes from "./2fa.js";
import centralWebRoutes from "./routes/web/routes.central.js";
import adminWebRoutes from "./routes/web/routes.admin.js";
import userWebRoutes from "./routes/web/routes.user.js";

import errorHandler from "../middleware/errorHandler.js";

const app = express();

app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Server is updated"
    });
});

middlewares(app);

twoFactorRoutes(app);
centralWebRoutes(app);
adminWebRoutes(app);
userWebRoutes(app);

app.use(errorHandler);

export default app;