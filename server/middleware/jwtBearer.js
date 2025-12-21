import jwt from "jsonwebtoken";

const bearerCheck = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                status: "unauthorized",
                message: "Authorization header missing"
            });
        }

        // Expect: Bearer <token>
        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                status: "unauthorized",
                message: "Invalid authorization format"
            });
        }

        const token = parts[1];

        jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    status: "unauthorized",
                    message: "Invalid or expired token"
                });
            }

            // decoded should contain { id, email, role, ... }
            req.user = decoded;
            next();
        });

    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: "Authentication middleware failed"
        });
    }
};

export default bearerCheck;
