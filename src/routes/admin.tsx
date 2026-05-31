import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  useStoreBase,
  useCurrentEmployee,
  useAllowedTabs,
  logout,
} from "@/lib/store";
import { SignIn, SignUp } from "@clerk/tanstack-react-start";
import {
  ArrowLeft,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Home,
  TrendingUp,
  Calendar,
  Building,
  Bed,
  Users,
  ShoppingBag,
  HelpCircle,
  FileText,
  Palette,
  UserCog,
  Receipt,
  Sun,
  Moon,
  Mail,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { AdminTab } from "@/lib/types";

const NAV: [AdminTab, string, React.ElementType][] = [
  ["revenue", "Revenue", TrendingUp],
  ["bookings", "Bookings", Calendar],
  ["contacts", "Contacts", Mail],
  ["inventory", "Inventory", Building],
  ["hotels", "Hotels", Building],
  ["rooms", "Rooms", Bed],
  ["halls", "Halls", Users],
  ["packages", "Catering", ShoppingBag],
  ["arrangements", "Seat layouts", Building],
  ["rentals", "Rentals", ShoppingBag],
  ["receipts", "Receipts", Receipt],
  ["faqs", "FAQs", HelpCircle],
  ["legal", "Legal & About", FileText],
  ["content", "Site content", FileText],
  ["branding", "Branding", Palette],
  ["employees", "Employees", UserCog],
];

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const sessionLoaded = useStoreBase((s) => s.session.loaded);
  const userId = useStoreBase((s) => s.session.userId);
  const profile = useStoreBase((s) => s.session.profile);

  if (!sessionLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent animate-spin rounded-full" />
          <div className="text-muted-foreground text-[10px] uppercase tracking-[0.3em]">
            Initializing session…
          </div>
        </div>
      </div>
    );
  }

  if (!userId) return <AuthScreen />;

  // If we have a userId but no roleId, it means they are logged in but not authorized.
  // We check profile?.roleId. If profile is missing (unexpected), we also treat as unauthorized.
  if (!profile?.roleId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-4xl">Access Restricted</h1>
          <p className="mt-3 text-muted-foreground">
            Your account ({profile?.email || 'authenticated user'}) is not yet assigned an admin role.
          </p>
          <div className="mt-8 flex flex-col gap-4 items-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Please contact the system owner to request access.
            </p>
            <button 
              onClick={() => {
                // Clear local session and redirect
                localStorage.removeItem('abc-store-v4');
                window.location.href = '/';
              }} 
              className="underline text-xs opacity-60 hover:opacity-100"
            >
              Sign out & Return to site
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Shell />;
}

