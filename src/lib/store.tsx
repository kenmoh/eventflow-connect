import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { Hotel, Room, Hall, Pkg, RentalItem, Booking, CartLine, Branding } from './types';
import { seedHotels, seedRooms, seedHalls, seedPackages, seedRentals, seedBranding } from './seed';

type Store = {
  branding: Branding;
  hotels: Hotel[];
  rooms: Room[];
  halls: Hall[];
  packages: Pkg[];
  rentals: RentalItem[];
  bookings: Booking[];
  cart: CartLine[];
};

const KEY = 'sela-store-v1';
const defaultStore: Store = {
  branding: seedBranding,
  hotels: seedHotels,
  rooms: seedRooms,
  halls: seedHalls,
  packages: seedPackages,
  rentals: seedRentals,
  bookings: [],
  cart: [],
};

type Ctx = {
  store: Store;
  set: <K extends keyof Store>(key: K, value: Store[K]) => void;
  reset: () => void;
  addBooking: (b: Booking) => void;
  updateBooking: (ref: string, patch: Partial<Booking>) => void;
  addCart: (line: CartLine) => void;
  updateCart: (itemId: string, patch: Partial<CartLine>) => void;
  removeCart: (itemId: string) => void;
  clearCart: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(() => {
    if (typeof window === 'undefined') return defaultStore;
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...defaultStore, ...JSON.parse(raw) } : defaultStore;
    } catch { return defaultStore; }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {}
  }, [store]);

  // apply branding accent live
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', store.branding.primaryAccent);
    document.documentElement.style.setProperty('--gold', store.branding.primaryAccent);
    document.documentElement.style.setProperty('--ring', store.branding.primaryAccent);
    document.title = `${store.branding.brandName} — ${store.branding.tagline}`;
  }, [store.branding]);

  const value = useMemo<Ctx>(() => ({
    store,
    set: (k, v) => setStore(s => ({ ...s, [k]: v })),
    reset: () => setStore(defaultStore),
    addBooking: (b) => setStore(s => ({ ...s, bookings: [b, ...s.bookings] })),
    updateBooking: (ref, patch) => setStore(s => ({
      ...s, bookings: s.bookings.map(b => b.reference === ref ? { ...b, ...patch } : b),
    })),
    addCart: (line) => setStore(s => {
      const existing = s.cart.find(c => c.itemId === line.itemId);
      const cart = existing
        ? s.cart.map(c => c.itemId === line.itemId ? { ...c, quantity: c.quantity + line.quantity, days: line.days } : c)
        : [...s.cart, line];
      return { ...s, cart };
    }),
    updateCart: (itemId, patch) => setStore(s => ({
      ...s, cart: s.cart.map(c => c.itemId === itemId ? { ...c, ...patch } : c),
    })),
    removeCart: (itemId) => setStore(s => ({ ...s, cart: s.cart.filter(c => c.itemId !== itemId) })),
    clearCart: () => setStore(s => ({ ...s, cart: [] })),
  }), [store]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function makeReference() {
  const a = Math.random().toString(36).slice(2, 6).toUpperCase();
  const b = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SELA-${a}-${b}`;
}

export function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
