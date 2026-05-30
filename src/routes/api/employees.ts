import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/employees')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { loadEmployees } = await import('@/lib/db');
          const employees = await loadEmployees();
          return Response.json(employees);
        } catch (error) {
          console.error('Failed to load employees:', error);
          return Response.json({ error: 'Failed to load employees' }, { status: 500 });
        }
      }
    }
  }
});
