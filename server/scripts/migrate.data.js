/**
 * migrate.data.js
 *
 * Normalizes existing DB data to match the validation rules added in the audit fixes.
 * Safe to run multiple times — each step is idempotent.
 *
 * Run from server/server/:
 *   node scripts/migrate.data.js
 */

import mongoose from "mongoose";
import "dotenv/config";

// ── Inline schemas (avoids alias resolution outside main app) ─────────────────

const userSchema = new mongoose.Schema({ phone: String }, { strict: false });
const orgSchema  = new mongoose.Schema({ coordinates: mongoose.Schema.Types.Mixed, msl: String }, { strict: false });
const leaveSchema = new mongoose.Schema({ dates: mongoose.Schema.Types.Mixed }, { strict: false });

const User  = mongoose.model("User",  userSchema,  "users");
const Org   = mongoose.model("Org",   orgSchema,   "organizations");
const Leave = mongoose.model("Leave", leaveSchema, "leaves");

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalize a phone to exactly 10 digits.
 * Handles: 91XXXXXXXXXX, +91XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX
 * Returns null if it can't be made valid.
 */
function normalizePhone(raw) {
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0"))  return digits.slice(1);
    if (digits.length === 10) return digits;
    return null;
}

/**
 * Normalize coordinates to [lat, lng] array.
 * Handles: {lat,lng}, {latitude,longitude}, "lat,lng" string, already-array.
 * Returns null if it can't be converted.
 */
function normalizeCoordinates(raw) {
    if (raw === null || raw === undefined) return null;

    // Already a valid [lat, lng] array
    if (Array.isArray(raw) && raw.length === 2) {
        const [lat, lng] = raw.map(Number);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return [lat, lng];
        }
        return null;
    }

    // Object with lat/lng or latitude/longitude
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const lat = Number(raw.lat ?? raw.latitude);
        const lng = Number(raw.lng ?? raw.longitude);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return [lat, lng];
        }
        return null;
    }

    // "lat,lng" string
    if (typeof raw === "string") {
        const parts = raw.split(",").map(s => Number(s.trim()));
        if (parts.length === 2) {
            const [lat, lng] = parts;
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return [lat, lng];
            }
        }
        return null;
    }

    return null;
}

// ── Migration steps ───────────────────────────────────────────────────────────

async function migrateUserPhones() {
    console.log("\n── User.phone ──────────────────────────────────────────");
    const users = await User.find({ phone: { $exists: true } }).lean();
    let fixed = 0, skipped = 0, alreadyOk = 0;

    for (const user of users) {
        const normalized = normalizePhone(user.phone);

        if (!normalized) {
            console.warn(`  SKIP  _id=${user._id}  phone="${user.phone}"  (cannot normalize)`);
            skipped++;
            continue;
        }

        if (normalized === user.phone) {
            alreadyOk++;
            continue;
        }

        // Check for collision before updating
        const collision = await User.findOne({ phone: normalized, _id: { $ne: user._id } }).lean();
        if (collision) {
            console.warn(`  SKIP  _id=${user._id}  phone="${user.phone}" → "${normalized}"  (collision with _id=${collision._id})`);
            skipped++;
            continue;
        }

        await User.updateOne({ _id: user._id }, { $set: { phone: normalized } });
        console.log(`  FIX   _id=${user._id}  "${user.phone}" → "${normalized}"`);
        fixed++;
    }

    console.log(`  Result: ${fixed} fixed, ${alreadyOk} already ok, ${skipped} skipped`);
}

async function migrateOrgCoordinates() {
    console.log("\n── Organization.coordinates ────────────────────────────");
    const orgs = await Org.find({ coordinates: { $exists: true } }).lean();
    let fixed = 0, cleared = 0, alreadyOk = 0;

    for (const org of orgs) {
        const normalized = normalizeCoordinates(org.coordinates);

        if (!normalized) {
            // Can't convert — remove it so it doesn't crash validation
            await Org.updateOne({ _id: org._id }, { $unset: { coordinates: "" } });
            console.warn(`  CLEAR _id=${org._id}  coordinates=${JSON.stringify(org.coordinates)}  (unrecognised format — removed)`);
            cleared++;
            continue;
        }

        const alreadyArray = Array.isArray(org.coordinates) &&
            org.coordinates[0] === normalized[0] &&
            org.coordinates[1] === normalized[1];

        if (alreadyArray) {
            alreadyOk++;
            continue;
        }

        await Org.updateOne({ _id: org._id }, { $set: { coordinates: normalized } });
        console.log(`  FIX   _id=${org._id}  ${JSON.stringify(org.coordinates)} → ${JSON.stringify(normalized)}`);
        fixed++;
    }

    console.log(`  Result: ${fixed} fixed, ${alreadyOk} already ok, ${cleared} cleared (bad format)`);
}

async function migrateOrgMsl() {
    console.log("\n── Organization.msl ─────────────────────────────────────");
    const result = await Org.updateMany(
        { msl: { $in: ["", null] } },
        { $unset: { msl: "" } }
    );
    console.log(`  Result: ${result.modifiedCount} empty msl values removed`);
}

async function migrateLeafDates() {
    console.log("\n── Leave.dates ──────────────────────────────────────────");
    const result = await Leave.updateMany(
        { $or: [{ dates: null }, { dates: { $exists: false } }] },
        { $set: { dates: [] } }
    );
    console.log(`  Result: ${result.modifiedCount} leave records fixed (null/missing dates → [])`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI not set — aborting");
        process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected.\n");

    await migrateUserPhones();
    await migrateOrgCoordinates();
    await migrateOrgMsl();
    await migrateLeafDates();

    console.log("\nMigration complete.");
    await mongoose.disconnect();
}

run().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
