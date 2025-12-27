import mongoose from "mongoose";

const SalarySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
    },

    role: {
        type: String,
        required: true,
    },

    month: { type: String, required: true},
    days_present: { type: Number, required: true},
    lop_days: { type: Number, required: true },
    overtime_hours: { type: Number, required: true },

    base_salary: { type: Number, required: true },
    bonuses: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },

    net_salary: { type: Number, required: true },

    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    generated_date: { type: Date, default: Date.now },

}, { timestamps: true });

SalarySchema.index({ user_id: 1, month: 1 }, { unique: true });

const Salary = mongoose.model("Salary", SalarySchema);
export default Salary;
