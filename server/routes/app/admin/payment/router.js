import { Router } from "express";
import axios from "axios";

const router = Router();

router.post('/initiate-payment', asyncHandler(
    async (req, res) => {
        const { amount } = req.body;
        // const { userId } = req.user;
        const { userId } = 1234567890;
        const gatewayRes = await axios.post("https://phonepe.workping.live", 
            {},
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "earthisflat"
                }
            }
        )
    }
), "INTIATE_PAYMENT_ERROR");

export default router;