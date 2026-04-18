import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const MODE = process.env.MODE;

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://workping.live",
    "https://www.workping.live",
    "https://phonepe.workping.live",
    "https://whatsapp.workping.live",
    process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
    origin: (origin, cb) =>
        !origin || allowedOrigins.includes(origin)
            ? cb(null, true)
            : cb(new Error("CORS blocked")),
    credentials: true,
};

export default function middlewares(app) {
    app.set("trust proxy", 1);

    app.use(cors(corsOptions));

    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));

    app.use(cookieParser());

    app.use((req, res, next) => {
        console.log("------------------------------------------------");
        console.log(`[Request] [${req.ip}] ${req.method} ${req.url}`);
        // console.log("Origin:", req.headers.origin);
        // console.log("Cookies:", req.cookies);
        // console.log("User-Agent:", req.headers['user-agent']);
        console.log("------------------------------------------------");
        if (req.headers['user-agent']?.includes('PostmanRuntime') && MODE === "production") {
            return res.status(403).json({
                message: "Axios/Postman is fast, but not fast enough to be a browser."
            });
        }
        next();
    });
}
