import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify caller is owner/admin
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: ce } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (ce || !claims?.claims) return json({ error: 'Unauthorized' }, 401);
    const callerId = claims.claims.sub as string;

    const admin = createClient(url, service);
    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', callerId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === 'owner' || r.role === 'admin');
    if (!isAdmin) return json({ error: 'Forbidden' }, 403);

    const body = await req.json();
    const { name, email, password, roleId } = body ?? {};
    if (typeof name !== 'string' || name.trim().length < 2) return json({ error: 'Invalid name' }, 400);
    if (typeof email !== 'string' || !/^.+@.+\..+$/.test(email)) return json({ error: 'Invalid email' }, 400);
    if (typeof password !== 'string' || password.length < 6) return json({ error: 'Password too short' }, 400);

    const { data: created, error: ue } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { name },
    });
    if (ue || !created.user) return json({ error: ue?.message ?? 'Create failed' }, 400);

    const userId = created.user.id;
    // profile is auto-created by trigger; set role_id and add staff role
    await admin.from('profiles').update({ name, email, role_id: roleId || null }).eq('id', userId);
    await admin.from('user_roles').insert({ user_id: userId, role: 'staff' }).select();

    return json({ id: userId, name, email, roleId: roleId ?? null });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
