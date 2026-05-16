import { json } from '@tanstack/react-router';
import { emailApiSchema } from '@/lib/validation';
import { supabase } from '@/integrations/supabase/client';

// In-memory rate limiter (resets on server restart — use Redis/DB for production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 emails per minute per IP

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Sanitize HTML to prevent XSS — strip script tags and event handlers
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*\S+/gi, '');
}

export const POST = async ({ request }: { request: Request }) => {
  try {
    // Rate limiting by IP
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`email:${clientIp}`)) {
      return json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    // Authentication check — require valid Supabase session
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return json({ error: 'Invalid session' }, { status: 401 });
    }

    // Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const validation = emailApiSchema.safeParse(body);
    if (!validation.success) {
      return json({ error: 'Invalid request', details: validation.error.flatten() }, { status: 400 });
    }

    const { to, subject, html, attachments } = validation.data;

    const apiKey = import.meta.env.VITE_RESEND_API_KEY;
    if (!apiKey) {
      return json({ error: 'Email service not configured' }, { status: 500 });
    }

    // Sanitize HTML content
    const sanitizedHtml = sanitizeHtml(html);

    const formData = new FormData();
    formData.append('from', 'AB Consult <onboarding@resend.dev>');
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', sanitizedHtml);

    if (attachments && attachments.length > 0) {
      // Validate attachment count and size
      if (attachments.length > 5) {
        return json({ error: 'Maximum 5 attachments allowed' }, { status: 400 });
      }

      attachments.forEach((att) => {
        // Validate filename
        const ext = att.filename.split('.').pop()?.toLowerCase();
        const allowedExts = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'];
        if (!ext || !allowedExts.includes(ext)) {
          throw new Error(`Invalid file type: ${ext}`);
        }

        // Validate content size (max 5MB per attachment)
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
      return json({ error: 'Failed to send email' }, { status: response.status });
    }

    return json({ success: true, id: result.id });
  } catch (error) {
    console.error('Email API error:', error);
    return json({ error: 'Failed to send email' }, { status: 500 });
  }
};
