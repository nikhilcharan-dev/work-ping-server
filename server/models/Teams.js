import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },

        description: String,

        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

export default mongoose.model("Team", teamSchema);
