import { createFileRoute } from '@tanstack/react-router';
import { getDb } from '@/db/client';
import { profiles, roles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const Route = createFileRoute('/api/employees')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { loadEmployees } = await import('@/lib/db');
          let employees = await loadEmployees();

          if (employees.length === 0) {
            try {
              const { createClerkClient } = await import('@clerk/backend');
              const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
              const clerkUsers = await clerk.users.getUserList({ limit: 100 });

              if (clerkUsers.data.length > 0) {
                const db = getDb();
                let ownerRole = await db.select().from(roles).where(eq(roles.name, 'owner')).limit(1).then(r => r[0] ?? null);
                if (!ownerRole) {
                  await db.insert(roles).values({ name: 'owner', tabs: ['revenue', 'bookings', 'contacts', 'inventory', 'hotels', 'rooms', 'halls', 'packages', 'arrangements', 'rentals', 'receipts', 'faqs', 'legal', 'content', 'branding', 'employees'] }).onConflictDoNothing();
                  ownerRole = await db.select().from(roles).where(eq(roles.name, 'owner')).limit(1).then(r => r[0] ?? null);
                }

                const firstId = clerkUsers.data[0].id;
                for (const u of clerkUsers.data) {
                  const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || u.emailAddresses?.[0]?.emailAddress || 'Unknown';
                  const email = u.emailAddresses?.[0]?.emailAddress || '';
                  if (email) {
                    const roleId = u.id === firstId && ownerRole ? ownerRole.id : null;
                    await db.insert(profiles).values({ id: u.id, name, email, roleId }).onConflictDoNothing();
                  }
                }
                employees = await loadEmployees();
              }
            } catch (syncErr) {
              console.error('Failed to sync Clerk users to profiles:', syncErr);
            }
          }

          return Response.json(employees);
        } catch (error) {
          console.error('Failed to load employees:', error);
          return Response.json({ error: 'Failed to load employees' }, { status: 500 });
        }
      }
    }
  }
});
