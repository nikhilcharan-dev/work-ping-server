import mongoose from 'mongoose';
import Organization from '../models/Organization.js';
import 'dotenv/config';

// 3267... Haversine from location.js
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

async function checkOrg() {
    await mongoose.connect(process.env.MONGODB_URI);
    const org = await Organization.findOne({ name: "WorkPing HQ" });
    
    if (!org) {
        console.log("Organization 'WorkPing HQ' not found.");
        const allOrgs = await Organization.find({}, { name: 1 });
        console.log("Available orgs:", allOrgs.map(o => o.name));
        process.exit(1);
    }

    console.log("Org found:", org.name);
    console.log("Coordinates (GeoJSON [lon, lat]):", JSON.stringify(org.coordinates));

    // User coordinates from logs: lat: 17.1785037, lon: 81.6920266
    const userLat = 17.1785037;
    const userLon = 81.6920266;

    if (org.coordinates && org.coordinates.length >= 2) {
        const orgLon = org.coordinates[0];
        const orgLat = org.coordinates[1];

        const dist = getDistance(userLat, userLon, orgLat, orgLon);
        console.log(`\nDistance Calculation:`);
        console.log(`User: ${userLat}, ${userLon}`);
        console.log(`Org: ${orgLat}, ${orgLon}`);
        console.log(`Calculated Distance: ${dist.toFixed(2)}m`);
        
        const reverseDist = getDistance(userLat, userLon, orgLon, orgLat); // Swapped lat/lon to check
        console.log(`Calculated Distance (if coordinates swapped): ${reverseDist.toFixed(2)}m`);
    }

    await mongoose.disconnect();
}

checkOrg();
