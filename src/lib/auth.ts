import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { getDb } from '@/db/client';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCookie, setCookie, deleteCookie } from '@tanstack/start-server-core';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret-at-least-32-chars-long');

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET);

  setCookie('abc_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function getSession() {
  const token = getCookie('abc_session');
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string };
  } catch (e) {
    return null;
  }
}

export async function destroySession() {
  deleteCookie('abc_session');
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const db = getDb();
  const user = await db.query.profiles.findFirst({
    where: eq(profiles.id, session.userId),
  });

  return user || null;
}
