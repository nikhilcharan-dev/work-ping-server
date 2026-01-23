import mongoose from "mongoose";

const orgAdminSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true ,
            index: true
        },

        primaryAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true
        },

        secondaryAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin"
        }
    },
    { timestamps: true }
);

export default mongoose.model("OrgAdmin", orgAdminSchema);
