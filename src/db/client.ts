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
    console.error('[DB Client] DATABASE_URL is not set in process.env');
    throw new Error('DATABASE_URL is not set. Please check your environment variables.');
  }

  // Basic check for valid protocol
  if (!url.startsWith('postgres') && !url.startsWith('postgresql')) {
    console.error('[DB Client] DATABASE_URL does not start with postgres/postgresql');
  }

  try {
    console.log('[DB Client] Initializing Neon client...');
    const sql = neon(url);
    db = drizzle(sql, { schema });
    console.log('[DB Client] Drizzle initialized successfully');
    return db;
  } catch (error) {
    console.error('[DB Client] Failed to initialize Drizzle:', error);
    throw error;
  }
}
