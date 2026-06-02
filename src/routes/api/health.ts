import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        const status = {
          env: {
            DATABASE_URL: !!process.env.DATABASE_URL,
            CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
            VITE_CLERK_PUBLISHABLE_KEY: !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
          },
          timestamp: new Date().toISOString(),
        };

        return Response.json(status);
      }
    }
  }
});
