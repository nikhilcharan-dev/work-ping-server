import './globals.js';
import "dotenv/config";
import http from "http";
import socket from "./app/socket.io.js";
import init from './cleanup/cleanDB.js';

import app from "./app/app.js";
import mongooseConfig from "./config/mongoose.js";

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

socket(server);

(async () => {
    await mongooseConfig();
    await redis.connect();
    server.listen(PORT, "0.0.0.0", () => {
        console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
    });
    // init();
})();