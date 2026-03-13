import Order from "#models/Order.js";
import Payment from "#models/Payment.js";
import Subscription from "#models/Subscription.js";
import Plan from "#models/Plan.js";
import OrgAdmin from "#models/Admin.Org.js";
import { Router } from "express";
import crypto from "crypto";

const router = Router();

// PhonePe state → our orderStatus
const STATE_MAP = {
    COMPLETED: "Success",
    FAILED:    "Failed",
    PENDING:   "Pending"
};

// PhonePe paymentMode → our paymentMethod enum
const METHOD_MAP = {
    UPI:         "UPI",
    CARD:        "Credit Card",
    NET_BANKING: "Net Banking",
    WALLET:      "UPI"
};

/**
 * Verify PhonePe X-VERIFY signature.
 * Header: SHA256(base64Body + endpoint + saltKey) + "###" + saltIndex
 */
function verifyPhonePeSignature(rawBody, xVerify, endpoint = "/phonepe-webhook") {
    const saltKey   = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX;

    if (!xVerify) return false;

    const [receivedHash, receivedIndex] = xVerify.split("###");
    if (receivedIndex !== saltIndex) return false;

    const bodyBase64 = Buffer.from(rawBody).toString("base64");
    const checksum   = crypto
        .createHash("sha256")
        .update(bodyBase64 + endpoint + saltKey)
        .digest("hex");

    return checksum === receivedHash;
}

const phonepeWebhook = asyncHandler(
    async (req, res) => {
        // --- Signature verification ---
        const xVerify = req.headers["x-verify"];
        const rawBody = JSON.stringify(req.body);

        if (!verifyPhonePeSignature(rawBody, xVerify)) {
            return res.status(400).json({ type: "error", message: "Invalid signature" });
        }

        const { merchantOrderId, state, amount, paymentDetails } = req.body;

        if (!merchantOrderId || !state) {
            return res.status(400).json({ type: "error", message: "Missing required fields" });
        }

        const orderStatus = STATE_MAP[state] ?? "Pending";

        // Fetch our order (merchantOrderId = our Order._id)
        const order = await Order.findById(merchantOrderId);
        if (!order) {
            console.warn(`[PhonePe Webhook] Unknown order: ${merchantOrderId}`);
            return res.status(200).json({ type: "success", message: "OK" });
        }

        const userId = order.userId.toString();

        // Extract payment details from PhonePe payload
        const detail        = Array.isArray(paymentDetails) ? paymentDetails[0] : null;
        const transactionId = detail?.transactionId ?? null;
        const paymentMode   = detail?.paymentMode   ?? "UPI";
        const paymentMethod = METHOD_MAP[paymentMode] ?? "UPI";

        order.orderStatus = orderStatus;
        if (transactionId) order.transactionId = transactionId;
        await order.save();

        // --- COMPLETED ---
        if (state === "COMPLETED") {
            // Look up organization via OrgAdmin join model
            const orgAdmin = await OrgAdmin.findOne({ primaryAdmin: order.userId }).lean();
            const organizationId = orgAdmin?.organizationId;

            // Create Payment record
            const payment = await Payment.create({
                adminId:        order.userId,
                organizationId: organizationId ?? order.userId,
                orderId:        order._id,
                amount:         amount / 100,   // paise → rupees
                paymentMethod,
                paymentGateway: "PHONEPE",
                transactionId,
                status:         "SUCCESS",
                paidAt:         new Date()
            });

            // Create Subscription
            const plan = await Plan.findById(order.planId);
            if (plan) {
                const startDate = new Date();
                const endDate   = new Date();

                plan.billingCycle === "YEARLY"
                    ? endDate.setFullYear(endDate.getFullYear() + 1)
                    : endDate.setMonth(endDate.getMonth() + 1);

                await Subscription.create({
                    adminId:        order.userId,
                    organizationId: organizationId,
                    planId:         plan._id,
                    orderId:        order._id,
                    planName:       plan.name,
                    price:          plan.amount,
                    billingCycle:   plan.billingCycle,
                    status:         "ACTIVE",
                    startDate,
                    endDate,
                    paymentId:      payment._id
                });

                // Emit success to client — closes "Processing..." UI
                io.to(`payment:${userId}`).emit("payment:success", {
                    orderId:       order._id,
                    transactionId,
                    planName:      plan.name,
                    amount:        payment.amount,
                    billingCycle:  plan.billingCycle,
                    subscriptionEnds: endDate
                });
            }

            // Clear Redis pending-payment key
            await redis.del(`payment:${userId}`);

        // --- FAILED ---
        } else if (state === "FAILED") {
            io.to(`payment:${userId}`).emit("payment:failed", {
                orderId: order._id,
                reason:  detail?.errorCode ?? "Payment failed"
            });
        }

        return res.status(200).json({ type: "success", message: "OK" });
    },
    "PHONEPE_WEBHOOK_ERROR"
);

router.post("/phonepe-webhook", phonepeWebhook);

export default router;
