import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

import enableConnection from './config/mongooseDB.js'


// whatsapp cloud api
import metaRoutes from './whatsapp_cloud/test_api.js';

// loading the environment variables
config();

// creating server
const server = express();

// initializing middleware
server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.get('/ping', (req, res) => {
    return res.status(200).send('pong');
})

// Routes
server.use('/meta/cloud', metaRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', async() => { // no use even if we use async, jst for getting no ide errors
    console.log(`Server listening on port ${PORT}`);
    // await enableConnection();
});