import axios from "axios";

const FACE_API_URI = process.env.IMAGE_CLASSIFICATION_URI;

/**
 * Detect a face from an image buffer.
 * Returns the face-api response: { success, person, confidence, ... }
 */
const recognize = async (imageBuffer, deviceId, locationId = "main-entrance") => {
    const image_base64 = imageBuffer.toString("base64");

    const response = await axios.post(
        `${FACE_API_URI}/api/v1/detect`,
        {
            image_base64,
            device_id: deviceId,
            location_id: locationId
        },
        { timeout: 30000 }
    );

    return response.data;
};

export default recognize;
