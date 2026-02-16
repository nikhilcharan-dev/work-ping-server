import mongoose from "mongoose";


/*
    @password & authentication is moved to Account Schema
 */
const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },

        email: { type: String, required: true, unique: true, index: true },

        phone: { type: String, unique: true, required: true, sparse: true },

        employeeId: { type: String, unique: true, required: true },

        gender: {
            type: String,
            enum: ["male", "female", "other"],
            default: "other"
        },

        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true
        },

        profileImage: {
            type: String,
            default: null,
        },

        salary: { type: Number, default: 0 },

        dob: Date,

        address: String,

        dateOfJoining: { type: Date, required: true, index: true },

        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            index: true
        },

        // skills links experience
        roleInTeam: {
            type: String,
            enum: ["manager", "teamLead", "member"],
            default: "member",
            index: true
        },

        isActive: { type: Boolean, default: true, index: true }

    },
    { timestamps: true }
);

userSchema.index(
    { _id: 1, teamId: 1 },
    { unique: true }
);

export default mongoose.model("User", userSchema);
