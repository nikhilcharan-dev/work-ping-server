import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
    {   
        name: { type: String, required: true, index: true },

        type: { type: String },

        clDays: { type: Number, default: 12 },

        description: { type: String },

        IPWhitelist: [{ type: String, required: true,index: true }],

        foundedAt: { type: Date },

        passKey : { type: Number , required: true },

        geoFencing: {
            enabled: { type: Boolean, default: false },
            corners: [
                {
                    lat: String,
                    long: String
                }
            ]
        }
    },
    { timestamps: true }
);

export default mongoose.model("Organization", organizationSchema);
