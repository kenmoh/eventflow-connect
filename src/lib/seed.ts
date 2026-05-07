import type {
  Hotel, Room, Hall, Pkg, RentalItem, Branding,
  Role, Employee, SiteContent, Booking, InventoryMovement,
} from './types';
import heroBallroom from '@/assets/hero-ballroom.jpg';
import heroRentals from '@/assets/hero-rentals.jpg';

export const seedBranding: Branding = {
  brandName: 'All Brothers Consult',
  tagline: 'A new way to convene.',
  primaryAccent: '38 60% 56%',
};

export const seedContent: SiteContent = {
  hero: {
    eyebrow: 'A consultancy · Reservations & rentals',
    title1: 'Book events.',
    title2: 'Rent what you need.',
    title3: 'Pay no mind to the rest.',
    description:
      "All Brothers Consult is the quiet middleman between you, Nigeria's most considered hotels, and a roster of trusted event vendors. No accounts. No friction. A booking in three minutes.",
    primaryCta: 'Browse hotels',
    secondaryCta: 'Rent equipment',
  },
  stats: [
    { value: '06', label: 'Cities' },
    { value: '+40', label: 'Partner hotels' },
    { value: '+120', label: 'Rental items' },
    { value: '00:03', label: 'Avg. checkout' },
  ],
  ticker: ['Reservations', 'Boardrooms', 'Ballrooms', 'Sound', 'Lighting', 'Decor', 'No login required'],
  reservations: { eyebrow: '01 — Reservations', title: 'Hotels, halls and quiet boardrooms.' },
  packagesSection: {
    eyebrow: '02 — Packages',
    title: 'Three meeting moods. No menus.',
    copy: 'We replaced long F&B menus with three considered packages, priced per person. Choose, confirm, done.',
  },
  rentalsSection: { eyebrow: '03 — Rentals', title: 'Sound, lighting, seating — ready to roll.' },
  howItWorks: {
    eyebrow: '04 — How it works',
    title: 'Three minutes. No sign-up. Tracked by email.',
    steps: [
      { title: 'Choose', copy: 'Pick a hotel, a hall or a rental cart.' },
      { title: 'Pay', copy: 'Deposit or full — split intelligently between us and our partners.' },
      { title: 'Track', copy: 'Use your email or booking reference. That is the whole flow.' },
    ],
  },
  footer: {
    blurb: "A consultancy connecting clients to Nigeria's most considered hotels and event partners.",
    contactEmail: 'hello@allbrothersconsult.ng',
    contactPhone: '+234 803 000 0000',
    contactCity: 'Lagos · Abuja · Port Harcourt',
    rightsLine: 'No accounts. Just bookings.',
  },
};

export const seedHotels: Hotel[] = [
  { id: 'h1', name: 'The Marigold', location: 'Lagos', tagline: 'Coastal luxury, quiet luxury.', rating: 4.9, image: heroBallroom, amenities: ['Spa', 'Rooftop', 'Conference', 'Valet'] },
  { id: 'h2', name: 'Hotel Solène', location: 'Abuja', tagline: 'A modern atelier of hospitality.', rating: 4.8, image: heroBallroom, amenities: ['Pool', 'Bar', 'Ballroom'] },
  { id: 'h3', name: 'Maison Indigo', location: 'Port Harcourt', tagline: 'Where the river meets the salon.', rating: 4.7, image: heroBallroom, amenities: ['Garden', 'Conference', 'Spa'] },
];

export const seedRooms: Room[] = [
  { id: 'r1', hotelId: 'h1', type: 'Atelier King', description: 'Soft linens, marble bath, ocean glimpse.', price: 185000, capacity: 2, image: heroBallroom },
  { id: 'r2', hotelId: 'h1', type: 'Marigold Suite', description: 'Two-room suite with private terrace.', price: 420000, capacity: 3, image: heroBallroom },
  { id: 'r3', hotelId: 'h2', type: 'Solène Deluxe', description: 'Brass details, deep tubs, city view.', price: 165000, capacity: 2, image: heroBallroom },
  { id: 'r4', hotelId: 'h3', type: 'Indigo Garden Room', description: 'Opens onto a private courtyard.', price: 140000, capacity: 2, image: heroBallroom },
];

export const seedHalls: Hall[] = [
  { id: 'hl1', hotelId: 'h1', name: 'The Conservatory', capacity: 180, pricePerHour: 120000, image: heroBallroom },
  { id: 'hl2', hotelId: 'h1', name: 'Boardroom No. 4', capacity: 14, pricePerHour: 55000, image: heroBallroom },
  { id: 'hl3', hotelId: 'h2', name: 'Salon Doré', capacity: 60, pricePerHour: 80000, image: heroBallroom },
];

export const seedPackages: Pkg[] = [
  { id: 'p1', name: 'Morning Star', description: 'A quiet coffee break to begin the day.',
    items: ['Single-origin coffee', 'Loose-leaf teas', 'Fresh pastries', 'Seasonal fruit'], pricePerPerson: 12000 },
  { id: 'p2', name: 'Executive Boost', description: 'Coffee, savouries and a sharper afternoon.',
    items: ['Espresso bar', 'Charcuterie & cheese', 'Mini sandwiches', 'Sparkling water'], pricePerPerson: 22000 },
  { id: 'p3', name: 'Premium Boardroom', description: 'A full-day boardroom experience.',
    items: ['All-day coffee', 'Plated lunch', 'Petit fours', 'Still & sparkling'], pricePerPerson: 48000 },
];

