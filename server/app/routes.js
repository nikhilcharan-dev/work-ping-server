import authRoutes from "../routes/auth/router.js";
import attendanceRoutes from "../routes/attendanceRoutes/router.js";
import testRoutes from "../routes/attendanceRoutes/test.js";

// WhatsApp config and routes
import whatsappConfig from "../config/whatsappConfig.js";
import whatsAppWebhook from "../services/whatsapp/api/receiver.js";
import whatsAppRoutes from "../services/whatsapp/api/sender.js";
import validateJWT from "../middleware/jwtBearer.js";

export default function routes(app) {
    app.get("/", (req, res) => {
        res.json({ status: "OK", ip: req.ip });
    });

    // WhatsApp (protected)
    app.use("/secure/whatsapp", whatsappConfig);
    app.use("/secure/whatsapp", whatsAppWebhook);
    app.use("/secure/whatsapp", whatsAppRoutes);

    app.use("/api/auth", authRoutes);
    app.use("/api/attendance", validateJWT, attendanceRoutes);

    app.use("/api/test", testRoutes);
}
