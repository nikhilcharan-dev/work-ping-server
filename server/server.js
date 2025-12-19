import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { HttpStatusCode } from "axios";
import { config } from "dotenv";
import morgan from "morgan";

import errorHandler from "./middleware/errorHandler.js";
import attendanceRoutes from "./routes/attendanceRoutes/router.js";
import testRoutes from "./routes/attendanceRoutes/test.js";

import whatsappConfig from "./config/whatsappConfig.js";
import mongooseConfig from "./config/mongooseDB.js";

import whatsAppWebhook from "./services/whatsapp/api/receiver.js";
import whatsAppRoutes from "./services/whatsapp/api/sender.js";

config(); // load env

const server = express();

/* ---------------------------------
   TRUST PROXY (important on Render)
---------------------------------- */
server.set("trust proxy", true);

/* ---------------------------------
   CORS (REQUIRED for cookies)
---------------------------------- */
const allowedOrigins = [
    "http://localhost:5173",
    "https://work-ping.vercel.app",
    "https://agentic-ai-03je.onrender.com"
];

server.use(
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
server.use(morgan("dev"));
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

/* ---------------------------------
   COOKIE PARSER
---------------------------------- */
server.use(cookieParser());

/* ---------------------------------
   IP LOGGER (optional)
---------------------------------- */
server.use((req, res, next) => {
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
server.get("/ping", (req, res) => {
    res.status(200).json({
        status: "pong",
        ip: req.ip
    });
});

/* ---------------------------------
   ROUTES
---------------------------------- */

// WhatsApp (protected / limited) use Limiter
server.use("/secure/whatsapp", whatsappConfig);
server.use("/secure/whatsapp", whatsAppWebhook);
server.use("/secure/whatsapp", whatsAppRoutes);

// Attendance APIs
server.use("/api", attendanceRoutes);
server.use('/api/test', testRoutes);

/* ---------------------------------
   ERROR HANDLER (LAST)
---------------------------------- */
server.use(errorHandler);

/* ---------------------------------
   SERVER START
---------------------------------- */
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
    console.log(`🚀 Server running. http://localhost:${PORT}`);
    await mongooseConfig();
});
