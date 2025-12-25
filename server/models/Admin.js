import mongoose from 'mongoose';

const Admin = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    email_verified: { type: Boolean, default: false },
    phone_number: { type: String, required: true },
    phone_verified: { type: Boolean, default: false },
    plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
}, { timestamps: true });

export default mongoose.model("Admin", Admin);