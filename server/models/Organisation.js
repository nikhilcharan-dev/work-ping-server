import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, index: true },

        type: { type: String },

        clDays: { type: Number, default: 12 },

        description: { type: String },

        ipWhitelist: [{ type: String, index: true }],

        foundedAt: { type: Date },

        geoFencing: {
            enabled: { type: Boolean, default: false },
            coordinates: {
                lat: Number,
                lng: Number,
                radiusMeters: Number
            }
        }
    },
    { timestamps: true }
);

export default mongoose.model("Organization", organizationSchema);
