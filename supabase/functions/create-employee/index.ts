import { createClient } from 'jsr:@supabase/supabase-js@2';

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://your-domain.com';

const cors = (origin: string) => ({
  'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Vary': 'Origin',
});

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin') || '';
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors(origin) });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401, origin);
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify caller is owner/admin
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: ce } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (ce || !claims?.claims) return json({ error: 'Unauthorized' }, 401, origin);
    const callerId = claims.claims.sub as string;

    const admin = createClient(url, service);
    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', callerId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === 'owner');
    if (!isAdmin) return json({ error: 'Only the owner can create employees' }, 403, origin);

    const body = await req.json();
    const { name, email, password, roleId } = body ?? {};
    if (typeof name !== 'string' || name.trim().length < 2) return json({ error: 'Invalid name' }, 400, origin);
    if (typeof email !== 'string' || !/^.+@.+\..+$/.test(email)) return json({ error: 'Invalid email' }, 400, origin);
    if (typeof password !== 'string' || password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400, origin);

    const { data: created, error: ue } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { name },
    });
    if (ue || !created.user) return json({ error: 'Failed to create user account' }, 400, origin);

    const userId = created.user.id;
    // profile is auto-created by trigger; set role_id and add staff role
    await admin.from('profiles').update({ name, email, role_id: roleId || null }).eq('id', userId);
    await admin.from('user_roles').insert({ user_id: userId, role: 'staff' }).select();

    return json({ id: userId, name, email, roleId: roleId ?? null }, 200, origin);
  } catch (e) {
    console.error('create-employee error:', e);
    return json({ error: 'Internal server error' }, 500, origin);
  }
});

function json(body: unknown, status = 200, origin: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'Content-Type': 'application/json' },
  });
}
