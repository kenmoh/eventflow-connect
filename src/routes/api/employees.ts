import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/employees')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { internal_loadEmployees } = await import('@/lib/db');
          const employees = await internal_loadEmployees();
          return Response.json(employees);
        } catch (error: any) {
          console.error('[API /api/employees] Fatal Error:', error);
          return Response.json({ 
            error: 'Failed to load employees',
            message: error instanceof Error ? error.message : String(error),
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          }, { status: 500 });
        }
      }
    }
  }
});
