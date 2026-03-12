import jwt from "jsonwebtoken";

const validateCookie = (req, res, next) => {
    try {
        console.log("cookie: " , req.cookies)
        let token = req.cookies?.accessToken;
        
        // Fallback to Authorization header if cookie is not present
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if(!token) {
            return res.status(403).json({
                error: "Unauthorized",
            })
        }

        jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
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
