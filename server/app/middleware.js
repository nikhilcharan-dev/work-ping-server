import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

const MODE = process.env.MODE;

const allowedOrigins = [
    "http://localhost:63342",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5501",
    "https://workping.live",
    "https://www.workping.live",
    "https://phonepe.workping.live",
    "https://whatsapp.workping.live",
    "https://glorious-couscous-97qgvw6xqj79hxj5g-5173.app.github.dev",
    "http://192.168.1.3:5000",
    "http://192.168.1.3",
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
    // app.options(/.*/, cors(corsOptions)); // redundant: app.use(cors()) already handles OPTIONS preflight


    app.use(morgan("dev"));

    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));

    app.use(cookieParser());

    app.use((req, res, next) => {
        console.log("------------------------------------------------");
        console.log(`[Request] ${req.method} ${req.url}`);
        // console.log("Origin:", req.headers.origin);
        // console.log("Cookies:", req.cookies);
        // console.log("User-Agent:", req.headers['user-agent']);
        console.log("------------------------------------------------");
        console.log("Origin IP:", req.ip);
        if (req.headers['user-agent']?.includes('PostmanRuntime') && MODE === "production") {
            return res.status(403).json({
                message: "Axios/Postman is fast, but not fast enough to be a browser."
            });
        }
        next();
    });
}