export const seedRentals: RentalItem[] = [
  { id: 'rt1', name: 'Line Array Sound System', category: 'Sound', pricePerDay: 280000, ownership: 'internal', depositPct: 100, image: heroRentals, description: 'Studio-grade sound for up to 600 guests.', available: true, stockTotal: 4, stockAvailable: 3, location: 'Warehouse A · Bay 1' },
  { id: 'rt2', name: 'Wireless Microphone Set', category: 'Sound', pricePerDay: 55000, ownership: 'internal', depositPct: 100, image: heroRentals, description: 'Four channels of crystal-clear vocal.', available: true, stockTotal: 12, stockAvailable: 9, location: 'Warehouse A · Shelf 3' },
  { id: 'rt3', name: 'Chiavari Chair (Gold)', category: 'Seating', pricePerDay: 3500, ownership: 'vendor', depositPct: 70, image: heroRentals, description: 'Classic gold ballroom chair.', available: true, stockTotal: 0, stockAvailable: 0, location: 'Vendor: Royal Seats Ltd' },
  { id: 'rt4', name: 'Architectural Uplighting', category: 'Lighting', pricePerDay: 130000, ownership: 'vendor', depositPct: 60, image: heroRentals, description: 'Wash any room in your brand colour.', available: true, stockTotal: 0, stockAvailable: 0, location: 'Vendor: LumenWorks' },
  { id: 'rt5', name: 'Stretch Tent (Large)', category: 'Tents', pricePerDay: 480000, ownership: 'vendor', depositPct: 65, image: heroRentals, description: 'Sculptural shelter for 200 guests.', available: true, stockTotal: 0, stockAvailable: 0, location: 'Vendor: Atlas Tents' },
  { id: 'rt6', name: 'Floral Centerpiece', category: 'Decor', pricePerDay: 28000, ownership: 'vendor', depositPct: 70, image: heroRentals, description: 'Seasonal arrangement, table-ready.', available: true, stockTotal: 0, stockAvailable: 0, location: 'Vendor: Botanique' },
  { id: 'rt7', name: 'Round Banquet Table', category: 'Seating', pricePerDay: 7500, ownership: 'internal', depositPct: 100, image: heroRentals, description: 'Seats 10. Linen-ready.', available: true, stockTotal: 30, stockAvailable: 22, location: 'Warehouse B · Rack 2' },
];

export const seedRoles: Role[] = [
  { id: 'role-admin', name: 'Owner', tabs: ['branding','content','hotels','rooms','halls','packages','rentals','inventory','bookings','employees'] },
  { id: 'role-ops', name: 'Operations', tabs: ['bookings','inventory','rentals'] },
  { id: 'role-cms', name: 'Content Editor', tabs: ['content','hotels','rooms','halls','packages'] },
];

export const seedEmployees: Employee[] = [
  { id: 'emp-1', name: 'Owner', email: 'owner@allbrothersconsult.ng', password: 'admin123', roleId: 'role-admin' },
];

export const seedMovements: InventoryMovement[] = [
  { id: 'm1', itemId: 'rt1', type: 'out', qty: 1, note: 'Sent to wedding event', reference: 'ABC-DEMO-0001', at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'm2', itemId: 'rt2', type: 'out', qty: 3, note: 'Conference deployment', reference: 'ABC-DEMO-0002', at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'm3', itemId: 'rt7', type: 'restock', qty: 5, note: 'Returned from event, cleaned', at: new Date(Date.now() - 86400000 * 3).toISOString() },
];

export const seedBookings: Booking[] = [
  {
    reference: 'ABC-DEMO-0001',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    type: 'reservation',
    customer: { name: 'Adaeze Okoro', email: 'adaeze@example.com', phone: '+234 803 111 2222' },
    details: { hotel: 'The Marigold', hall: 'The Conservatory', package: 'Premium Boardroom', people: 80, date: '2026-06-12' },
    total: 4320000, amountPaid: 2160000, balanceDue: 2160000, paymentStatus: 'deposit', fulfillment: 'confirmed',
  },
  {
    reference: 'ABC-DEMO-0002',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    type: 'rental',
    customer: { name: 'Tunde Bello', email: 'tunde@example.com', phone: '+234 802 333 4444' },
    details: { items: [{ name: 'Wireless Microphone Set', qty: 3, days: 2 }, { name: 'Architectural Uplighting', qty: 4, days: 2 }], date: '2026-05-30', address: 'Eko Hotel, Victoria Island' },
    total: 1370000, amountPaid: 891000, balanceDue: 479000, paymentStatus: 'deposit', fulfillment: 'processing',
  },
  {
    reference: 'ABC-DEMO-0003',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    type: 'reservation',
    customer: { name: 'Adaeze Okoro', email: 'adaeze@example.com', phone: '+234 803 111 2222' },
    details: { hotel: 'Hotel Solène', room: 'Solène Deluxe', date: '2026-04-02', nights: 2 },
    total: 330000, amountPaid: 330000, balanceDue: 0, paymentStatus: 'paid', fulfillment: 'completed',
  },
];
