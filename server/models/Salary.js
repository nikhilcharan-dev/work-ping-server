import mongoose from "mongoose";

const SalarySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true, index: true, refPath: 'role'
    },

    role: {
        type: String,
        enum: ["Administrator", "Manager", "Employee"],
        required: true,
    },

    month: { type: String, required: true, index: true },
    baseSalary: { type: Number, required: true },
    bonuses: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },

    netSalary: { type: Number, required: true },

    status: { type: String, enum: ["pending", "paid"], default: "pending" },

}, { timestamps: true });

SalarySchema.index({ user_id: 1, month: 1 }, { unique: true });

const Salary = mongoose.model("Salary", SalarySchema);
export default Salary;
