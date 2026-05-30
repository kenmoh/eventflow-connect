import { createFileRoute } from '@tanstack/react-router';

function parseCloudinaryUrl(url: string) {
  const match = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!match) throw new Error('Invalid CLOUDINARY_URL');
  return { apiKey: match[1], apiSecret: match[2], cloudName: match[3] };
}

async function sha1(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-1', encoder.encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

export const Route = createFileRoute('/api/upload')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const cloudinaryUrl = process.env.CLOUDINARY_URL;
          if (!cloudinaryUrl) {
            return Response.json({ error: 'Cloudinary not configured' }, { status: 500 });
          }

          const { apiKey, apiSecret, cloudName } = parseCloudinaryUrl(cloudinaryUrl);

          const formData = await request.formData();
          const file = formData.get('file') as File | null;
          if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
          }

          if (!ALLOWED_TYPES.includes(file.type)) {
            return Response.json({ error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` }, { status: 400 });
          }
          if (file.size > MAX_SIZE) {
            return Response.json({ error: 'File too large (max 5MB)' }, { status: 400 });
          }

          const folder = 'abconsult';
          const timestamp = Math.floor(Date.now() / 1000);
          const signature = await sha1(`folder=${folder}&timestamp=${timestamp}${apiSecret}`);

          const uploadBody = new FormData();
          uploadBody.append('file', file);
          uploadBody.append('folder', folder);
          uploadBody.append('timestamp', String(timestamp));
          uploadBody.append('api_key', apiKey);
          uploadBody.append('signature', signature);

          const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: uploadBody }
          );

          const data = await uploadRes.json();
          if (!uploadRes.ok) {
            return Response.json({ error: data?.error?.message ?? 'Upload failed' }, { status: uploadRes.status });
          }

          return Response.json({ url: data.secure_url });
        } catch (error) {
          console.error('[cloudinary upload]', error);
          return Response.json({ error: 'Upload failed' }, { status: 500 });
        }
      }
    }
  }
});
