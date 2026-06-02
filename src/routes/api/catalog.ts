import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/catalog')({
  server: {
    handlers: {
      GET: async () => {
       
        try {
          const { internal_loadCatalog } = await import('@/lib/db');
          const data = await internal_loadCatalog();
          return Response.json(data);
        } catch (error: any) {
          console.error('[API /api/catalog] Error:', error);
          return Response.json({ 
            error: 'Failed to load catalog', 
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    }
  }
});
