/**
 * Media Upload Service
 * Uploads images to the dedicated media server instead of ImgBB.
 * The media server uses Railway Persistent Volume for permanent storage.
 */

import FormData from 'form-data';

const MEDIA_SERVER_URL = process.env.MEDIA_SERVER_URL || 'http://localhost:4000';
const MEDIA_API_KEY = process.env.MEDIA_API_KEY || 'media-server-secret-key';

/**
 * Upload an image buffer to the media server.
 * @param buffer - Image file buffer
 * @param name - Filename hint (used to determine folder)
 * @returns Full public URL of the uploaded image, or null on failure
 */
export async function uploadToImgBB(buffer: Buffer, name: string): Promise<string | null> {
  try {
    // Determine folder based on name prefix
    let folder = 'general';
    if (name.startsWith('avatar')) folder = 'avatars';
    else if (name.startsWith('news')) folder = 'news';
    else if (name.startsWith('store')) folder = 'store';
    else if (name.startsWith('slider')) folder = 'sliders';

    const formData = new FormData();
    formData.append('image', buffer, { filename: `${name}.jpg`, contentType: 'image/jpeg' });
    formData.append('folder', folder);

    const response = await new Promise<any>((resolve, reject) => {
      const http = MEDIA_SERVER_URL.startsWith('https') ? require('https') : require('http');
      const url = new URL(`${MEDIA_SERVER_URL}/upload`);

      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: 'POST',
          headers: {
            ...formData.getHeaders(),
            'x-api-key': MEDIA_API_KEY,
          },
        },
        (res: any) => {
          let data = '';
          res.on('data', (chunk: string) => (data += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              reject(new Error(`Invalid response: ${data}`));
            }
          });
        }
      );

      req.on('error', reject);
      formData.pipe(req);
    });

    if (response.success && response.data?.imageUrl) {
      // Return full URL: MEDIA_SERVER_URL + imageUrl path
      return `${MEDIA_SERVER_URL}${response.data.imageUrl}`;
    }

    console.error('Media server upload failed:', response);
    return null;
  } catch (error) {
    console.error('Upload to media server error:', error);
    return null;
  }
}
