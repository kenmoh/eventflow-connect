import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useMemo, useEffect } from "react";
import type {
  Hotel,
  Room,
  Hall,
  Pkg,
  RentalItem,
  Booking,
  CartLine,
  Branding,
  Employee,
  Role,
  InventoryMovement,
  SiteContent,
  AdminTab,
  SeatArrangement,
  FAQ,
  Theme,
  SavedReceipt,
  Contact,
} from "./types";
import { getSessionUser, logout as serverLogout } from "./db";

export type SessionState = {
  userId: string | null;
  profile: {
    id: string;
    name: string;
    email: string;
    roleId: string | null;
  } | null;
  loaded: boolean;
};

const defaultBranding: Branding = {
  brandName: "AB Consult",
  tagline: "A new way to convene.",
  primaryAccent: "38 60% 56%",
  logo: "/logo.png",
};

const defaultContent: SiteContent = {
  hero: {
    eyebrow: "",
    title1: "",
    title2: "",
    title3: "",
    description: "",
    primaryCta: "Browse hotels",
    secondaryCta: "Rent equipment",
  },
  stats: [],
  ticker: [],
  reservations: { eyebrow: "", title: "" },
  packagesSection: { eyebrow: "", title: "", copy: "" },
  rentalsSection: { eyebrow: "", title: "" },
  howItWorks: { eyebrow: "", title: "", steps: [] },
  footer: {
    blurb: "",
    contactEmail: "",
    contactPhone: "",
    contactCity: "",
    rightsLine: "",
  },
  about: { title: "About", updatedAt: "", body: "" },
  privacy: { title: "Privacy", updatedAt: "", body: "" },
  terms: { title: "Terms", updatedAt: "", body: "" },
  refund: { title: "Refund", updatedAt: "", body: "" },
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
  receipts: SavedReceipt[];
  contacts: Contact[];
};

type Persisted = {
  theme: Theme;
  cart: CartLine[];
};

type Auth = {
  userId: string | null;
  profile: {
    id: string;
    name: string;
    email: string;
    roleId: string | null;
  } | null;
  loaded: boolean;
};

type State = Loaded &
  Persisted & {
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
  addReceipt: (r: SavedReceipt) => void;
  deleteReceipt: (id: string) => void;
};

export const useStoreBase = create<State & Actions>()(
  persist(
    (set, get) => {
      return {
        // loaded (will be hydrated from DB)
        branding: defaultBranding,
        content: defaultContent,
        hotels: [],
        rooms: [],
        halls: [],
        packages: [],
        arrangements: [],
        rentals: [],
        faqs: [],
        bookings: [],
        movements: [],
        roles: [],
        employees: [],
        receipts: [],
        contacts: [],
        // persisted
        theme: "dark",
        cart: [],
        // runtime
        session: { userId: null, profile: null, loaded: false },
        hydrated: false,

        set: (k, v) => set({ [k]: v } as any),
        toggleTheme: () =>
          set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
        addCart: (line) =>
          set((s) => {
            const existing = s.cart.find((c) => c.itemId === line.itemId);
            const cart = existing
              ? s.cart.map((c) =>
                  c.itemId === line.itemId
                    ? {
                        ...c,
                        quantity: c.quantity + line.quantity,
                        days: line.days,
                      }
                    : c,
                )
              : [...s.cart, line];
            return { cart };
          }),
        updateCart: (itemId, patch) =>
          set((s) => ({
            cart: s.cart.map((c) =>
              c.itemId === itemId ? { ...c, ...patch } : c,
            ),
          })),
        removeCart: (itemId) =>
          set((s) => ({ cart: s.cart.filter((c) => c.itemId !== itemId) })),
        clearCart: () => set({ cart: [] }),
        setBookings: (b) => set({ bookings: b }),

        addBooking: async (b) => {
          set((s) => ({ bookings: [b, ...s.bookings] }));
          const { insertBooking } = await import("./db");
          try {
            await insertBooking(b);
          } catch (e) {
            console.error("insertBooking", e);
          }
        },
        updateBooking: async (ref, patch) => {
          set((s) => ({
            bookings: s.bookings.map((b) =>
              b.reference === ref ? { ...b, ...patch } : b,
            ),
          }));
          const { updateBookingDb } = await import("./db");
          try {
            await updateBookingDb(ref, patch);
          } catch (e) {
            console.error("updateBooking", e);
          }
        },
        addMovement: async (m) => {
          set((s) => ({ movements: [m, ...s.movements] }));
          const { insertMovement } = await import("./db");
          try {
            await insertMovement(m);
          } catch (e) {
            console.error("insertMovement", e);
          }
        },
        addReceipt: (r) => set((s) => ({ receipts: [r, ...s.receipts] })),
        deleteReceipt: (id) => set((s) => ({ receipts: s.receipts.filter((r) => r.id !== id) })),

      hydrate: async () => {
       
        try {
          const res = await fetch('/api/catalog');
        
          if (!res.ok) throw new Error(`Catalog API returned ${res.status}`);
          const data = await res.json();
        
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
            contacts: data.contacts,
          } as any);
        } catch (e) {
          console.error('[hydrate] Failed to load catalog:', e);
        } finally {
         
          set({ hydrated: true });
        }
        const session = get().session;
        if (session.userId) {
          try {
            const res = await fetch('/api/employees');
            if (res.ok) set({ employees: await res.json() } as any);
          } catch {
            /* ignore */
          }
        }
      },
    };
    },
    {
      name: "abc-store-v4",
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => localStorage)
          : undefined,
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
      useStoreBase.setState({
        session: { userId: null, profile: null, loaded: true },
        employees: [],
      } as any);
      return;
    }
  };
}

