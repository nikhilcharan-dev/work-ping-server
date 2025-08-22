import { Router } from 'express';

const router = Router();

router.get('/webhook', async (req, res) => {
    try {
        console.log(req.query);
        if(req.query['hub.mode'] === 'subscribe' && req.query['hub.token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
            return res.status(200).send(req.query['hub.challenge'])
        }
        return res.status(400);
    } catch(err) {
        console.log(err);
        return res.status(500);
    }
})

export default router;