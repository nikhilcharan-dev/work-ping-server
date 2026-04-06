import axios from "axios";

const FACE_API_URI = process.env.IMAGE_CLASSIFICATION_URI;

/**
 * Recognise a face against all enrolled embeddings for the given organisation.
 * The face-api owns MongoDB + Redis caching internally — no DB work here.
 *
 * @param {Buffer} imageBuffer
 * @param {string} deviceId
 * @param {string} locationId
 * @param {string|ObjectId} organizationId
 * @returns {object} { success, person, confidence, ... }
 */
const recognize = async (imageBuffer, deviceId, locationId = "main-entrance", organizationId) => {
    const image_base64 = imageBuffer.toString("base64");

    const { data } = await axios.post(
        `${FACE_API_URI}/api/v1/detect`,
        {
            image_base64,
            device_id: deviceId,
            location_id: locationId,
            organization_id: organizationId.toString(),
        },
        { timeout: 30000 }
    );

    return data;
};

export default recognize;
