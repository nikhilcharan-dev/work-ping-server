import authRoutes from "../routes/auth/router.js";
import attendanceRoutes from "../routes/attendanceRoutes/router.js";
import testRoutes from "../routes/attendanceRoutes/test.js";

// WhatsApp config & routes
import whatsappConfig from "../config/whatsappConfig.js";
import whatsAppWebhook from "../services/whatsapp/api/receiver.js";
import whatsAppRoutes from "../services/whatsapp/api/sender.js";

export default function routes(app) {
    app.get("/ping", (req, res) => {
        res.json({ status: "pong", ip: req.ip });
    });

    // WhatsApp (protected)
    app.use("/secure/whatsapp", whatsappConfig);
    app.use("/secure/whatsapp", whatsAppWebhook);
    app.use("/secure/whatsapp", whatsAppRoutes);

    app.use("/api/auth", authRoutes);
    app.use("/api/attendance", attendanceRoutes);

    app.use("/api/test", testRoutes);
}
