import { createFileRoute } from '@tanstack/react-router';
import { getDb } from '@/db/client';
import { sql } from 'drizzle-orm';

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        let dbStatus = 'unknown';
        let dbError = null;

        try {
          const db = getDb();
          await db.execute(sql`SELECT 1`);
          dbStatus = 'connected';
        } catch (err: any) {
          dbStatus = 'error';
          dbError = err.message;
        }

        const status = {
          status: dbStatus === 'connected' ? 'ok' : 'degraded',
          database: {
            status: dbStatus,
            error: dbError,
            urlSet: !!process.env.DATABASE_URL,
          },
          env: {
            NODE_ENV: process.env.NODE_ENV,
            AUTH_SECRET: !!process.env.AUTH_SECRET,
          },
          timestamp: new Date().toISOString(),
        };

        return Response.json(status);
      }
    }
  }
});
