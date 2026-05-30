import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/catalog')({
  server: {
    handlers: {
      GET: async () => {
       
        try {
          const { loadCatalog } = await import('@/lib/db');
      
          const data = await loadCatalog();
      
          return Response.json(data);
        } catch (error) {
          console.error('[API /api/catalog] Error:', error);
          return Response.json({ error: 'Failed to load catalog' }, { status: 500 });
        }
      }
    }
  }
});
