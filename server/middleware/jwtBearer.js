import jwt from "jsonwebtoken";

const validateCookie = (req, res, next) => {
    try {
        const cookie = req.cookie?.accessToken;
        if(!cookie) {
            return res.status(403).json({
                error: "Unauthorized",
            })
        }

        jwt.verify(cookie, process.env.SECRET_KEY, (err, decoded) => {
            if(err) {
                return res.status(403).json({
                    error: "Unauthorized",
                })
            }
            req.user = decoded;
            next();
        })
    } catch(err) {
        res.status(500).send({
            error: "Internal Server Error",
        })
    }
}

export default validateCookie;
