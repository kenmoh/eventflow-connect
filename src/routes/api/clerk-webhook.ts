import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/clerk-webhook')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { Webhook } = await import('svix');
        const { getDb } = await import('@/db/client');
        const { profiles, roles } = await import('@/db/schema');
        const { eq } = await import('drizzle-orm');
        const { asc } = await import('drizzle-orm');
        const { checkRateLimit, getClientIp } = await import('@/lib/security');

        try {
          const clientIp = getClientIp(request);
          if (!checkRateLimit(`clerk-webhook:${clientIp}`, 'webhook')) {
            return Response.json({ error: 'Too many requests' }, { status: 429 });
          }

          const rawBody = await request.text();
          const svixId = request.headers.get('svix-id');
          const svixTimestamp = request.headers.get('svix-timestamp');
          const svixSignature = request.headers.get('svix-signature');

          if (!svixId || !svixTimestamp || !svixSignature) {
            return Response.json({ error: 'Missing Svix headers' }, { status: 400 });
          }

          const secret = process.env.CLERK_WEBHOOK_SECRET;
          if (!secret) {
            console.error('CLERK_WEBHOOK_SECRET not configured');
            return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
          }

          const wh = new Webhook(secret);
          let payload: { type: string; data: any };
          try {
            payload = wh.verify(rawBody, {
              'svix-id': svixId,
              'svix-timestamp': svixTimestamp,
              'svix-signature': svixSignature,
            }) as any;
          } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return Response.json({ error: 'Invalid signature' }, { status: 401 });
          }

          const { type, data } = payload;

          switch (type) {
            case 'user.created': {
              const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || data.username || data.email_addresses?.[0]?.email_address || 'Unknown';
              const email = data.email_addresses?.[0]?.email_address || '';
              if (!email) {
                console.warn('Skipping user.created — no email address');
                break;
              }
              await getDb().insert(profiles).values({ id: data.id, name, email }).onConflictDoNothing();

              const existingProfiles = await getDb().select().from(profiles).where(eq(profiles.id, data.id)).limit(1);
              if (!existingProfiles.length) break;

              const allProfiles = await getDb().select().from(profiles).orderBy(asc(profiles.createdAt)).limit(2);
              const isFirstUser = allProfiles.length === 1;

              if (isFirstUser) {
                const ownerRole = await getDb().select().from(roles).where(eq(roles.name, 'owner')).limit(1);
                if (ownerRole.length) {
                  await getDb().update(profiles).set({ roleId: ownerRole[0].id }).where(eq(profiles.id, data.id));
                }
              }

              try {
                const emailId = data.email_addresses?.[0]?.id;
                if (emailId) {
                  await fetch(`https://api.clerk.com/v1/email_addresses/${emailId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}` },
                    body: JSON.stringify({ verified: true }),
                  });
                }
              } catch (err) {
                console.warn('Could not auto-verify email:', err);
              }
              break;
            }

            case 'user.updated': {
              const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || data.username || data.email_addresses?.[0]?.email_address || 'Unknown';
              const email = data.email_addresses?.[0]?.email_address || '';
              await getDb().update(profiles).set({ name, email }).where(eq(profiles.id, data.id));
              break;
            }

            case 'user.deleted': {
              await getDb().delete(profiles).where(eq(profiles.id, data.id));
              break;
            }

            default:
              console.log(`Unhandled Clerk webhook event: ${type}`);
          }

          return Response.json({ received: true });
        } catch (error) {
          console.error('Clerk webhook processing error:', error);
          return Response.json({ error: 'Processing failed' }, { status: 500 });
        }
      }
    }
  }
});
