import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },

        email: { type: String, required: true, unique: true, index: true },

        password: { type: String, required: true },

        phone: { type: String, unique: true, sparse: true },

        dob: Date,

        address: String,

        gender: {
            type: String,
            enum: ["male", "female", "other"],
            default: "other"
        },

        dateOfJoining: { type: Date, index: true },

        role: {
            type: String,
            enum: ["orgAdmin", "orgManager", "orgEmployee"],
            default: "orgEmployee",
            index: true
        },

        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
