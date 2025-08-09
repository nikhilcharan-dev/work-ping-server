import axios from 'axios';
import { Router } from 'express';

const router = new Router();

/*
    creating a custom callback url for the cloud api to redirect events to
 */

router.get('/webhook', (req, res) => {
    console.log('webhook GET event:', req.query);
    res.sendStatus(200);
})

router.post('/webhook', (req, res) => {
    console.log('webhook POST event:', req.body);
    res.sendStatus(200);
});

export default router;