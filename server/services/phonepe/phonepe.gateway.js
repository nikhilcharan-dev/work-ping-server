import Order from "#models/Order.js";
import Plan from "#models/Plan.js";
import {Router} from "express";
import axios from "axios";

const router = Router();

const PHONEPE_URI = process.env.PHONE_PE;

const phonepeGateway = asyncHandler(
    async(req, res) => {
        const {planId} = req.body;
        const {userId} = req.user;
        if(!planId) {
            return res.status(401).json({
                error : "planId required"
            })
        }

        const plan = await Plan.findById(planId);

        if(!plan){
            return res.status(401).json({
                error: "invalid planId"
            })
        }

        const newOrder = await Order.create({
            userId,
            planId,
            amount : plan.amount,
            date: Date.now(),
        });

        // const phonepeRes = axios.post(...).data  — was missing await, planId.amount wrong, .data.redirectUrl wrong
        const phonepeRes = (await axios.post(`${PHONEPE_URI}/api/payments/initiate-payment`, {
            orderId: newOrder._id,
            userId,
            amount: plan.amount  // was: planId.amount (planId is a string, not the plan object)
        })).data; // {orderId, state, expireAt : TimeStamp, redirectUrl}

        newOrder.phonepeOrderId = phonepeRes.orderId;

        await newOrder.save();

        // was: redis.set with plain object — Redis only stores strings
        await redis.set(`payment:${userId}`, JSON.stringify({
            expireAt: phonepeRes.expireAt,
            status: "Pending"
        }));

        return res.status(200).json({
            success: true,
            redirectUrl: phonepeRes.redirectUrl  // was: phonepeRes.data.redirectUrl (not nested under .data)
        });

    }, "PHONEPE_GATEWAY_ERROR"
)

router.post("/initiate-payment", phonepeGateway);