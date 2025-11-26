import axios from 'axios';

const IMGBB_API_KEY = '9a4f4dc77cd4fa37bcd528055c7932e9';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

/**
 * Upload an image to Imgbb
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} - The URL of the uploaded image
 */
export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', IMGBB_API_KEY);

    try {
        const response = await axios.post(IMGBB_API_URL, formData);
        if (response.data && response.data.success) {
            return response.data.data.url;
        } else {
            throw new Error('Failed to upload image');
        }
    } catch (error) {
        console.error('Imgbb upload error:', error);
        throw error;
    }
};
