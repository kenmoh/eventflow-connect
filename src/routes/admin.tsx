import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  useStoreBase,
  useCurrentEmployee,
  useAllowedTabs,
  logout,
} from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AdminTab } from "@/lib/types";

const NAV: [AdminTab, string, React.ElementType][] = [
  ["revenue", "Revenue", TrendingUp],
  ["bookings", "Bookings", Calendar],
  ["inventory", "Inventory", Building],
  ["hotels", "Hotels", Building],
  ["rooms", "Rooms", Bed],
  ["halls", "Halls", Users],
  ["packages", "Packages", ShoppingBag],
  ["arrangements", "Seat layouts", Building],
  ["rentals", "Rentals", ShoppingBag],
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
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-xs uppercase tracking-[0.3em]">
        Loading…
      </div>
    );
  }
  if (!userId) return <AuthScreen />;
  if (!profile?.roleId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-4xl">No role assigned</h1>
          <p className="mt-3 text-muted-foreground">
            Your account exists, but the owner hasn't given it a role yet.
          </p>
          <button onClick={() => logout()} className="mt-6 underline text-sm">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <Shell />;
}

function AuthScreen() {
  const branding = useStoreBase((s) => s.branding);
  const hydrate = useStoreBase((s) => s.hydrate);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [ownerExists, setOwnerExists] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.rpc("owner_exists").then(({ data }) => {
      const exists = !!data;
      setOwnerExists(exists);
      if (!exists) setMode("sign-up");
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "sign-up") {
        if (ownerExists) {
          setErr("Sign-ups are by invitation. Ask the owner to add you.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/admin`,
          },
        });
        if (error) {
          setErr(error.message);
          return;
        }
        if (data.session) {
          const { error: bErr } = await supabase.rpc("bootstrap_owner");
          if (bErr) {
            setErr(bErr.message);
            return;
          }
          await hydrate();
          toast.success("Owner account created.");
        } else {
          toast.success("Check your email to confirm.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setErr(error.message);
          return;
        }
        await hydrate();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-card border border-border p-10"
      >
        <Link
          to="/"
          className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground inline-flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="w-3 h-3" /> Back to site
        </Link>
        <div className="font-display text-3xl">{branding.brandName}</div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold mt-1 mb-8">
          Studio ·{" "}
          {ownerExists === false
            ? "Create owner"
            : mode === "sign-up"
              ? "Sign up"
              : "Sign in"}
        </div>

        {mode === "sign-up" && (
          <label className="block mb-4">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">
              Name
            </span>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        )}
        <label className="block mb-4">
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">
            Email
          </span>
          <input
            type="email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block mb-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">
            Password
          </span>
          <input
            type="password"
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        {err && <p className="text-destructive text-xs mt-2">{err}</p>}
        <button
          disabled={busy}
          className="mt-6 w-full bg-gold text-gold-foreground py-3 text-xs uppercase tracking-[0.3em] hover:opacity-90 disabled:opacity-60"
        >
          {busy
            ? "Working…"
            : mode === "sign-up"
              ? ownerExists === false
                ? "Create owner account"
                : "Request access"
              : "Sign in"}
        </button>

        {busy && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Signing in and loading your workspace…
          </p>
        )}

        {ownerExists !== false && (
          <button
            type="button"
            onClick={() =>
              setMode((m) => (m === "sign-in" ? "sign-up" : "sign-in"))
            }
            className="mt-6 block w-full text-[10px] uppercase tracking-[0.3em] text-muted-foreground text-center hover:text-foreground"
          >
            {mode === "sign-in"
              ? "No account? Sign up"
              : "Have an account? Sign in"}
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
  const branding = useStoreBase((s) => s.branding);
  const emp = useCurrentEmployee();
  const allowed = useAllowedTabs();
  const role = useStoreBase((s) => s.roles.find((r) => r.id === emp?.roleId));
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
        className="lg:hidden fixed top-4 left-4 z-40 bg-ink text-ink-foreground p-2 rounded-md border border-border"
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
          fixed lg:relative z-30 h-screen 
          bg-ink text-ink-foreground flex flex-col border-r border-border 
          transition-all duration-300
          ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0 lg:w-64'} 
          lg:translate-x-0
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
          <div
            className={`font-display hidden lg:block ${collapsed ? 'text-lg text-center' : 'text-2xl'}`}
          >
            {branding.brandName}
          </div>
          {!collapsed && (
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
              <button
                onClick={() => logout()}
                className="mt-4 inline-flex items-center gap-2 opacity-60 hover:opacity-100"
              >
                <LogOut className="w-3 h-3" /> Sign out
              </button>
            </>
          )}
        </div>
      </aside>
      
      {/* Desktop collapse toggle */}
      <button
        onClick={toggleCollapsed}
        className="hidden lg:flex absolute top-1/2 left-16 -translate-y-1/2 bg-ink text-ink-foreground border border-border rounded-r-md p-1 hover:bg-bone/20 transition-colors z-20"
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
