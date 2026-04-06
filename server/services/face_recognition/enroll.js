import axios from "axios";

const FACE_API_URI = process.env.IMAGE_CLASSIFICATION_URI;

/**
 * Enroll a face for an employee.
 * Sends the raw image to the face-api which extracts the embedding
 * and persists it in MongoDB.
 *
 * @param {Buffer} imageBuffer
 * @param {object} user  Needs: employeeId, organizationId
 */
export const enrollFace = async (imageBuffer, user) => {
    const image_base64 = imageBuffer.toString("base64");

    const { data } = await axios.post(`${FACE_API_URI}/api/v1/enroll`, {
        image_base64,
        employee_id: user.employeeId,
        organization_id: user.organizationId.toString(),
    });

    if (!data.success) {
        throw new Error("Face API failed to enroll face");
    }

    return data;
};

/**
 * Remove a face embedding by employeeId.
 * Fire-and-forget safe — does not throw.
 */
export const deleteFace = async (employeeId) => {
    try {
        await axios.delete(`${FACE_API_URI}/api/v1/embeddings/${encodeURIComponent(employeeId)}`);
    } catch (err) {
        console.error(`[FaceAPI] Failed to delete face for "${employeeId}":`, err?.response?.data || err.message);
    }
};
