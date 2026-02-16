import jwt from "jsonwebtoken";

const validateCookie = (req, res, next) => {
    try {
        console.log("cookie: " , req.cookies)
        const cookie = req.cookies?.accessToken;
        console.log(cookie);
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
            // console.log(decoded)
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
