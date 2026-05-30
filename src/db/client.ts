import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (db) return db;

  if (typeof window !== 'undefined') {
    throw new Error('Database client cannot be used in the browser.');
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(url);
  db = drizzle(sql, { schema });
  return db;
}
