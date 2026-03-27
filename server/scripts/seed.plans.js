import mongoose from "mongoose";
import "dotenv/config";

// ── Plan schema (inline — avoids alias resolution outside the main app) ──
const planSchema = new mongoose.Schema(
    {
        name:         { type: String, required: true, index: true, trim: true },
        description:  { type: String, trim: true, maxlength: 500 },
        amount:       { type: Number, required: true, min: 0 },
        amountInPaise:{ type: Number, required: true },
        billingCycle: { type: String, enum: ["MONTHLY", "YEARLY"], default: "MONTHLY" },
        maxEmployees: { type: Number, default: 10 },
        features:     { type: [String], default: [] },
        isActive:     { type: Boolean, default: true, index: true }
    },
    { timestamps: true }
);
planSchema.pre("save", function (next) {
    this.amountInPaise = Math.round(this.amount * 100);
    next();
});
const Plan = mongoose.model("Plan", planSchema);

// ── Plans to seed ────────────────────────────────────────────────────────
const PLANS = [
    {
        name: "Basic",
        description: "Perfect for small teams getting started.",
        amount: 499,
        amountInPaise: 49900,
        billingCycle: "MONTHLY",
        maxEmployees: 10,
        features: [
            "Up to 10 employees",
            "Attendance tracking",
            "Leave management",
            "Email support"
        ]
    },
    {
        name: "Standard",
        description: "Great for growing businesses.",
        amount: 999,
        amountInPaise: 99900,
        billingCycle: "MONTHLY",
        maxEmployees: 25,
        features: [
            "Up to 25 employees",
            "Everything in Basic",
            "Team & project management",
            "Holiday management",
            "Priority email support"
        ]
    },
    {
        name: "Pro",
        description: "For teams that need more power.",
        amount: 1999,
        amountInPaise: 199900,
        billingCycle: "MONTHLY",
        maxEmployees: 100,
        features: [
            "Up to 100 employees",
            "Everything in Standard",
            "Face recognition attendance",
            "WhatsApp notifications",
            "Advanced analytics",
            "Priority support"
        ]
    },
    {
        name: "Enterprise",
        description: "Unlimited scale for large organisations.",
        amount: 4999,
        amountInPaise: 499900,
        billingCycle: "MONTHLY",
        maxEmployees: 9999,
        features: [
            "Unlimited employees",
            "Everything in Pro",
            "Dedicated account manager",
            "Custom integrations",
            "SLA guarantee",
            "24/7 support"
        ]
    }
];

// ── Run ──────────────────────────────────────────────────────────────────
async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    for (const data of PLANS) {
        const existing = await Plan.findOne({ name: data.name });
        if (existing) {
            console.log(`  SKIP  ${data.name} (already exists — _id: ${existing._id})`);
        } else {
            const created = await Plan.create(data);
            console.log(`  CREATE ${data.name} — ₹${data.amount}/mo — _id: ${created._id}`);
        }
    }

    await mongoose.disconnect();
    console.log("Done.");
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
