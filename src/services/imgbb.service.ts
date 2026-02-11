import axios from 'axios';

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'a53137733a0391c5156cec9772c438cc';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

/**
 * Upload an image buffer to ImgBB and return the public URL.
 * @param buffer - The image file buffer (from multer memoryStorage)
 * @param name - Optional image name
 * @returns The public URL of the uploaded image, or null on failure
 */
export async function uploadToImgBB(
    buffer: Buffer,
    name?: string
): Promise<string | null> {
    try {
        const base64Image = buffer.toString('base64');

        const formData = new URLSearchParams();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', base64Image);
        if (name) {
            formData.append('name', name);
        }

        const response = await axios.post(IMGBB_UPLOAD_URL, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 30000,
        });

        if (response.data?.success && response.data?.data?.url) {
            console.log('✅ Image uploaded to ImgBB:', response.data.data.url);
            return response.data.data.url;
        }

        console.error('❌ ImgBB upload failed:', response.data);
        return null;
    } catch (error: any) {
        console.error('❌ ImgBB upload error:', error.message);
        return null;
    }
}
