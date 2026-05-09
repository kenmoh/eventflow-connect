import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  Hotel, Room, Hall, Pkg, RentalItem, Booking, CartLine, Branding,
  Employee, Role, InventoryMovement, SiteContent, AdminTab,
  SeatArrangement, FAQ, Theme,
} from './types';
import { loadCatalog, loadEmployees } from './db';

const defaultBranding: Branding = {
  brandName: 'All Brothers Consult',
  tagline: 'A new way to convene.',
  primaryAccent: '38 60% 56%',
};

const defaultContent: SiteContent = {
  hero: { eyebrow: '', title1: '', title2: '', title3: '', description: '', primaryCta: 'Browse hotels', secondaryCta: 'Rent equipment' },
  stats: [], ticker: [],
  reservations: { eyebrow: '', title: '' },
  packagesSection: { eyebrow: '', title: '', copy: '' },
  rentalsSection: { eyebrow: '', title: '' },
  howItWorks: { eyebrow: '', title: '', steps: [] },
  footer: { blurb: '', contactEmail: '', contactPhone: '', contactCity: '', rightsLine: '' },
  about: { title: 'About', updatedAt: '', body: '' },
  privacy: { title: 'Privacy', updatedAt: '', body: '' },
  terms: { title: 'Terms', updatedAt: '', body: '' },
  refund: { title: 'Refund', updatedAt: '', body: '' },
};

type Loaded = {
  branding: Branding;
  content: SiteContent;
  hotels: Hotel[];
  rooms: Room[];
  halls: Hall[];
  packages: Pkg[];
  arrangements: SeatArrangement[];
  rentals: RentalItem[];
  faqs: FAQ[];
  bookings: Booking[];
  movements: InventoryMovement[];
  roles: Role[];
  employees: Employee[];
};

type Persisted = {
  theme: Theme;
  cart: CartLine[];
};

type Auth = {
  userId: string | null;
  profile: { id: string; name: string; email: string; roleId: string | null } | null;
  loaded: boolean;
};

type State = Loaded & Persisted & {
  session: Auth;
  hydrated: boolean;
};

type Actions = {
  set: <K extends keyof Loaded>(key: K, value: Loaded[K]) => void;
  toggleTheme: () => void;
  addCart: (line: CartLine) => void;
  updateCart: (itemId: string, patch: Partial<CartLine>) => void;
  removeCart: (itemId: string) => void;
  clearCart: () => void;
  hydrate: () => Promise<void>;
  setBookings: (b: Booking[]) => void;
  addBooking: (b: Booking) => Promise<void>;
  updateBooking: (ref: string, patch: Partial<Booking>) => Promise<void>;
  addMovement: (m: InventoryMovement) => Promise<void>;
};

