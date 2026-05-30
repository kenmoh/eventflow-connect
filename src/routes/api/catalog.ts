import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/catalog')({
  server: {
    handlers: {
      GET: async () => {
        console.log('[API /api/catalog] GET handler called');
        try {
          const { loadCatalog } = await import('@/lib/db');
          console.log('[API /api/catalog] loadCatalog imported, calling it...');
          const data = await loadCatalog();
          console.log('[API /api/catalog] loadCatalog returned:', {
            hasBranding: !!data.branding,
            hasContent: !!data.content,
            hotelsCount: data.hotels?.length,
            roomsCount: data.rooms?.length,
          });
          return Response.json(data);
        } catch (error) {
          console.error('[API /api/catalog] Error:', error);
          return Response.json({ error: 'Failed to load catalog' }, { status: 500 });
        }
      }
    }
  }
});
