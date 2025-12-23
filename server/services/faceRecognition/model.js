import axios from "axios";
import FormData from "form-data";
import https from "https";
import 'dotenv/config';

// Remove after hosting flask
const agent = new https.Agent({
    rejectUnauthorized: false // allow self-signed
});

const FLASK_API = process.env.FLASK_API;

const recognize = async (req) => {
    const formData = new FormData();
    formData.append("image", req.file.buffer, {
        filename: "frame.jpg",
        contentType: req.file.mimetype
    });

    const response = await axios.post(
        `${FLASK_API}/recognize`, // 👈 Flask detect API
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