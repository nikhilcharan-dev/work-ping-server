import { Router } from 'express';

const router = Router();

router.get('/webhook', async (req, res) => {
    try {
        console.log(req.query);
        if(req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
            return res.status(200).send(req.query['hub.challenge'])
        }
        return res.status(400);
    } catch(err) {
        console.log(err);
        return res.status(500);
    }
})

router.post('/webhook', async (req, res) => {
    try {
        console.log(req.body);

        console.log(req.body.entry[0].id);
        console.log(req.body.entry[0].changes);
    } catch(err) {
        console.log(err);
    }
})

export default router;