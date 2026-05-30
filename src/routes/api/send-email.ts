import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/send-email')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { emailApiSchema } = await import('@/lib/validation');
        const { auth: clerkAuth } = await import('@clerk/tanstack-react-start/server');

        const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
        const RATE_LIMIT_WINDOW_MS = 60 * 1000;
        const RATE_LIMIT_MAX = 10;

        function checkRateLimit(key: string): boolean {
          const now = Date.now();
          const entry = rateLimitMap.get(key);
          if (!entry || now > entry.resetAt) {
            rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
            return true;
          }
          if (entry.count >= RATE_LIMIT_MAX) return false;
          entry.count++;
          return true;
        }

        function sanitizeHtml(html: string): string {
          return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
            .replace(/\bon\w+\s*=\s*\S+/gi, '');
        }

        try {
          const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
          if (!checkRateLimit(`email:${clientIp}`)) {
            return Response.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
          }

          const session = await clerkAuth();
          if (!session?.userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
          }

          let body: unknown;
          try {
            body = await request.json();
          } catch {
            return Response.json({ error: 'Invalid JSON' }, { status: 400 });
          }

          const validation = emailApiSchema.safeParse(body);
          if (!validation.success) {
            return Response.json({ error: 'Invalid request', details: validation.error.flatten() }, { status: 400 });
          }

          const { to, subject, html, attachments } = validation.data;

          const apiKey = import.meta.env.VITE_RESEND_API_KEY;
          if (!apiKey) {
            return Response.json({ error: 'Email service not configured' }, { status: 500 });
          }

          const sanitizedHtml = sanitizeHtml(html);

          const formData = new FormData();
          formData.append('from', 'AB Consult <onboarding@resend.dev>');
          formData.append('to', to);
          formData.append('subject', subject);
          formData.append('html', sanitizedHtml);

          if (attachments && attachments.length > 0) {
            if (attachments.length > 5) {
              return Response.json({ error: 'Maximum 5 attachments allowed' }, { status: 400 });
            }

            attachments.forEach((att) => {
              const ext = att.filename.split('.').pop()?.toLowerCase();
              const allowedExts = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'];
              if (!ext || !allowedExts.includes(ext)) {
                throw new Error(`Invalid file type: ${ext}`);
              }

              if (att.content.length > 5000000) {
                throw new Error('Attachment too large (max 5MB)');
              }

              try {
                const byteCharacters = atob(att.content);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: `application/${ext}` });
                formData.append('attachments', new File([blob], att.filename, { type: `application/${ext}` }));
              } catch {
                throw new Error('Invalid attachment content');
              }
            });
          }

          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
            body: formData,
          });

          const result = await response.json();

          if (!response.ok) {
            console.error('Resend API error:', result);
            return Response.json({ error: 'Failed to send email' }, { status: response.status });
          }

          return Response.json({ success: true, id: result.id });
        } catch (error) {
          console.error('Email API error:', error);
          return Response.json({ error: 'Failed to send email' }, { status: 500 });
        }
      }
    }
  }
});
