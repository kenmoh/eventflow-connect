import { uploadToCloudinary } from '@/lib/cloudinary';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export async function uploadImage(file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`File too large. Maximum size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
  }
  return uploadToCloudinary(file);
}
