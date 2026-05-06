import { Link, NavLink, Outlet, Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { ArrowLeft } from 'lucide-react';
import AdminBranding from './admin/Branding';
import AdminHotels from './admin/Hotels';
import AdminRooms from './admin/Rooms';
import AdminHalls from './admin/Halls';
import AdminPackages from './admin/Packages';
import AdminRentals from './admin/Rentals';
import AdminBookings from './admin/Bookings';

const NAV = [
  ['Branding', 'branding'],
  ['Hotels', 'hotels'],
  ['Rooms', 'rooms'],
  ['Halls', 'halls'],
  ['Packages', 'packages'],
  ['Rentals', 'rentals'],
  ['Bookings', 'bookings'],
];

function Shell() {
  const { store, reset } = useStore();
  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 bg-ink text-bone flex flex-col">
        <Link to="/" className="px-6 py-6 flex items-center gap-2 text-bone/80 hover:text-bone text-xs uppercase tracking-[0.3em] border-b border-bone/10">
          <ArrowLeft className="w-4 h-4" /> Back to site
        </Link>
        <div className="px-6 py-6 border-b border-bone/10">
          <div className="font-display text-3xl">{store.branding.brandName}</div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold mt-1">Studio · CMS</div>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map(([label, to]) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `block px-6 py-3 text-sm transition ${isActive ? 'bg-bone/5 text-gold border-l-2 border-gold' : 'text-bone/70 hover:text-bone hover:bg-bone/5 border-l-2 border-transparent'}`
              }>
              {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={() => { if (confirm('Reset all CMS data to seeds?')) reset(); }}
          className="m-6 text-[10px] uppercase tracking-[0.3em] text-bone/50 hover:text-destructive text-left">
          Reset to defaults
        </button>
      </aside>
      <main className="flex-1 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default function Admin() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Navigate to="branding" replace />} />
        <Route path="branding" element={<AdminBranding />} />
        <Route path="hotels" element={<AdminHotels />} />
        <Route path="rooms" element={<AdminRooms />} />
        <Route path="halls" element={<AdminHalls />} />
        <Route path="packages" element={<AdminPackages />} />
        <Route path="rentals" element={<AdminRentals />} />
        <Route path="bookings" element={<AdminBookings />} />
      </Route>
    </Routes>
  );
}
