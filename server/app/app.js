import express from "express";
import middlewares from "./middleware.js";
import routes from "./routes.js";
import 'dotenv/config';

import errorHandler from "../middleware/errorHandler.js";

const app = express();

middlewares(app);
routes(app);

app.use(errorHandler);

export default app;