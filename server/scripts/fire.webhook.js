import axios from "axios";
import "dotenv/config";

// Data from the get-payment-status response
const payload = {
    merchantOrderId: "69c6dbc91aa971ece812177e",
    state: "COMPLETED",
    amount: 49900,
    paymentDetails: [
        {
            paymentMode: "UPI_QR",
            transactionId: "OM2603280104584670107360",
            timestamp: 1774640368268,
            amount: 49900,
            state: "COMPLETED"
        }
    ]
};

try {
    const res = await axios.post(
        `http://localhost:${process.env.PORT || 5000}/api/phonepe/webhook`,
        payload,
        { headers: { "x-webhook-secret": process.env.PHONEPE_SECRET } }
    );
    console.log("✅  Webhook response:", JSON.stringify(res.data, null, 2));
} catch (err) {
    console.error("❌  Error:", err?.response?.status, JSON.stringify(err?.response?.data, null, 2) || err.message);
}
