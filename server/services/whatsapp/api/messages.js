import { Router } from "express";

const router = Router();

router.post('/webhook', async (req, res) => {
    try {
        console.log("Request Body: ", JSON.stringify(req.body));
        console.log("Request Header: ", JSON.stringify(req.headers));
        return res.status(400);
    } catch(err) {
        console.log(err);
        return res.status(500);
    }
})

export default router;