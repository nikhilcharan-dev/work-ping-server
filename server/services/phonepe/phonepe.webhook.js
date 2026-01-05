import Order from "#models/Order.js"
import {Router} from "express";

const router = Router();

const phonepeWebhook = asyncHandler(
    async(req, res) => {
        const {merchantOrderId, state, amount, userId, paymentDetails} = req.body;
        
        const order = await Order.findOneAndUpdate({orderId: merchantOrderId}, {orderStatus: state});

        res.status(200);
    }
)


router.post("/phonepe-webhook", phonepeWebhook);