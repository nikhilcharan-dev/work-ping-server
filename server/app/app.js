import express from "express";
import 'dotenv/config';

import middlewares from "./middleware.js";

import centralRoutes from "./routes.central.js";
import adminRoutes from "./routes.admin.js";
import userRoutes from "./routes.user.js";

import errorHandler from "../middleware/errorHandler.js";

const app = express();

middlewares(app);
centralRoutes(app);
adminRoutes(app);
userRoutes(app);

app.use(errorHandler);

export default app;