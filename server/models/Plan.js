import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, index: true }
    },
    { timestamps: true }
);

export default mongoose.model("Plan", planSchema);
