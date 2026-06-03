import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/catalog')({
  server: {
    handlers: {
      GET: async () => {
       
        try {
          const { internal_loadCatalog } = await import('@/lib/db-api');
          const data = await internal_loadCatalog();
          return Response.json(data);
        } catch (error: any) {
          console.error('[API /api/catalog] Fatal Error:', error);
          return Response.json({ 
            error: 'Failed to load catalog', 
            message: error instanceof Error ? error.message : String(error),
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          }, { status: 500 });
        }
      }
    }
  }
});
