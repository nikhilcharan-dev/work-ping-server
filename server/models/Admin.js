import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },

        email: { type: String, required: true, unique: true },

        password: { type: String, required: true },

        emailVerified: { type: Boolean, default: false },

        phoneNumber: { type: String, required: true },

        phoneVerified: { type: Boolean, default: false },

        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Plan"
        },

        paymentId : {}
    },
    { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
