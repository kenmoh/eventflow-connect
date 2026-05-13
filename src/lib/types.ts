export type ID = string;

export type Theme = 'dark' | 'light';

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
  amenities: string[];
};

export type PackageKind = 'coffee' | 'food';

export type TimeSlot = { id: ID; label: string; time: string };

export type Pkg = {
  id: ID;
  hotelId: ID;
  kind: PackageKind;
  name: string;
  description: string;
  items: string[];
  pricePerPerson: number;
  timeSlots: TimeSlot[];
};

export type SeatArrangement = {
  id: ID;
  name: string;
  description: string;
  image: string;
};

export type RentalCategory = 'Sound' | 'Lighting' | 'Seating' | 'Tents' | 'Decor';

// `vendor` kept as the internal value for backwards compat — UI shows "Partner".
export type RentalOwnership = 'internal' | 'vendor';

export type RentalItem = {
  id: ID;
  name: string;
  category: RentalCategory;
  pricePerDay: number;
  ownership: RentalOwnership;
  depositPct: number;
  image: string;
  description: string;
  available: boolean;
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

export type BookingLine =
  | { kind: 'room'; name: string; nights: number; pricePerNight: number; subtotal: number }
  | { kind: 'hall'; name: string; days: number; pricePerDay: number; timeSlot?: string; seatArrangement?: string; subtotal: number }
  | { kind: 'package'; name: string; persons: number; pricePerPerson: number; timeSlot?: string; subtotal: number }
  | { kind: 'rental'; name: string; quantity: number; days: number; pricePerDay: number; ownership: RentalOwnership; subtotal: number };

export type Booking = {
  reference: string;
  createdAt: string;
  type: 'reservation' | 'rental';
  customer: { name: string; email: string; phone: string };
  /** Structured items for nice display. Optional (legacy bookings keep `details`). */
  lines?: BookingLine[];
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
  logo?: string;
};

export type AdminTab =
  | 'branding' | 'content' | 'hotels' | 'rooms' | 'halls'
  | 'packages' | 'arrangements' | 'rentals' | 'inventory'
  | 'bookings' | 'revenue' | 'faqs' | 'legal' | 'employees' | 'receipts';

export type Role = {
  id: ID;
  name: string;
  tabs: AdminTab[];
};

export type Employee = {
  id: ID;
  name: string;
  email: string;
  password: string;
  roleId: ID;
};

export type InventoryMovement = {
  id: ID;
  itemId: ID;
  type: 'out' | 'in' | 'damaged' | 'restock';
  qty: number;
  note: string;
  reference?: string;
  /** Where the items came back from (returns) or are going to (checkout). */
  location?: string;
  /** Employee name who handled the movement. */
  handledBy?: string;
  at: string;
};

export type FAQ = {
  id: ID;
  question: string;
  answer: string;
  order: number;
  published: boolean;
};

export type LegalPage = { title: string; updatedAt: string; body: string };

export type SavedReceipt = {
  id: string;
  docType: 'receipt' | 'quote' | 'invoice';
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  notes: string;
  total: number;
  createdAt: string;
};

export type SiteContent = {
  hero: {
    eyebrow: string; title1: string; title2: string; title3: string;
    description: string; primaryCta: string; secondaryCta: string;
  };
  stats: { value: string; label: string }[];
  ticker: string[];
  reservations: { eyebrow: string; title: string };
  packagesSection: { eyebrow: string; title: string; copy: string };
  rentalsSection: { eyebrow: string; title: string };
  howItWorks: { title: string; eyebrow: string; steps: { title: string; copy: string }[] };
  footer: {
    blurb: string; contactEmail: string; contactPhone: string;
    contactCity: string; rightsLine: string;
  };
  about: LegalPage;
  privacy: LegalPage;
  terms: LegalPage;
  refund: LegalPage;
};
