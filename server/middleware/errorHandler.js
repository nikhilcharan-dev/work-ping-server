const errorHandler = (err, req, res, next) => {
    console.error("🔥 ERROR:", err);

    return res.status(err.status || 500).json({
        status: "error",
        message: err.message || "Internal server error"
    });
};

export default errorHandler;
