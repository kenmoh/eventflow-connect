import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';
import type {
  Hotel, Room, Hall, Pkg, RentalItem, Booking, CartLine, Branding,
  Employee, Role, InventoryMovement, SiteContent, AdminTab,
} from './types';
import {
  seedHotels, seedRooms, seedHalls, seedPackages, seedRentals,
  seedBranding, seedRoles, seedEmployees, seedMovements, seedContent, seedBookings,
} from './seed';

type State = {
  branding: Branding;
  content: SiteContent;
  hotels: Hotel[];
  rooms: Room[];
  halls: Hall[];
  packages: Pkg[];
  rentals: RentalItem[];
  bookings: Booking[];
  cart: CartLine[];
  employees: Employee[];
  roles: Role[];
  movements: InventoryMovement[];
  session: { employeeId: string | null };
};

type Actions = {
  set: <K extends keyof State>(key: K, value: State[K]) => void;
  reset: () => void;
  addBooking: (b: Booking) => void;
  updateBooking: (ref: string, patch: Partial<Booking>) => void;
  addCart: (line: CartLine) => void;
  updateCart: (itemId: string, patch: Partial<CartLine>) => void;
  removeCart: (itemId: string) => void;
  clearCart: () => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addMovement: (m: InventoryMovement) => void;
};

const defaultState: State = {
  branding: seedBranding,
  content: seedContent,
  hotels: seedHotels,
  rooms: seedRooms,
  halls: seedHalls,
  packages: seedPackages,
  rentals: seedRentals,
  bookings: seedBookings,
  cart: [],
  employees: seedEmployees,
  roles: seedRoles,
  movements: seedMovements,
  session: { employeeId: null },
};

export const useStoreBase = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...defaultState,
      set: (k, v) => set({ [k]: v } as Pick<State, typeof k>),
      reset: () => set({ ...defaultState }),
      addBooking: (b) => set(s => ({ bookings: [b, ...s.bookings] })),
      updateBooking: (ref, patch) => set(s => ({
        bookings: s.bookings.map(b => b.reference === ref ? { ...b, ...patch } : b),
      })),
      addCart: (line) => set(s => {
        const existing = s.cart.find(c => c.itemId === line.itemId);
        const cart = existing
          ? s.cart.map(c => c.itemId === line.itemId ? { ...c, quantity: c.quantity + line.quantity, days: line.days } : c)
          : [...s.cart, line];
        return { cart };
      }),
      updateCart: (itemId, patch) => set(s => ({
        cart: s.cart.map(c => c.itemId === itemId ? { ...c, ...patch } : c),
      })),
      removeCart: (itemId) => set(s => ({ cart: s.cart.filter(c => c.itemId !== itemId) })),
      clearCart: () => set({ cart: [] }),
      login: (email, password) => {
        const emp = get().employees.find(e => e.email.toLowerCase() === email.toLowerCase() && e.password === password);
        if (!emp) return false;
        set({ session: { employeeId: emp.id } });
        return true;
      },
      logout: () => set({ session: { employeeId: null } }),
      addMovement: (m) => set(s => ({ movements: [m, ...s.movements] })),
    }),
    { name: 'abc-store-v2' },
  ),
);

/** Backwards-compat hook so old code that did `const { store, ... } = useStore()` still works. */
export function useStore() {
  const state = useStoreBase();
  return {
    store: state,
    set: state.set,
    reset: state.reset,
    addBooking: state.addBooking,
    updateBooking: state.updateBooking,
    addCart: state.addCart,
    updateCart: state.updateCart,
    removeCart: state.removeCart,
    clearCart: state.clearCart,
    login: state.login,
    logout: state.logout,
    addMovement: state.addMovement,
  };
}

/** Apply branding accent live + title. Mount once at app root. */
export function BrandingEffects() {
  const branding = useStoreBase(s => s.branding);
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

export function currentEmployee() {
  const s = useStoreBase.getState();
  return s.employees.find(e => e.id === s.session.employeeId) || null;
}

export function useCurrentEmployee() {
  return useStoreBase(s => s.employees.find(e => e.id === s.session.employeeId) || null);
}

export function useAllowedTabs(): AdminTab[] {
  const emp = useCurrentEmployee();
  const role = useStoreBase(s => s.roles.find(r => r.id === emp?.roleId));
  return role?.tabs ?? [];
}

/** Provider compatibility shim — Zustand needs no provider, but App imports it. */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
