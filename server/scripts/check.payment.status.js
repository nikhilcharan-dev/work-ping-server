import axios from "axios";
import "dotenv/config";

const PHONEPE_URI = process.env.PHONE_PE;
// merchantOrderId = our MongoDB Order _id (what we sent as merchantOrderId to PhonePe)
const orderId = "69c6dbc91aa971ece812177e";

try {
    const res = await axios.post(`${PHONEPE_URI}/api/payments/get-payment-status`, { orderId });
    console.log("Status :", res.status);
    console.log("Headers:", JSON.stringify(res.headers, null, 2));
    console.log("Data   :", JSON.stringify(res.data, null, 2));
} catch (err) {
    console.error("HTTP Error:", err?.response?.status);
    console.error("Response :", JSON.stringify(err?.response?.data, null, 2));
    console.error("Message  :", err.message);
}
