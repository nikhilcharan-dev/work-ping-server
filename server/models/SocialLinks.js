
import mongoose from "mongoose";

const socialLinksSchema = new mongoose.Schema(
    {
        linkedin: String,

        github: String,

        facebook: String,

        portfolio: String,

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

export default mongoose.model("SocialLinks", socialLinksSchema);
