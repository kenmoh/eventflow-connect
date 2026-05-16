// In-memory rate limiter (resets on server restart — use Redis/DB for production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const defaultConfigs: Record<string, RateLimitConfig> = {
  auth: { windowMs: 5 * 60 * 1000, max: 10 },      // 10 attempts per 5 min
  email: { windowMs: 60 * 1000, max: 10 },           // 10 emails per min
  webhook: { windowMs: 60 * 1000, max: 60 },         // 60 webhooks per min
  general: { windowMs: 60 * 1000, max: 100 },        // 100 requests per min
};

export function checkRateLimit(key: string, configName: string = 'general'): boolean {
  const config = defaultConfigs[configName] ?? defaultConfigs.general;
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + config.windowMs });
    return true;
  }
  
  if (entry.count >= config.max) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip') 
    || 'unknown';
}

/**
 * Validate that a request has a valid Supabase session
 */
export async function requireAuth(request: Request): Promise<{ userId: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) return null;
    return { userId: user.id };
  } catch {
    return null;
  }
}

/**
 * Generate a CSRF token (simple implementation — use a proper library for production)
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate a CSRF token
 */
export function validateCsrfToken(token: string, expected: string): boolean {
  return token === expected && token.length > 0;
}
