import mongoose from "mongoose";

const dayInfoSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true
        },

        date: { type: Date, required: true, index: true },

        type: {
            type: String,
            enum: ["workingDay", "holiday", "weekend"],
            required: true,
            index: true
        },

        description: String
    },
    { timestamps: true }
);

dayInfoSchema.index(
    { organizationId: 1, date: 1 },
    { unique: true }
);

export default mongoose.model("DayInfo", dayInfoSchema);
