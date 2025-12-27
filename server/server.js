import './globals.js';
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";

import app from "./app/app.js";
import mongooseConfig from "./config/mongooseDB.js";

const PORT = process.env.PORT || 5001;
const server = http.createServer(app);


const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

globalThis.io = io;

io.on("connection", socket => {
    console.log("[Socket] Connected");
    socket.on("disconnect", () => {
        console.log("[Socket] Disconnected");
    })
});

(async () => {
    await mongooseConfig();
    server.listen(PORT, () => {
        console.log(`[Server] Running ${PORT}`);
    });
})();

website --> server