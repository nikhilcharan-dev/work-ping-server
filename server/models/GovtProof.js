import mongoose from "mongoose";

const govtProofSchema = new mongoose.Schema(
    {
        aadhaarNumber: { type: String, required: true },

        passportNumber: String,

        panNumber: String,

        bankAccount: String,

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        }
    },
    { timestamps: true }

);

export default mongoose.model("GovtProof", govtProofSchema);
