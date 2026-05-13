import { Link } from '@tanstack/react-router';
import { useStoreBase } from '@/lib/store';
import { ShoppingBag, Search, Sun, Moon, Menu, X } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function SiteLayout({ children }: { children: ReactNode }) {
  const branding = useStoreBase(s => s.branding);
  const cart = useStoreBase(s => s.cart);
  const footer = useStoreBase(s => s.content.footer);
  const theme = useStoreBase(s => s.theme);
  const toggleTheme = useStoreBase(s => s.toggleTheme);
  const cartCount = cart.reduce((a, c) => a + c.quantity, 0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navLinks: [string, string][] = [
    ['Hotels', '/hotels'],
    ['Rentals', '/rentals'],
    ['Track', '/track'],
    ['Admin', '/admin'],
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="fixed top-0 inset-x-0 z-40 text-foreground bg-background/70 backdrop-blur-md border-b border-border/50">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <button aria-label="Open menu" className="md:hidden inline-flex p-2 hover:opacity-70 transition">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                <SheetHeader className="mb-6">
                  <SheetTitle className="font-display text-xl">{branding.brandName}</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 text-sm uppercase tracking-[0.2em]">
                  {navLinks.map(([label, to]) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileNavOpen(false)}
                      className="py-2 border-b border-border/30 hover:text-gold transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-8 pt-6 border-t border-border/30">
                  <Link
                    to="/cart"
                    onClick={() => setMobileNavOpen(false)}
                    className="relative inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em]"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Cart</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-3 w-4 h-4 rounded-full bg-gold text-gold-foreground text-[10px] flex items-center justify-center font-medium">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
            <Link to="/" className="flex items-center gap-1">
              <img src="/logo.png" alt={branding.brandName} className="h-16 w-auto object-contain" />
              <span className="font-display text-xl tracking-tight">{branding.brandName}</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.2em]">
            {navLinks.map(([label, to]) => (
              <Link key={to} to={to}
                className="group relative pb-1 transition-opacity hover:opacity-100 opacity-70 aria-[current=page]:opacity-100"
              >
                {label}
                <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-gold opacity-0 group-aria-[current=page]:opacity-100 transition-opacity" />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} aria-label="Toggle theme"
              className="inline-flex p-2 hover:opacity-70 transition">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link to="/rentals" aria-label="Search" className="hidden sm:inline-flex p-2 hover:opacity-70">
              <Search className="w-4 h-4" />
            </Link>
            <Link to="/cart" className="relative hidden sm:flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 w-4 h-4 rounded-full bg-gold text-gold-foreground text-[10px] flex items-center justify-center font-medium">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-0">{children}</main>

      <footer className="mt-32 bg-ink text-ink-foreground border-t border-border">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="font-display text-4xl">{branding.brandName}.</div>
            <p className="mt-4 max-w-md opacity-70">{footer.blurb}</p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-4">Discover</div>
            <ul className="space-y-2 opacity-70">
              <li><Link to="/hotels">Hotels</Link></li>
              <li><Link to="/rentals">Rentals</Link></li>
              <li><Link to="/track">Track booking</Link></li>
              <li><Link to="/faqs">FAQs</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold mb-4">Studio</div>
            <ul className="space-y-2 opacity-70">
              <li>{footer.contactEmail}</li>
              <li>{footer.contactPhone}</li>
              <li>{footer.contactCity}</li>
              <li className="pt-2"><Link to="/about">About</Link></li>
              <li><Link to="/privacy">Privacy</Link></li>
              <li><Link to="/terms">Terms</Link></li>
              <li><Link to="/refund">Refund</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-bone/10">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-6 flex flex-wrap items-center justify-between text-xs opacity-60">
            <span>© {new Date().getFullYear()} {branding.brandName}. All rights reserved.</span>
            <span className="uppercase tracking-[0.3em]">{footer.rightsLine}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
