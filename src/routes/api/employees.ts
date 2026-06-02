import { createFileRoute } from '@tanstack/react-router';
import { getDb } from '@/db/client';
import { profiles, roles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const Route = createFileRoute('/api/employees')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { internal_loadEmployees } = await import('@/lib/db');
          let employees = await internal_loadEmployees();

          // Always try to sync if there are Clerk users, but be careful with performance.
          // In a real app, this should be handled by webhooks, but for robustness:
          try {
            const { createClerkClient } = await import('@clerk/backend');
            const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
            const clerkUsers = await clerk.users.getUserList({ limit: 100 });

            if (clerkUsers.data.length > 0) {
              const db = getDb();
              
              // Ensure 'owner' role exists
              let ownerRole = await db.select().from(roles).where(eq(roles.name, 'owner')).limit(1).then(r => r[0] ?? null);
              if (!ownerRole) {
                await db.insert(roles).values({ 
                  name: 'owner', 
                  tabs: ['revenue', 'bookings', 'contacts', 'inventory', 'hotels', 'rooms', 'halls', 'packages', 'arrangements', 'rentals', 'receipts', 'faqs', 'legal', 'content', 'branding', 'employees'] 
                }).onConflictDoNothing();
                ownerRole = await db.select().from(roles).where(eq(roles.name, 'owner')).limit(1).then(r => r[0] ?? null);
              }

              // Check if we need to sync any users
              const existingIds = new Set(employees.map(e => e.id));
              let didSync = false;

              for (const u of clerkUsers.data) {
                if (!existingIds.has(u.id)) {
                  const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || u.emailAddresses?.[0]?.email_address || 'Unknown';
                  const email = u.emailAddresses?.[0]?.email_address || '';
                  if (email) {
                    // First user ever becomes owner if no employees exist yet
                    const roleId = employees.length === 0 && u.id === clerkUsers.data[0].id && ownerRole ? ownerRole.id : null;
                    await db.insert(profiles).values({ id: u.id, name, email, roleId }).onConflictDoNothing();
                    didSync = true;
                  }
                }
              }

              if (didSync) {
                employees = await internal_loadEmployees();
              }
            }
          } catch (syncErr) {
            console.error('Failed to sync Clerk users to profiles:', syncErr);
          }

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
