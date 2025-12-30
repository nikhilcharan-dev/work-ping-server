import mongoose from "mongoose";

const otpMailSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        otp: { type: String, required: true }
    },
    { timestamps: true }
);

otpMailSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 3000 }
);

export default mongoose.model("OtpMail", otpMailSchema);
