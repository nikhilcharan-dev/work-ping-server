import axios from "axios";

const FACE_API_URI = process.env.IMAGE_CLASSIFICATION_URI;

/**
 * Enroll a face into the FAISS index.
 * Label should be the employee's employeeId string.
 * Throws on failure.
 */
export const enrollFace = async (imageBuffer, label) => {
    const image_base64 = imageBuffer.toString("base64");
    const response = await axios.post(`${FACE_API_URI}/api/v1/faiss/add`, {
        image_base64,
        label
    });
    return response.data; // { success, label, total }
};

/**
 * Remove a face from the FAISS index by label (employeeId).
 * Fire-and-forget safe — does not throw.
 */
export const deleteFace = async (label) => {
    try {
        await axios.delete(`${FACE_API_URI}/api/v1/faiss/delete/${encodeURIComponent(label)}`);
    } catch (err) {
        console.error(`[FaceAPI] Failed to delete face for label "${label}":`, err?.response?.data || err.message);
    }
};
