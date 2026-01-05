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

        const phonepeRes =  axios.post(`${PHONEPE_URI}/api/payments/initiate-payment`, {
            orderId : newOrder._id,
            userId,
            amount: planId.amount
        }).data; // {orderId, state, expireAt : TimeStamp, redirectUrl}

        newOrder.phonepeOrderId = phonepeRes.orderId;

        await newOrder.save();

        await redis.set(`payment:${userId}`, {
            expireAt: phonepeRes.expireAt,
            status: "Pending"
        });


        return res.status(200).json({
            success: true,
            redirectUrl: phonepeRes.data.redirectUrl
        });     

    }, "PHONEPE_GATEWAY_ERROR"
)

router.post("/initiate-payment", phonepeGateway);