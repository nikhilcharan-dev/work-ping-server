import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

const allowedOrigins = [
    "http://localhost:5173",
    "https://work-ping.vercel.app",
    "https://agentic-ai-03je.onrender.com"
];

export default function middlewares(app) {
    app.set("trust proxy", true);

    app.use(cors({
        origin: (origin, cb) =>
            !origin || allowedOrigins.includes(origin)
                ? cb(null, true)
                : cb(new Error("CORS blocked")),
        credentials: true
    }));

    app.use(morgan("dev"));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use((req, res, next) => {
        console.log("Origin IP:", req.ip);
        next();
    });
}
