/**
 * Location Utilities for 3D Locking (IP, GPS, MSL)
 */

/**
 * Calculate distance between two points in meters using Haversine formula
 */
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

/**
 * Validate 3D location against organization settings
 * @param {object} provided - { wifi, gps, altitude, publicIp }
 * @param {object} allowed - { IPWhitelist, coordinates, msl }
 * @returns {object} { allowed: boolean, message: string }
 */
export function validate3DLocation(provided, allowed) {
    // If no validation data is set in the organization, allow by default (as per requirement)
    const hasOrgConfig = (allowed.IPWhitelist && allowed.IPWhitelist.length > 0) || 
                         (allowed.coordinates && allowed.coordinates.length >= 2) ||
                         allowed.msl;
    
    if (!hasOrgConfig) {
        return { allowed: true, message: "No location restrictions set" };
    }

    // 1. IP Whitelist Check
    if (allowed.IPWhitelist && allowed.IPWhitelist.length > 0) {
        const isUniversalAccess = allowed.IPWhitelist.includes("0.0.0.0");
        
        if (!isUniversalAccess) {
            if (!provided.publicIp || !allowed.IPWhitelist.includes(provided.publicIp)) {
                return { 
                    allowed: false, 
                    message: `Unauthorized network (IP: ${provided.publicIp || 'Unknown'}). Please use company WiFi.` 
                };
            }
        }
    }

    // 2. Geo-fencing Check (GPS)
    if ((allowed.coordinates && allowed.coordinates.length >= 2) || (allowed.areaPins && allowed.areaPins.length > 0)) {
        if (!provided.gps || provided.gps.latitude == null || provided.gps.longitude == null) {
            return { allowed: false, message: "GPS coordinates required for verification" };
        }

        let isWithinAnyRange = false;
        let minDistance = Infinity;
        let closestPin = null;

        // Check primary coordinates [lon, lat]
        if (allowed.coordinates && allowed.coordinates.length >= 2) {
            const distance = getDistance(
                provided.gps.latitude, 
                provided.gps.longitude, 
                allowed.coordinates[1],
                allowed.coordinates[0]
            );
            minDistance = Math.min(minDistance, distance);
            if (distance <= 500) {
                isWithinAnyRange = true;
                closestPin = "Primary Coordinates";
            }
        }

        // Check additional area pins {lat, lng}
        if (!isWithinAnyRange && allowed.areaPins && allowed.areaPins.length > 0) {
            for (const [index, pin] of allowed.areaPins.entries()) {
                if (pin.lat == null || pin.lng == null) continue;
                
                const distance = getDistance(
                    provided.gps.latitude, 
                    provided.gps.longitude, 
                    pin.lat, 
                    pin.lng
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                }

                if (distance <= 500) {
                    isWithinAnyRange = true;
                    closestPin = `Area Pin ${index + 1}`;
                    break;
                }
            }
        }

        if (!isWithinAnyRange) {
            return { 
                allowed: false, 
                message: `Outside allowed region (Closest pin: ${Math.round(minDistance)}m away).` 
            };
        }
    }

    // 3. MSL Check (Altitude)
    if (allowed.msl) {
        const targetMsl = parseFloat(allowed.msl);
        const providedMsl = provided.altitude?.value;

        if (providedMsl == null) {
            return { allowed: false, message: "Altitude signal required for verification" };
        }

        // Allow within 50m tolerance
        if (Math.abs(providedMsl - targetMsl) > 50) {
            return { 
                allowed: false, 
                message: "Security altitude mismatch. Possible spoofing detected." 
            };
        }
    }

    return { allowed: true, message: "Location verified" };
}
