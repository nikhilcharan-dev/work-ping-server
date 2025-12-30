import mongoose from "mongoose";

const govtProofSchema = new mongoose.Schema(
    {
        aadhaarNumber: { type: String, required: true },

        passportNumber: String,

        panNumber: { type: String, required: true },

        bankAccount: { type: String, required: true }
    },
    { timestamps: true }
);

export default mongoose.model("GovtProof", govtProofSchema);
