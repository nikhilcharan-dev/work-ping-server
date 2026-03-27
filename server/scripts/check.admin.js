import mongoose from "mongoose";
import "dotenv/config";

const adminSchema = new mongoose.Schema({ email: String, name: String }, { strict: false });
const orderSchema = new mongoose.Schema({}, { strict: false });
const paymentSchema = new mongoose.Schema({}, { strict: false });
const subscriptionSchema = new mongoose.Schema({}, { strict: false });

const Admin = mongoose.model("Admin", adminSchema);
const Order = mongoose.model("Order", orderSchema, "orders");
const Payment = mongoose.model("Payment", paymentSchema, "payments");
const Subscription = mongoose.model("Subscription", subscriptionSchema, "subscriptions");

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);

    const admin = await Admin.findOne({ email: "admin@workping.com" }).lean();
    if (!admin) {
        console.log("❌  admin@workping.com not found");
        await mongoose.disconnect();
        return;
    }

    console.log("✅  Admin found");
    console.log(`    _id   : ${admin._id}`);
    console.log(`    name  : ${admin.name}`);
    console.log(`    email : ${admin.email}`);

    const orders = await Order.find({ userId: admin._id }).sort({ createdAt: -1 }).lean();
    console.log(`\n📦  Orders (${orders.length}):`);
    for (const o of orders) {
        console.log(`    ${o._id}  status=${o.orderStatus}  amount=₹${o.amount}  phonepeOrderId=${o.phonepeOrderId ?? "—"}`);
    }

    const payments = await Payment.find({ adminId: admin._id }).sort({ createdAt: -1 }).lean();
    console.log(`\n💳  Payments (${payments.length}):`);
    for (const p of payments) {
        console.log(`    ${p._id}  status=${p.status}  amount=₹${p.amount}  txn=${p.transactionId ?? "—"}`);
    }

    const subs = await Subscription.find({ adminId: admin._id }).sort({ createdAt: -1 }).lean();
    console.log(`\n🔑  Subscriptions (${subs.length}):`);
    for (const s of subs) {
        console.log(`    ${s._id}  status=${s.status}  cycle=${s.billingCycle}  end=${s.endDate}`);
    }

    await mongoose.disconnect();
}

check().catch(err => { console.error(err); process.exit(1); });
