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

    console.log("Gateway Socket listening");

    io.on("connection", socket => {
        /**
         * Client emits "payment:join" with { userId } immediately after
         * being redirected to the PhonePe payment page.
         * We join them to their room and replay the current Redis status so
         * the UI shows "Processing your payment..." straight away.
         */
        socket.on("payment:join", async ({ userId }) => {
            if (!userId || typeof userId !== "string") {
                return socket.emit("payment:error", "Invalid userId");
            }

            socket.join(`payment:${userId}`);

            try {
                const raw  = await redis.get(`payment:${userId}`);
                const data = raw ? JSON.parse(raw) : null;

                if (!data) {
                    // No active payment — may have already completed or expired
                    socket.emit("payment:status", { status: "Expired" });
                } else {
                    // Replay processing state so late-joiners see the spinner
                    socket.emit("payment:processing", data);
                }
            } catch (err) {
                console.error("[Socket] redis.get error:", err.message);
                socket.emit("payment:error", "Failed to fetch payment status");
            }
        });

        socket.on("disconnect", () => {
            // rooms are cleaned up automatically by socket.io
        });
    });
}
