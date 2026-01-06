import {Server} from "socket.io";

export default function socket(server) {
    globalThis.io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", socket => {
        console.log("Gateway Socket listening");
        socket.on("payment:join", async ({userId}) => {
            socket.join(`payment:${userId}`);

            const data = await redis.get(`payment:${userId}`);

            socket.emit("payment:status", !data ? "Expired" : data);
        })
    });

    io.on("", socket => {
        console.log("Gateway Socket listening");
        socket.on("payment:join", async ({userId}) => {
            socket.join(`payment:${userId}`);

            const data = await redis.get(`payment:${userId}`);

            socket.emit("payment:status", !data ? "Expired" : data);
        })
    });
}