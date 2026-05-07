import { Link, NavLink, useLocation } from 'react-router-dom';
import { useStoreBase } from '@/lib/store';
import { ShoppingBag, Search } from 'lucide-react';
import { ReactNode } from 'react';

export default function SiteLayout({ children }: { children: ReactNode }) {
  const branding = useStoreBase(s => s.branding);
  const cart = useStoreBase(s => s.cart);
  const footer = useStoreBase(s => s.content.footer);
  const cartCount = cart.reduce((a, c) => a + c.quantity, 0);
  useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="fixed top-0 inset-x-0 z-40 text-foreground bg-background/60 backdrop-blur-md border-b border-border/50">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-display text-xl tracking-tight">{branding.brandName}</span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.3em] opacity-50">est. 2026</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.2em]">
            {[['Hotels', '/hotels'], ['Rentals', '/rentals'], ['Track', '/track'], ['Admin', '/admin']].map(([label, to]) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `relative pb-1 transition-opacity hover:opacity-100 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {({ isActive }) => (<>{label}{isActive && <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-gold" />}</>)}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/rentals" aria-label="Search" className="hidden sm:inline-flex p-2 hover:opacity-70">
              <Search className="w-4 h-4" />
            </Link>
            <Link to="/cart" className="relative inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 w-4 h-4 rounded-full bg-gold text-ink text-[10px] flex items-center justify-center font-medium">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-0">{children}</main>

      <footer className="mt-32 bg-ink text-bone border-t border-border">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="font-display text-4xl">{branding.brandName}.</div>
            <p className="mt-4 max-w-md text-bone/70">{footer.blurb}</p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-4">Discover</div>
            <ul className="space-y-2 text-bone/70">
              <li><Link to="/hotels">Hotels</Link></li>
              <li><Link to="/rentals">Rentals</Link></li>
              <li><Link to="/track">Track booking</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-4">Studio</div>
            <ul className="space-y-2 text-bone/70">
              <li>{footer.contactEmail}</li>
              <li>{footer.contactPhone}</li>
              <li>{footer.contactCity}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-bone/10">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-6 flex flex-wrap items-center justify-between text-xs text-bone/50">
            <span>© {new Date().getFullYear()} {branding.brandName}. All rights reserved.</span>
            <span className="uppercase tracking-[0.3em]">{footer.rightsLine}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
