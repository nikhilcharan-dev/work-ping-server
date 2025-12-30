import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true
        },

        dates: [{ type: Date, required: true }],

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true
        },

        appliedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        reason: String
    },
    { timestamps: true }
);

export default mongoose.model("Leave", leaveSchema);
