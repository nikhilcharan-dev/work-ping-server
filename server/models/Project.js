import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, index: true },

        description: String,

        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true
        },

        projectManager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        assignedDate: { type: Date, required: true },

        dueDate: Date,

        contractedBy: String,

        status: {
            type: String,
            enum: ["active", "completed", "onHold"],
            default: "active",
            index: true
        }
    },
    { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
