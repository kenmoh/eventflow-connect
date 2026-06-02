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
          console.error('Failed to load employees:', error);
          return Response.json({ 
            error: 'Failed to load employees',
            details: error instanceof Error ? error.message : String(error)
          }, { status: 500 });
        }
      }
    }
  }
});
