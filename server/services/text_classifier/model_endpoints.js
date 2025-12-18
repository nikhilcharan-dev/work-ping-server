import axios from 'axios';

const TEXT_CLASSIFICATION_URI = process.env.TEXT_CLASSIFICATION_URI;

const evaluateText = async (text) => {
    if(!text) {
        throw new Error('text is required');
    }
    if(!TEXT_CLASSIFICATION_URI) {
        throw new Error('TEXT_CLASSIFICATION_URI is undefined');
    }
    text.replaceAll('\n', '');
    text.replaceAll('  ', ' ');
    const response = await axios.post(TEXT_CLASSIFICATION_URI, text);
    return response.data;
}

export default evaluateText;