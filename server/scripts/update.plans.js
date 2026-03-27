import mongoose from "mongoose";
import "dotenv/config";

await mongoose.connect(process.env.MONGODB_URI);

const Plan = mongoose.model("Plan", new mongoose.Schema({}, { strict: false }), "plans");

const updates = [
  {
    name: "Basic",
    maxEmployees: 50,
    features: [
      "Up to 50 employees",
      "Face recognition attendance (up to 2 teams)",
      "Up to 5 teams",
      "Up to 10 projects",
      "Attendance & leave management",
      "Email support"
    ]
  },
  {
    name: "Standard",
    maxEmployees: 150,
    features: [
      "Up to 150 employees",
      "Face recognition attendance (up to 5 teams)",
      "Up to 20 teams",
      "Up to 50 projects",
      "Attendance & leave management",
      "Holiday management",
      "Priority email support"
    ]
  },
  {
    name: "Pro",
    maxEmployees: 1500,
    features: [
      "Up to 1,500 employees",
      "Face recognition attendance (unlimited teams)",
      "Unlimited teams",
      "Unlimited projects",
      "Attendance & leave management",
      "WhatsApp notifications",
      "Advanced analytics",
      "Priority support"
    ]
  },
  {
    name: "Enterprise",
    maxEmployees: 9999,
    features: [
      "Unlimited employees",
      "Face recognition attendance (unlimited)",
      "Unlimited teams & projects",
      "Attendance & leave management",
      "WhatsApp notifications",
      "Advanced analytics",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "24/7 support"
    ]
  }
];

for (const { name, maxEmployees, features } of updates) {
  await Plan.updateOne({ name }, { $set: { maxEmployees, features } });
  console.log(`✅  ${name}`);
  features.forEach(f => console.log(`       • ${f}`));
}

await mongoose.disconnect();
console.log("\nDone.");