function CustomSessionEffect() {
  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const user = await getSessionUser();
        if (!active) return;

        if (user) {
          useStoreBase.setState({
            session: {
              userId: user.id,
              profile: {
                id: user.id,
                name: user.name,
                email: user.email,
                roleId: user.roleId,
              },
              loaded: true,
            },
          } as any);

          // Fetch employees to sync roleId if it changed in DB
          const r = await fetch('/api/employees');
          if (r.ok && active) {
            const employees = await r.json();
            useStoreBase.setState({ employees } as any);
            const myProfile = employees.find((e: any) => e.id === user.id);
            if (myProfile?.roleId && myProfile.roleId !== user.roleId) {
              const current = useStoreBase.getState().session;
              useStoreBase.setState({
                session: { ...current, profile: { ...current.profile!, roleId: myProfile.roleId } },
              } as any);
            }
          }
        } else {
          useStoreBase.setState({
            session: { userId: null, profile: null, loaded: true },
            employees: [],
          } as any);
        }
      } catch (e) {
        if (active) {
          useStoreBase.setState({
            session: { userId: null, profile: null, loaded: true },
          } as any);
        }
      }
    }

    checkSession();
    return () => { active = false; };
  }, []);

  return null;
}

/** Apply branding accent + theme + title. Mount once at app root. */
export function BrandingEffects() {
  const branding = useStoreBase((s) => s.branding);
  const theme = useStoreBase((s) => s.theme);
  const hydrate = useStoreBase((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--accent",
      branding.primaryAccent,
    );
    document.documentElement.style.setProperty(
      "--gold",
      branding.primaryAccent,
    );
    document.documentElement.style.setProperty(
      "--ring",
      branding.primaryAccent,
    );
    document.documentElement.style.setProperty(
      "--primary",
      branding.primaryAccent,
    );
    document.title = `${branding.brandName} — ${branding.tagline}`;
  }, [branding]);
  return <CustomSessionEffect />;
}

export function makeReference() {
  const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
  return `ABC-${uuid.slice(0, 5)}-${uuid.slice(5)}`;
}

export function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

export function useCurrentEmployee(): Omit<Employee, 'password'> | null {
  const profile = useStoreBase((s) => s.session.profile);
  return useMemo(() => {
    if (!profile) return null;
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      roleId: profile.roleId ?? '',
    };
  }, [profile]);
}

const EMPTY_TABS: AdminTab[] = [];

export function useAllowedTabs(): AdminTab[] {
  const roleId = useStoreBase((s) => s.session.profile?.roleId);
  const tabs = useStoreBase((s) => s.roles.find((r) => r.id === roleId)?.tabs);
  return tabs ?? EMPTY_TABS;
}

export async function logout() {
  await serverLogout();
  window.location.href = '/';
}

// Backwards-compat helpers used by some components
export function useStore() {
  const s = useStoreBase();
  return {
    store: s,
    set: s.set,
    addCart: s.addCart,
    removeCart: s.removeCart,
    updateCart: s.updateCart,
    clearCart: s.clearCart,
  };
}
