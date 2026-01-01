import axios from "axios";
import FormData from "form-data";
import https from "https";
import 'dotenv/config';

// Remove after hosting flask
const agent = new https.Agent({
    rejectUnauthorized: false // allow self-signed
});

const IMAGE_IDENTIFICATION_URI = process.env.IMAGE_CLASSIFICATION_URI;

const recognize = async (req) => {
    const formData = new FormData();
    formData.append("image", req.file.buffer, {
        filename: "frame.jpg",
        contentType: req.file.mimetype
    });

    const response = await axios.post(
        `${IMAGE_IDENTIFICATION_URI}/recognize`, // 👈 Flask detect API
        formData,
        {
            headers: formData.getHeaders(),
            timeout: 100000
        },
        { httpsAgent: agent }
    );
    console.log(response.data);
    return response.data;
}

export default recognize;