import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema(
{
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization"
    },

    planName: {
        type: String,
        enum: ["FREE", "BASIC", "PRO", "ENTERPRISE"],
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    billingCycle: {
        type: String,
        enum: ["MONTHLY", "YEARLY"],
        required: true
    },

    status: {
        type: String,
        enum: ["ACTIVE", "CANCELLED", "EXPIRED", "PAST_DUE"],
        default: "ACTIVE"
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment"
    },

    autoRenew: {
        type: Boolean,
        default: true
    }

},
{
    timestamps: true
});

export default mongoose.model("Subscription", SubscriptionSchema);