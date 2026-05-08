import { Link, NavLink, Outlet, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useStoreBase, useCurrentEmployee, useAllowedTabs } from '@/lib/store';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ConfirmProvider';
import type { AdminTab } from '@/lib/types';

import AdminBranding from './admin/Branding';
import AdminContent from './admin/Content';
import AdminHotels from './admin/Hotels';
import AdminRooms from './admin/Rooms';
import AdminHalls from './admin/Halls';
import AdminPackages from './admin/Packages';
import AdminArrangements from './admin/Arrangements';
import AdminRentals from './admin/Rentals';
import AdminInventory from './admin/Inventory';
import AdminBookings from './admin/Bookings';
import AdminRevenue from './admin/Revenue';
import AdminFaqs from './admin/Faqs';
import AdminLegal from './admin/Legal';
import AdminEmployees from './admin/Employees';

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

function Login() {
  const branding = useStoreBase(s => s.branding);
  const login = useStoreBase(s => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(email, password)) setErr('Invalid email or password.');
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md bg-card border border-border p-10">
        <Link to="/" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground inline-flex items-center gap-1 mb-6">
          <ArrowLeft className="w-3 h-3" /> Back to site
        </Link>
        <div className="font-display text-3xl">{branding.brandName}</div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold mt-1 mb-8">Studio · CMS</div>
        <label className="block mb-4">
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">Email</span>
          <input className="field" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="block mb-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">Password</span>
          <input type="password" className="field" value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        {err && <p className="text-destructive text-xs mt-2">{err}</p>}
        <button className="mt-6 w-full bg-gold text-gold-foreground py-3 text-xs uppercase tracking-[0.3em] hover:opacity-90">Sign in</button>
        <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground text-center">
          Demo: owner@allbrothersconsult.ng / admin123
        </p>
      </form>
    </div>
  );
}

function Shell() {
  const branding = useStoreBase(s => s.branding);
  const reset = useStoreBase(s => s.reset);
  const logout = useStoreBase(s => s.logout);
  const emp = useCurrentEmployee();
  const allowed = useAllowedTabs();
  const role = useStoreBase(s => s.roles.find(r => r.id === emp?.roleId));
  const { confirm } = useConfirm();

  const onReset = async () => {
    if (await confirm({ title: 'Reset all CMS data?', description: 'This restores demo seed data and signs you out.', destructive: true, confirmText: 'Reset' })) {
      reset(); toast.success('Reset to defaults.');
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 bg-ink text-ink-foreground flex flex-col border-r border-border">
        <Link to="/" className="px-6 py-6 flex items-center gap-2 opacity-80 hover:opacity-100 text-xs uppercase tracking-[0.3em] border-b border-bone/10">
          <ArrowLeft className="w-4 h-4" /> Back to site
        </Link>
        <div className="px-6 py-6 border-b border-bone/10">
          <div className="font-display text-2xl">{branding.brandName}</div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold mt-1">Studio · CMS</div>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.filter(([t]) => allowed.includes(t)).map(([to, label]) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `block px-6 py-3 text-sm transition ${isActive ? 'bg-bone/5 text-gold border-l-2 border-gold' : 'opacity-70 hover:opacity-100 hover:bg-bone/5 border-l-2 border-transparent'}`
              }>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-6 border-t border-bone/10 text-xs">
          <div className="opacity-90">{emp?.name}</div>
          <div className="opacity-50 text-[10px] uppercase tracking-[0.3em]">{role?.name}</div>
          <button onClick={() => logout()} className="mt-4 inline-flex items-center gap-2 opacity-60 hover:opacity-100">
            <LogOut className="w-3 h-3" /> Sign out
          </button>
          <button onClick={onReset} className="mt-3 block text-[10px] uppercase tracking-[0.3em] opacity-40 hover:text-destructive">
            Reset to defaults
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}

function Guarded({ tab, children }: { tab: AdminTab; children: React.ReactNode }) {
  const allowed = useAllowedTabs();
  if (!allowed.includes(tab)) {
    return <div className="p-10"><h1 className="font-display text-3xl">No access</h1><p className="text-muted-foreground mt-2">Your role doesn't include this tab.</p></div>;
  }
  return <>{children}</>;
}

function FirstAllowed() {
  const allowed = useAllowedTabs();
  return <Navigate to={allowed[0] ?? 'branding'} replace />;
}

export default function Admin() {
  const emp = useCurrentEmployee();
  const loc = useLocation();
  if (!emp) return <Login />;
  void loc;
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<FirstAllowed />} />
        <Route path="branding" element={<Guarded tab="branding"><AdminBranding /></Guarded>} />
        <Route path="content" element={<Guarded tab="content"><AdminContent /></Guarded>} />
        <Route path="hotels" element={<Guarded tab="hotels"><AdminHotels /></Guarded>} />
        <Route path="rooms" element={<Guarded tab="rooms"><AdminRooms /></Guarded>} />
        <Route path="halls" element={<Guarded tab="halls"><AdminHalls /></Guarded>} />
        <Route path="packages" element={<Guarded tab="packages"><AdminPackages /></Guarded>} />
        <Route path="arrangements" element={<Guarded tab="arrangements"><AdminArrangements /></Guarded>} />
        <Route path="rentals" element={<Guarded tab="rentals"><AdminRentals /></Guarded>} />
        <Route path="inventory" element={<Guarded tab="inventory"><AdminInventory /></Guarded>} />
        <Route path="bookings" element={<Guarded tab="bookings"><AdminBookings /></Guarded>} />
        <Route path="revenue" element={<Guarded tab="revenue"><AdminRevenue /></Guarded>} />
        <Route path="faqs" element={<Guarded tab="faqs"><AdminFaqs /></Guarded>} />
        <Route path="legal" element={<Guarded tab="legal"><AdminLegal /></Guarded>} />
        <Route path="employees" element={<Guarded tab="employees"><AdminEmployees /></Guarded>} />
      </Route>
    </Routes>
  );
}
