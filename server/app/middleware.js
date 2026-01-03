import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

const allowedOrigins = [
    "http://localhost:5173",
    "https://workping.live",
    "https://www.workping.live",
    "https://phonepe.workping.live",
    "https://whatsapp.workping.live",
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
        console.log("Origin IP:", req.ip);
        next();
    });
}
