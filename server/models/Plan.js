import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, index: true },
        amount : {type: Number, required: true},
        
    },
    { timestamps: true }
);

export default mongoose.model("Plan", planSchema);
