import { Router } from "express";
import axios from "axios";

const API_KEY = process.env.WHATSAPP_API_KEY;
const META_BASE_URI = process.env.WHATSAPP_META_BASE_URI;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

const metaAxios = axios.create({
    baseURL: `${META_BASE_URI}/${PHONE_NUMBER_ID}`,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
    },
    timeout: 5000,

})

const router = Router();

router.post('/test', async (req, res) => {
    try {
        const { to, body } = req.body;
        const res = metaAxios.post('/messages', {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": `91${to}`,
            "type": "text",
            "text": {
                "body": body
            }
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            error: 'Internal Server Error',
        });
    }
})

export default router;