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
  price: number; // per night
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
  emoji: string;
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
  depositPct: number; // 100 internal, 60-70 vendor
  image: string;
  description: string;
  available: boolean;
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
  primaryAccent: string; // hsl values for --accent
};