export const useStoreBase = create<State & Actions>()(
  persist(
    (set, get) => ({
      // loaded (will be hydrated from DB)
      branding: defaultBranding,
      content: defaultContent,
      hotels: [], rooms: [], halls: [], packages: [], arrangements: [],
      rentals: [], faqs: [], bookings: [], movements: [], roles: [], employees: [],
      // persisted
      theme: 'dark',
      cart: [],
      // runtime
      session: { userId: null, profile: null, loaded: false },
      hydrated: false,

      set: (k, v) => set({ [k]: v } as any),
      toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      addCart: (line) => set(s => {
        const existing = s.cart.find(c => c.itemId === line.itemId);
        const cart = existing
          ? s.cart.map(c => c.itemId === line.itemId ? { ...c, quantity: c.quantity + line.quantity, days: line.days } : c)
          : [...s.cart, line];
        return { cart };
      }),
      updateCart: (itemId, patch) => set(s => ({ cart: s.cart.map(c => c.itemId === itemId ? { ...c, ...patch } : c) })),
      removeCart: (itemId) => set(s => ({ cart: s.cart.filter(c => c.itemId !== itemId) })),
      clearCart: () => set({ cart: [] }),
      setBookings: (b) => set({ bookings: b }),

      addBooking: async (b) => {
        set(s => ({ bookings: [b, ...s.bookings] }));
        const { insertBooking } = await import('./db');
        try { await insertBooking(b); } catch (e) { console.error('insertBooking', e); }
      },
      updateBooking: async (ref, patch) => {
        set(s => ({ bookings: s.bookings.map(b => b.reference === ref ? { ...b, ...patch } : b) }));
        const { updateBookingDb } = await import('./db');
        try { await updateBookingDb(ref, patch); } catch (e) { console.error('updateBooking', e); }
      },
      addMovement: async (m) => {
        set(s => ({ movements: [m, ...s.movements] }));
        const { insertMovement } = await import('./db');
        try { await insertMovement(m); } catch (e) { console.error('insertMovement', e); }
      },

      hydrate: async () => {
        const data = await loadCatalog();
        set({
          ...(data.branding ? { branding: data.branding } : {}),
          ...(data.content ? { content: data.content } : {}),
          hotels: data.hotels,
          rooms: data.rooms,
          halls: data.halls,
          packages: data.packages,
          arrangements: data.arrangements,
          rentals: data.rentals,
          faqs: data.faqs,
          bookings: data.bookings,
          movements: data.movements,
          roles: data.roles,
          hydrated: true,
        } as any);
        // Load employees only if signed in (RLS)
        const session = get().session;
        if (session.userId) {
          try { set({ employees: await loadEmployees() } as any); } catch { /* ignore */ }
        }
      },
    }),
    {
      name: 'abc-store-v4',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ theme: s.theme, cart: s.cart }) as any,
    },
  ),
);

// Initialize auth state listener once
let authInitialized = false;
function initAuth() {
  if (authInitialized) return;
  authInitialized = true;

  const handle = async (uid: string | null) => {
    if (!uid) {
      useStoreBase.setState({ session: { userId: null, profile: null, loaded: true }, employees: [] } as any);
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, email, role_id')
      .eq('id', uid)
      .maybeSingle();
    useStoreBase.setState({
      session: {
        userId: uid,
        profile: profile ? { id: profile.id, name: profile.name, email: profile.email, roleId: profile.role_id } : null,
        loaded: true,
      },
    } as any);
    try { useStoreBase.setState({ employees: await loadEmployees() } as any); } catch { /* ignore */ }
  };

  supabase.auth.onAuthStateChange((_evt, session) => { handle(session?.user?.id ?? null); });
  supabase.auth.getSession().then(({ data }) => { handle(data.session?.user?.id ?? null); });
}

/** Apply branding accent + theme + title. Mount once at app root. */
export function BrandingEffects() {
  const branding = useStoreBase(s => s.branding);
  const theme = useStoreBase(s => s.theme);
  const hydrate = useStoreBase(s => s.hydrate);
  useEffect(() => { initAuth(); hydrate(); }, [hydrate]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', branding.primaryAccent);
    document.documentElement.style.setProperty('--gold', branding.primaryAccent);
    document.documentElement.style.setProperty('--ring', branding.primaryAccent);
    document.documentElement.style.setProperty('--primary', branding.primaryAccent);
    document.title = `${branding.brandName} — ${branding.tagline}`;
  }, [branding]);
  return null;
}

export function makeReference() {
  const a = Math.random().toString(36).slice(2, 6).toUpperCase();
  const b = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ABC-${a}-${b}`;
}

export function fmt(n: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
}

export function useCurrentEmployee(): Employee | null {
  return useStoreBase(s => {
    const p = s.session.profile;
    if (!p) return null;
    return { id: p.id, name: p.name, email: p.email, password: '', roleId: p.roleId ?? '' };
  });
}

export function useAllowedTabs(): AdminTab[] {
  const emp = useCurrentEmployee();
  const role = useStoreBase(s => s.roles.find(r => r.id === emp?.roleId));
  return role?.tabs ?? [];
}

export async function logout() {
  await supabase.auth.signOut();
}

// Backwards-compat helpers used by some components
export function useStore() {
  const s = useStoreBase();
  return { store: s, set: s.set, addCart: s.addCart, removeCart: s.removeCart, updateCart: s.updateCart, clearCart: s.clearCart };
}
