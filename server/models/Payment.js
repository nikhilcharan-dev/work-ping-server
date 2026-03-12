import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
{
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true
    },

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true
    },

    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    currency: {
        type: String,
        default: "INR",
        uppercase: true
    },

    paymentMethod: {
        type: String,
        enum: ["UPI", "CARD", "NETBANKING", "WALLET", "CASH"],
        required: true
    },

    paymentGateway: {
        type: String,
        enum: ["RAZORPAY", "STRIPE", "PAYPAL", "MANUAL"],
        default: "MANUAL"
    },

    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },

    status: {
        type: String,
        enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
        default: "PENDING"
    },

    description: {
        type: String,
        trim: true,
        maxlength: 500
    },

    paidAt: {
        type: Date
    }

},
{
    timestamps: true
});

export default mongoose.model("Payment", PaymentSchema);