import Subscription from "#models/Subscription.js";
import { successResponse, errorResponse } from "#utils/response.helper.js";

const getActiveSubscription = asyncHandler(async (req, res) => {
    const { userId } = req.user;

    const subscription = await Subscription.findOne({
        adminId: userId,
        status: "ACTIVE"
    })
    .populate("planId")
    .sort({ createdAt: -1 })
    .lean();

    if (!subscription) {
        return errorResponse(res, "No active subscription found", 404);
    }

    return successResponse(res, "Active subscription fetched successfully", subscription);
}, "ADMIN_GET_ACTIVE_SUBSCRIPTION_ERROR");

const getSubscriptionHistory = asyncHandler(async (req, res) => {
    const { userId } = req.user;

    const subscriptions = await Subscription.find({ adminId: userId })
        .populate("planId")
        .sort({ createdAt: -1 })
        .lean();

    return successResponse(res, "Subscription history fetched successfully", subscriptions);
}, "ADMIN_GET_SUBSCRIPTION_HISTORY_ERROR");

export {
    getActiveSubscription,
    getSubscriptionHistory
};
