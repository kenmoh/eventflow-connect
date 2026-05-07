export type ID = string;

export type Hotel = {
  id: ID;
  name: string;
  location: string;
  tagline: string;
  image: string;
  rating: number;
  amenities: string[];
};

export type Room = {
  id: ID;
  hotelId: ID;
  type: string;
  description: string;
  price: number;
  capacity: number;
  image: string;
};

export type Hall = {
  id: ID;
  hotelId: ID;
  name: string;
  capacity: number;
  pricePerHour: number;
  image: string;
};

export type Pkg = {
  id: ID;
  name: string;
  description: string;
  items: string[];
  pricePerPerson: number;
};

export type RentalCategory = 'Sound' | 'Lighting' | 'Seating' | 'Tents' | 'Decor';

export type RentalItem = {
  id: ID;
  name: string;
  category: RentalCategory;
  pricePerDay: number;
  ownership: 'internal' | 'vendor';
  depositPct: number;
  image: string;
  description: string;
  available: boolean;
  // Inventory (only meaningful for internal)
  stockTotal: number;
  stockAvailable: number;
  location: string;
};

export type CartLine = {
  itemId: ID;
  quantity: number;
  days: number;
};

export type BookingStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'deposit' | 'paid' | 'refunded';

export type Booking = {
  reference: string;
  createdAt: string;
  type: 'reservation' | 'rental';
  customer: { name: string; email: string; phone: string };
  details: Record<string, unknown>;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  fulfillment: BookingStatus;
};

export type Branding = {
  brandName: string;
  tagline: string;
  primaryAccent: string;
};

export type AdminTab =
  | 'branding' | 'content' | 'hotels' | 'rooms' | 'halls'
  | 'packages' | 'rentals' | 'inventory' | 'bookings' | 'employees';

export type Role = {
  id: ID;
  name: string;
  tabs: AdminTab[];
};

export type Employee = {
  id: ID;
  name: string;
  email: string;
  password: string; // demo only
  roleId: ID;
};

export type InventoryMovement = {
  id: ID;
  itemId: ID;
  type: 'out' | 'in' | 'damaged' | 'restock';
  qty: number;
  note: string;
  reference?: string;
  at: string;
};

export type SiteContent = {
  hero: {
    eyebrow: string;
    title1: string;
    title2: string;
    title3: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  stats: { value: string; label: string }[];
  ticker: string[];
  reservations: { eyebrow: string; title: string };
  packagesSection: { eyebrow: string; title: string; copy: string };
  rentalsSection: { eyebrow: string; title: string };
  howItWorks: { title: string; eyebrow: string; steps: { title: string; copy: string }[] };
  footer: {
    blurb: string;
    contactEmail: string;
    contactPhone: string;
    contactCity: string;
    rightsLine: string;
  };
};