function AuthScreen() {
  const [ownerExists, setOwnerExists] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.ok ? r.json() : [])
      .then(emps => setOwnerExists(emps.length > 0))
      .catch(() => setOwnerExists(false));
  }, []);

  if (ownerExists === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-xs uppercase tracking-[0.3em]">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {ownerExists ? (
          <div className="flex flex-col items-center">
            <h1 className="font-display text-3xl mb-8 text-center">Admin Portal</h1>
            <SignIn
              routing="hash"
              afterSignInUrl="/admin"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <h1 className="font-display text-3xl mb-2 text-center">Setup Owner</h1>
            <p className="mb-8 text-muted-foreground text-center text-sm">
              First time setup — create the owner account.
            </p>
            <SignUp
              forceRedirectUrl="/admin"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Shell() {
  const branding = useStoreBase((s) => s.branding);
  const emp = useCurrentEmployee();
  const allowed = useAllowedTabs();
  const role = useStoreBase((s) => s.roles.find((r) => r.id === emp?.roleId));
  const theme = useStoreBase((s) => s.theme);
  const toggleTheme = useStoreBase((s) => s.toggleTheme);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adminSidebarCollapsed");
      return saved === "true";
    }
    return false;
  });

  const toggleCollapsed = () => {
    const newValue = !collapsed;
    setCollapsed(newValue);
    localStorage.setItem("adminSidebarCollapsed", String(newValue));
  };

  const filteredNav = NAV.filter(([t]) => allowed.includes(t));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        className="lg:hidden fixed top-4 left-4 z-40 bg-ink text-bone p-2 rounded-md border border-border"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          z-30 h-screen 
          bg-ink text-bone flex flex-col border-r border-border 
          transition-all duration-300
          ${mobileOpen ? 'fixed inset-y-0 left-0 w-64 z-40' : 'fixed -translate-x-full lg:relative lg:translate-x-0 lg:sticky lg:top-0 lg:w-64'}
          ${collapsed ? 'lg:w-16' : ''}
        `}
      >
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2 opacity-80 hover:opacity-100 text-xs uppercase tracking-[0.3em] border-b border-bone/10 ${collapsed ? 'justify-center px-2 py-6' : 'px-6 py-6'}`}
        >
          <ArrowLeft className="w-4 h-4" />
          {!collapsed && <span>Back to site</span>}
        </Link>
        <div
          className={`border-b border-bone/10 ${collapsed ? 'p-2' : 'px-6 py-6'}`}
        >
          {branding.logo ? (
            collapsed ? (
              <img src={branding.logo} alt={branding.brandName} className="w-8 h-8 mx-auto object-contain" />
            ) : (
              <img src={branding.logo} alt={branding.brandName} className="h-10 w-auto object-contain" />
            )
          ) : (
            <div
              className={`font-display hidden lg:block ${collapsed ? 'text-lg text-center' : 'text-2xl'}`}
            >
              {branding.brandName}
            </div>
          )}
          {!collapsed && !branding.logo && (
            <div className="text-[10px] uppercase tracking-[0.4em] text-gold mt-1 hidden lg:block">
              Studio · CMS
            </div>
          )}
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {filteredNav.map(([to, label, Icon]) => (
            <Link
              key={to}
              to={`/admin/${to}`}
              onClick={() => setMobileOpen(false)}
              activeProps={{
                className:
                  "bg-bone/5 text-gold border-l-2 border-gold opacity-100",
              }}
              inactiveProps={{
                className:
                  "opacity-70 hover:opacity-100 hover:bg-bone/5 border-l-2 border-transparent",
              }}
              className={`flex items-center gap-3 text-sm transition ${!mobileOpen && collapsed ? 'justify-center px-2 py-3' : 'px-6 py-3'}`}
              title={!mobileOpen && collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {(mobileOpen || !collapsed) && <span>{label}</span>}
            </Link>
          ))}
        </nav>
        <div
          className={`border-t border-bone/10 text-xs ${!mobileOpen && collapsed ? 'p-2 hidden lg:flex' : 'p-6'}`}
        >
          {(!mobileOpen && collapsed) ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-medium">
                {emp?.name?.charAt(0) ?? "?"}
              </div>
              <button
                onClick={toggleTheme}
                className="opacity-60 hover:opacity-100 p-1"
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => logout()}
                className="opacity-60 hover:opacity-100 p-1"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="opacity-90">{emp?.name}</div>
              <div className="opacity-50 text-[10px] uppercase tracking-[0.3em]">
                {role?.name ?? "No role"}
              </div>
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-2 opacity-60 hover:opacity-100"
                >
                  {theme === 'dark' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />} Toggle theme
                </button>
                <button
                  onClick={() => logout()}
                  className="inline-flex items-center gap-2 opacity-60 hover:opacity-100"
                >
                  <LogOut className="w-3 h-3" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
      
      {/* Desktop collapse toggle */}
      <button
        onClick={toggleCollapsed}
        className="hidden lg:flex absolute top-1/2 left-16 -translate-y-1/2 bg-ink text-bone border border-border rounded-r-md p-1 hover:bg-bone/20 transition-colors z-20"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
      
      <main
        className="flex-1 w-full min-w-0 p-4 pt-12 lg:p-8 overflow-x-hidden transition-all duration-300"
      >
        <Outlet />
      </main>
    </div>
  );
}
