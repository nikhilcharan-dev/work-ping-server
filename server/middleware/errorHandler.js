// middleware/errorHandler.js
export default function errorHandler(err, req, res, next) {
    const ctx = req.context || {};

    const status = err.statusCode || 500;
    const message =
        err.isOperational ? err.message : "Internal Server Error";

    console.error({
        level: "error",
        feature: err.feature || "UNKNOWN",
        code: err.code,
        status,
        message: err.message,
        method: ctx.method,
        path: ctx.path,
        requestId: ctx.requestId,
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack
    });

    res.status(status).json({
        error: message,
        code: err.code,
        requestId: ctx.requestId
    });
}
