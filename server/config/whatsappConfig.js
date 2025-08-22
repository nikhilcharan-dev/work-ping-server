import { Router } from 'express';

const router = Router();

router.get('/webhook', async (req, res) => {
    if(req.query['hub.mode'] === 'subscribe' && req.query['hub.token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge'])
    }  else {
        res.status(400);
    }
})

export default router;