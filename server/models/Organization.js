import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, index: true },

        type: { type: String, trim: true },

        clDays: { type: Number, default: 12 },

        description: { type: String },

        IPWhitelist: [{ type: String }],

        foundedAt: { type: Date },

        coordinates: [{ type: Number }],

        msl: { type: String },

        logo: { type: String }
    },
    { timestamps: true }
);

export default mongoose.model("Organization", organizationSchema);
