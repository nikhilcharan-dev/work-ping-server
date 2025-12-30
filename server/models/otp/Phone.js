import mongoose from "mongoose";

const otpPhoneSchema = new mongoose.Schema(
    {
        phone: { type: String, required: true, unique: true },
        otp: { type: String, required: true }
    },
    { timestamps: true }
);

otpPhoneSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 3000 }
);

export default mongoose.model("OtpPhone", otpPhoneSchema);
