import jwt from 'jsonwebtoken';

const bearerCheck = (req, res, next) => {
    const headerContainer = req.headers['Authorization'];
    if(!headerContainer) {
        return res.status(401).json({
            error: 'Missing Authorization header'
        })
    }

    const token = headerContainer.split(' ')[1];
    if(!token) {
        return res.status(401).json({
            error: 'Missing Token'
        })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err) return res.status(401).json({
            error: 'Invalid Token'
        })
        req.user = decoded;
        next();
    })
}

export default bearerCheck;