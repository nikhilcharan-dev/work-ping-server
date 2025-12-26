// package imports
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { HttpStatusCode } from "axios";
import morgan from "morgan";

// config files
import 'dotenv/config';
import whatsappConfig from "./config/whatsappConfig.js";
import mongooseConfig from "./config/mongooseDB.js";

// middlewares
import errorHandler from "./middleware/errorHandler.js";


// routes
import attendanceRoutes from "./routes/user/attendance/router.js";
import authRoutes from "./routes/user/auth/router.js";

// test routes
import testRoutes from "./routes/user/attendance/test.js";

// whatsapp routes
import whatsAppWebhook from "./services/whatsapp/api/receiver.js";
import whatsAppRoutes from "./services/whatsapp/api/sender.js";

const ex = express();

/* ---------------------------------
   TRUST PROXY (important on Render)
---------------------------------- */
ex.set("trust proxy", true);

/* ---------------------------------
   CORS (REQUIRED for cookies)
---------------------------------- */
const allowedOrigins = [
    "http://localhost:5173",
    "https://work-ping.vercel.app",
    "https://agentic-ai-03je.onrender.com"
];

ex.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true
    })
);


/* ---------------------------------
   BODY PARSERS
---------------------------------- */
ex.use(morgan("dev"));
ex.use(express.json());
ex.use(express.urlencoded({ extended: true }));

/* ---------------------------------
   COOKIE PARSER
---------------------------------- */
ex.use(cookieParser());

/* ---------------------------------
   IP LOGGER (optional)
---------------------------------- */
ex.use((req, res, next) => {
    console.log("Origin IP:", req.ip);
    next();
});

/* ---------------------------------
   RATE LIMITER
---------------------------------- */
const Limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "blocked",
        message: "Rate limit exceeded"
    },
    statusCode: HttpStatusCode.Forbidden
});

/* ---------------------------------
   HEALTH CHECK
---------------------------------- */
ex.get("/ping", (req, res) => {
    res.status(HttpStatusCode.Ok).json({
        status: "pong",
        ip: req.ip
    });
});

/* ---------------------------------
   ROUTES
---------------------------------- */

// WhatsApp (protected)
ex.use("/secure/whatsapp", whatsappConfig);
ex.use("/secure/whatsapp", whatsAppWebhook);
ex.use("/secure/whatsapp", whatsAppRoutes);

// OAuth routes
ex.use('/api/auth', authRoutes);

// Attendance APIs
ex.use("/api", attendanceRoutes);
ex.use('/api/test', testRoutes);

/* ---------------------------------
   ERROR HANDLER (LAST)
---------------------------------- */
ex.use(errorHandler);

/* ---------------------------------
   SERVER START
---------------------------------- */
const PORT = process.env.PORT || 5001;

ex.listen(PORT, async () => {
    console.log(`🚀 Server running. http://localhost:${PORT}`);
    await mongooseConfig();
});
