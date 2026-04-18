import { validate3DLocation } from '../utils/location.js';

const indiaBoxPins = [
    { lat: 34.190903, lng: 60.896648 }, // Top Left
    { lat: 35.746512, lng: 94.570693 }, // Top Right
    { lat: 1.792676, lng: 98.716917 },  // Bottom Right
    { lat: 1.476401, lng: 64.062996 }   // Bottom Left
];

const mockAllowed = {
    areaPins: indiaBoxPins,
    coordinates: [34.190903, 60.896648], // Primary pin
    IPWhitelist: ["0.0.0.0"] // Universal access
};

const insideUser = {
    gps: { latitude: 17.1785037, longitude: 81.6920266 }, // Rajahmundry, India
    publicIp: "1.1.1.1"
};

const outsideUser = {
    gps: { latitude: 10.0, longitude: 110.0 }, // South China Sea
    publicIp: "1.1.1.1"
};

console.log("--- Testing Polygon Geofencing ---");

const result1 = validate3DLocation(insideUser, mockAllowed);
console.log(`Test 1 (India User): ${result1.allowed ? "✅ PASS" : "❌ FAIL"} - ${result1.message}`);

const result2 = validate3DLocation(outsideUser, mockAllowed);
console.log(`Test 2 (Outside User): ${result2.allowed ? "❌ FAIL" : "✅ PASS"} - ${result2.message}`);
