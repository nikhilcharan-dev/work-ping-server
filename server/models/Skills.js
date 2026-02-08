
import mongoose from "mongoose";

const skillsSchema = new mongoose.Schema(
    {
        skillName: { type: String, required: true },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

export default mongoose.model("Skills", skillsSchema);
