import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
    {   
        name: { type: String, required: true, index: true },

        type: { type: String },

        clDays: { type: Number, default: 12 },

        description: { type: String },

        ipWhitelist: [{ type: String, required: true,index: true }],

        foundedAt: { type: Date },

        passKey : { type: Number , required: true },

        geoFencing: {
            enabled: { type: Boolean, default: false },
            firstPoint: {
                longitude: { type : String },
                latitude: { type : String },
            },  
            secondPoint: {
                longitude: { type : String },
                latitude: { type : String },
            },
            thirdPoint: {
                longitude: { type : String },
                latitude: { type : String },
            },
            fourthPoint: {
                longitude: { type : String },
                latitude: { type : String }
            }
        }
    },
    { timestamps: true }
);

export default mongoose.model("Organization", organizationSchema);
