import './globals.js';
import "dotenv/config";
import cluster from "cluster";
import http from "http";
import mongooseConfig from "./config/mongoose.js";

const backoff = (retries, base = 1000, cap = 30000) =>
    Math.min(cap, base * Math.pow(2, retries));

if (cluster.isPrimary) {
    let retries = 0;

    const spawnWorker = () => {
        const worker = cluster.fork();
        worker.on('online', () => {
            console.log(`[Cluster] Worker ${worker.process.pid} online`);
            retries = 0;
        });
        worker.on('exit', (code, signal) => {
            if (signal === 'SIGTERM' || code === 0) return;
            const delay = backoff(retries++);
            console.warn(`[Cluster] Worker exited (${signal || code}), restarting in ${delay}ms`);
            setTimeout(spawnWorker, delay);
        });
    };

    spawnWorker();
} else {
    // Dynamic imports to prevent execution in Primary process
    const { default: app } = await import("./app/app.js");
    const { default: socket } = await import("./app/socket.io.js");

    const PORT = process.env.PORT || 5000;
    const server = http.createServer(app);

    socket(server);

    await mongooseConfig();
    await redis.connect();
    server.listen(PORT, "0.0.0.0", () => {
        console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
    });
}