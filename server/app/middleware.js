import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

const MODE = process.env.MODE;

const allowedOrigins = [
    "http://localhost:63342",
    "http://localhost:5173",
    "http://127.0.0.1:5501",
    "https://workping.live",
    "https://www.workping.live",
    "https://phonepe.workping.live",
    "https://whatsapp.workping.live",
    "https://miniature-telegram-7vrjqw7xrp69hp77r-5173.app.github.dev",
    process.env.CLIENT_URL,
];

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
    app.options(/.*/, cors(corsOptions));


    app.use(morgan("dev"));

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(cookieParser());

    app.use((req, res, next) => {
        console.log("------------------------------------------------");
        console.log(`[Request] ${req.method} ${req.url}`);
        console.log("Origin:", req.headers.origin);
        console.log("Cookies:", req.cookies);
        console.log("User-Agent:", req.headers['user-agent']);
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
