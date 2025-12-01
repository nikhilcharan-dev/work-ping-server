import express from 'express';
import cors from 'cors';
import rateLimit from "express-rate-limit";
import { HttpStatusCode } from "axios";

import { config } from 'dotenv';
config(); // loading the environment variables

import whatsappConfig from './config/whatsappConfig.js'
import mongooseConfig from './config/mongooseDB.js'

import whatsAppWebhook from './services/whatsapp/api/receiver.js';
import whatsAppRoutes from './services/whatsapp/api/sender.js';

// creating server
const server = express();

// Rate Limiter
const Limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    message: "Rate Limit Threshold Reached!",
    statusCode: HttpStatusCode.Forbidden,
})

// 'trust proxy' will resolve the origin ip instead of the proxy ip
server.set('trust proxy', true);

// initializing middleware
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Inbound-IP Testing
server.use((req, res, next) => {
    console.log("Origin IP Address: ", req.ip);
    next();
})

server.get('/ping', (req, res) => {
    return res.status(200).json({
        status: "pong",
        ip: req.ip,
    })
})

server.use('/secure/whatsapp', whatsappConfig);
server.use('/secure/whatsapp', whatsAppWebhook);
server.use('/secure/whatsapp', whatsAppRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => { // no use even if we use async, jst for getting no ide errors
    console.log(`Server listening on port ${PORT}`);
    // await mongooseConfig();
});