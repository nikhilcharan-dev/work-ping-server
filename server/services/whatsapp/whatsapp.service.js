import waClient from "#utils/whatsappClient.js";

/**
 * Normalise any Indian phone number to the format expected by the WhatsApp
 * microservice: country code + 10 digits, no + sign (e.g. "919876543210").
 */
export const formatWANumber = (phone) => {
    const digits = String(phone).replace(/\D/g, "");
    if (digits.length === 10) return `91${digits}`;
    if (digits.length === 12 && digits.startsWith("91")) return digits;
    if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
    return digits; // pass through unchanged if unrecognised
};

/**
 * Send a WhatsApp message via the WhatsApp microservice.
 * @param {string} to   - Recipient phone (raw — will be normalised)
 * @param {string} text - Message body (supports *bold*, _italic_ WhatsApp formatting)
 */
export const sendWhatsApp = async (to, text) => {
    const res = await waClient.post("/api/secure/whatsapp/send", { to: formatWANumber(to), text });
    return res.data; // { sent: true, to }
};
