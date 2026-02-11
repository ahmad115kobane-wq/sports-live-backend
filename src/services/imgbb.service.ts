/**
 * Media Upload Service
 * Uploads images/videos to Cloudflare R2 for permanent storage.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'iqdd';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload an image buffer to Cloudflare R2.
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

    const uniqueId = crypto.randomBytes(16).toString('hex');
    const ext = name.includes('.') ? name.split('.').pop() : 'jpg';
    const key = `${folder}/${uniqueId}.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: `image/${ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : ext === 'gif' ? 'gif' : 'jpeg'}`,
    }));

    const publicUrl = `${R2_PUBLIC_URL}/${key}`;
    console.log(`✅ Uploaded to R2: ${publicUrl} (${(buffer.length / 1024).toFixed(2)} KB)`);
    return publicUrl;
  } catch (error) {
    console.error('Upload to R2 error:', error);
    return null;
  }
}

/**
 * Delete an image from Cloudflare R2.
 * @param imageUrl - Full public URL of the image
 */
export async function deleteFromR2(imageUrl: string): Promise<boolean> {
  try {
    if (!imageUrl || !imageUrl.includes(R2_PUBLIC_URL)) return false;
    const key = imageUrl.replace(`${R2_PUBLIC_URL}/`, '');
    await s3.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }));
    console.log(`🗑️ Deleted from R2: ${key}`);
    return true;
  } catch (error) {
    console.error('Delete from R2 error:', error);
    return false;
  }
}
