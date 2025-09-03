import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

import whatsappConfig from './config/whatsappConfig.js'
import mongooseConfig from './config/mongooseDB.js'
import {HttpStatusCode} from "axios";

// loading the environment variables
config();

// creating server
const server = express();

// 'trust proxy' will resolve the origin ip instead of the proxy ip
server.set('trust proxy', true);

// initializing middleware
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.get('/ping', (req, res) => {
    return res.send('pong');
})

server.use('/secure/config/whatsapp', whatsappConfig);

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => { // no use even if we use async, jst for getting no ide errors
    console.log(`Server listening on port ${PORT}`);
    // await mongooseConfig();
});