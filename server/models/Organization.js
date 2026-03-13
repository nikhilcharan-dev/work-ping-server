import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, index: true },

        type: {
            type: String,
            enum: ["Private", "Public", "Government", "NGO", "Startup", "Enterprise"],
            trim: true
        },

        clDays: { type: Number, default: 12 },

        description: { type: String },

        IPWhitelist: [{ type: String }],

        foundedAt: { type: Date }
    },
    { timestamps: true }
);

export default mongoose.model("Organization", organizationSchema);
