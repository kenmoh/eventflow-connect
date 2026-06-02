import { createFileRoute } from '@tanstack/react-router';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/db/client';
import { profiles } from '@/db/schema';
import { hashPassword } from '@/lib/auth';

export const Route = createFileRoute('/api/create-employee')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { name, email, password, roleId } = await request.json();

        if (!name || !email) {
          return Response.json({ error: 'Name and email are required' }, { status: 400 });
        }

        try {
          const db = getDb();
          const id = uuidv4();
          const passwordHash = password ? await hashPassword(password) : null;

          await db.insert(profiles).values({
            id,
            name,
            email,
            passwordHash,
            roleId: roleId || null,
          });

          return Response.json({ success: true, id });
        } catch (e: any) {
          console.error('Create employee error:', e);
          return Response.json({ error: e?.message || 'Create failed' }, { status: 500 });
        }
      },
    },
  },
});
