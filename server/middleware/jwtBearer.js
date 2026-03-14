import jwt from "jsonwebtoken";

const validateCookie = (req, res, next) => {
    try {
        console.log("Headers: ", req.headers);
        let token = null;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            return res.status(403).json({ type: "error", message: "Unauthorized" });
        }

        jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
            if (err) {
                return res.status(403).json({ type: "error", message: "Unauthorized" });
            }
            req.user = decoded;
            next();
        });
    } catch (err) {
        res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

export default validateCookie;
