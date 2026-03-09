import { Server } from "socket.io";

const allowedOrigins = [
    "http://10.144.15.154:5173",
    "http://localhost:5173",
    "https://work-ping-liart.vercel.app",
    "http://127.0.0.1:5501",
    "https://workping.live",
    "https://www.workping.live",
    "https://phonepe.workping.live",
    "https://whatsapp.workping.live",
    process.env.CLIENT_URL,
];

export default function socket(server) {
    globalThis.io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", socket => {
        console.log("Gateway Socket listening");
        socket.on("payment:join", async ({ userId }) => {
            socket.join(`payment:${userId}`);

            const data = await redis.get(`payment:${userId}`);

            socket.emit("payment:status", !data ? "Expired" : data);
        })
    });
}
