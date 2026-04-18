import mongoose from "mongoose";
import "dotenv/config";

await mongoose.connect(process.env.MONGODB_URI);

const Plan = mongoose.model("Plan", new mongoose.Schema({}, { strict: false }), "plans");

const updates = [
  {
    name: "Basic",
    maxEmployees: 50,
    maxOrganizations: 1,
    maxTeams: 5,
    maxProjects: 10,
    features: [
      "1 organization",
      "Up to 50 employees",
      "Up to 5 teams",
      "Up to 10 projects",
      "Face recognition attendance (up to 2 teams)",
      "Attendance & leave management",
      "Email support"
    ]
  },
  {
    name: "Standard",
    maxEmployees: 150,
    maxOrganizations: 3,
    maxTeams: 20,
    maxProjects: 50,
    features: [
      "Up to 3 organizations",
      "Up to 150 employees",
      "Up to 20 teams",
      "Up to 50 projects",
      "Face recognition attendance (up to 5 teams)",
      "Attendance & leave management",
      "Holiday management",
      "Priority email support"
    ]
  },
  {
    name: "Pro",
    maxEmployees: 1500,
    maxOrganizations: 10,
    maxTeams: 9999,
    maxProjects: 9999,
    features: [
      "Up to 10 organizations",
      "Up to 1,500 employees",
      "Unlimited teams & projects",
      "Face recognition attendance (unlimited teams)",
      "Attendance & leave management",
      "WhatsApp notifications",
      "Advanced analytics",
      "Priority support"
    ]
  },
  {
    name: "Enterprise",
    maxEmployees: 9999,
    maxOrganizations: 9999,
    maxTeams: 9999,
    maxProjects: 9999,
    features: [
      "Unlimited organizations",
      "Unlimited employees",
      "Unlimited teams & projects",
      "Face recognition attendance (unlimited)",
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

for (const { name, maxEmployees, maxOrganizations, maxTeams, maxProjects, features } of updates) {
  await Plan.updateOne({ name }, { $set: { maxEmployees, maxOrganizations, maxTeams, maxProjects, features } });
  console.log(`✅  ${name}`);
  features.forEach(f => console.log(`       • ${f}`));
}

await mongoose.disconnect();
console.log("\nDone.");
