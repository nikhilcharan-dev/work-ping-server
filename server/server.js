import "dotenv/config";
import http from "http";
import app from "./app/app.js";
import mongooseConfig from "./config/mongooseDB.js";

const PORT = process.env.PORT || 5001;
const server = http.createServer(app);

(async () => {
    await mongooseConfig();
    server.listen(PORT, () => {
        console.log(`[Server] Running ${PORT}`);
    });
})();