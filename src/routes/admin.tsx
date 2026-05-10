import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { useStoreBase, useCurrentEmployee, useAllowedTabs, logout } from '@/lib/store'
import { supabase } from '@/integrations/supabase/client'
import { ArrowLeft, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { AdminTab } from '@/lib/types'

const NAV: [AdminTab, string][] = [
  ['revenue', 'Revenue'],
  ['bookings', 'Bookings'],
  ['inventory', 'Inventory'],
  ['hotels', 'Hotels'],
  ['rooms', 'Rooms'],
  ['halls', 'Halls'],
  ['packages', 'Packages'],
  ['arrangements', 'Seat layouts'],
  ['rentals', 'Rentals'],
  ['faqs', 'FAQs'],
  ['legal', 'Legal & About'],
  ['content', 'Site content'],
  ['branding', 'Branding'],
  ['employees', 'Employees'],
];

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  const sessionLoaded = useStoreBase(s => s.session.loaded);
  const userId = useStoreBase(s => s.session.userId);
  const profile = useStoreBase(s => s.session.profile);

  if (!sessionLoaded) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-xs uppercase tracking-[0.3em]">Loading…</div>;
  }
  if (!userId) return <AuthScreen />;
  if (!profile?.roleId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-4xl">No role assigned</h1>
          <p className="mt-3 text-muted-foreground">Your account exists, but the owner hasn't given it a role yet.</p>
          <button onClick={() => logout()} className="mt-6 underline text-sm">Sign out</button>
        </div>
      </div>
    );
  }

  return <Shell />
}

function AuthScreen() {
  const branding = useStoreBase(s => s.branding);
  const hydrate = useStoreBase(s => s.hydrate);
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [ownerExists, setOwnerExists] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    supabase.rpc('owner_exists').then(({ data }) => {
      const exists = !!data;
      setOwnerExists(exists);
      if (!exists) setMode('sign-up');
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (mode === 'sign-up') {
        if (ownerExists) { setErr('Sign-ups are by invitation. Ask the owner to add you.'); return; }
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name }, emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) { setErr(error.message); return; }
        if (data.session) {
          const { error: bErr } = await supabase.rpc('bootstrap_owner');
          if (bErr) { setErr(bErr.message); return; }
          await hydrate();
          toast.success('Owner account created.');
        } else {
          toast.success('Check your email to confirm.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setErr(error.message); return; }
        await hydrate();
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md bg-card border border-border p-10">
        <Link to="/" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground inline-flex items-center gap-1 mb-6">
          <ArrowLeft className="w-3 h-3" /> Back to site
        </Link>
        <div className="font-display text-3xl">{branding.brandName}</div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold mt-1 mb-8">
          Studio · {ownerExists === false ? 'Create owner' : mode === 'sign-up' ? 'Sign up' : 'Sign in'}
        </div>

        {mode === 'sign-up' && (
          <label className="block mb-4">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">Name</span>
            <input className="field" value={name} onChange={e => setName(e.target.value)} required />
          </label>
        )}
        <label className="block mb-4">
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">Email</span>
          <input type="email" className="field" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label className="block mb-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">Password</span>
          <input type="password" className="field" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
        </label>
        {err && <p className="text-destructive text-xs mt-2">{err}</p>}
        <button disabled={busy} className="mt-6 w-full bg-gold text-gold-foreground py-3 text-xs uppercase tracking-[0.3em] hover:opacity-90 disabled:opacity-60">
          {busy ? 'Working…' : (mode === 'sign-up' ? (ownerExists === false ? 'Create owner account' : 'Request access') : 'Sign in')}
        </button>

        {busy && (
          <p className="mt-4 text-center text-sm text-muted-foreground">Signing in and loading your workspace…</p>
        )}

        {ownerExists !== false && (
          <button type="button" onClick={() => setMode(m => m === 'sign-in' ? 'sign-up' : 'sign-in')}
            className="mt-6 block w-full text-[10px] uppercase tracking-[0.3em] text-muted-foreground text-center hover:text-foreground">
            {mode === 'sign-in' ? 'No account? Sign up' : 'Have an account? Sign in'}
          </button>
        )}
        {ownerExists === false && (
          <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground text-center">
            First setup — this account becomes the Owner.
          </p>
        )}
      </form>
    </div>
  );
}

function Shell() {
  const branding = useStoreBase(s => s.branding);
  const emp = useCurrentEmployee();
  const allowed = useAllowedTabs();
  const role = useStoreBase(s => s.roles.find(r => r.id === emp?.roleId));

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 bg-ink text-ink-foreground flex flex-col border-r border-border">
        <Link to="/" className="px-6 py-6 flex items-center gap-2 opacity-80 hover:opacity-100 text-xs uppercase tracking-[0.3em] border-b border-bone/10">
          <ArrowLeft className="w-4 h-4" /> Back to site
        </Link>
        <div className="px-6 py-6 border-b border-bone/10">
          <div className="font-display text-2xl">{branding.brandName}</div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-gold mt-1">Studio · CMS</div>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.filter(([t]) => allowed.includes(t)).map(([to, label]) => (
            <Link key={to} to={`/admin/${to}`}
              activeProps={{ className: 'bg-bone/5 text-gold border-l-2 border-gold opacity-100' }}
              inactiveProps={{ className: 'opacity-70 hover:opacity-100 hover:bg-bone/5 border-l-2 border-transparent' }}
              className="block px-6 py-3 text-sm transition"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-bone/10 text-xs">
          <div className="opacity-90">{emp?.name}</div>
          <div className="opacity-50 text-[10px] uppercase tracking-[0.3em]">{role?.name ?? 'No role'}</div>
          <button onClick={() => logout()} className="mt-4 inline-flex items-center gap-2 opacity-60 hover:opacity-100">
            <LogOut className="w-3 h-3" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
