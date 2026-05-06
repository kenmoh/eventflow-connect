import type { Hotel, Room, Hall, Pkg, RentalItem, Branding } from './types';
import heroBallroom from '@/assets/hero-ballroom.jpg';
import heroRentals from '@/assets/hero-rentals.jpg';

export const seedBranding: Branding = {
  brandName: 'Sela',
  tagline: 'A new way to convene.',
  primaryAccent: '38 55% 52%',
};

export const seedHotels: Hotel[] = [
  {
    id: 'h1', name: 'The Marigold', location: 'Lagos, Nigeria',
    tagline: 'Coastal luxury, quiet luxury.', rating: 4.9,
    image: heroBallroom,
    amenities: ['Spa', 'Rooftop', 'Conference', 'Valet'],
  },
  {
    id: 'h2', name: 'Hotel Solène', location: 'Accra, Ghana',
    tagline: 'A modern atelier of hospitality.', rating: 4.8,
    image: heroBallroom,
    amenities: ['Pool', 'Bar', 'Ballroom'],
  },
  {
    id: 'h3', name: 'Maison Indigo', location: 'Nairobi, Kenya',
    tagline: 'Where the savannah meets the salon.', rating: 4.7,
    image: heroBallroom,
    amenities: ['Garden', 'Conference', 'Spa'],
  },
];

export const seedRooms: Room[] = [
  { id: 'r1', hotelId: 'h1', type: 'Atelier King', description: 'Soft linens, marble bath, ocean glimpse.', price: 320, capacity: 2, image: heroBallroom },
  { id: 'r2', hotelId: 'h1', type: 'Marigold Suite', description: 'Two-room suite with private terrace.', price: 720, capacity: 3, image: heroBallroom },
  { id: 'r3', hotelId: 'h2', type: 'Solène Deluxe', description: 'Brass details, deep tubs, city view.', price: 280, capacity: 2, image: heroBallroom },
  { id: 'r4', hotelId: 'h3', type: 'Indigo Garden Room', description: 'Opens onto a private courtyard.', price: 240, capacity: 2, image: heroBallroom },
];

export const seedHalls: Hall[] = [
  { id: 'hl1', hotelId: 'h1', name: 'The Conservatory', capacity: 180, pricePerHour: 220, image: heroBallroom },
  { id: 'hl2', hotelId: 'h1', name: 'Boardroom No. 4', capacity: 14, pricePerHour: 90, image: heroBallroom },
  { id: 'hl3', hotelId: 'h2', name: 'Salon Doré', capacity: 60, pricePerHour: 140, image: heroBallroom },
];

export const seedPackages: Pkg[] = [
  { id: 'p1', name: 'Morning Star', emoji: '☀️', description: 'A quiet coffee break to begin the day.',
    items: ['Single-origin coffee', 'Loose-leaf teas', 'Fresh pastries', 'Seasonal fruit'], pricePerPerson: 18 },
  { id: 'p2', name: 'Executive Boost', emoji: '💼', description: 'Coffee, savouries and a sharper afternoon.',
    items: ['Espresso bar', 'Charcuterie & cheese', 'Mini sandwiches', 'Sparkling water'], pricePerPerson: 34 },
  { id: 'p3', name: 'Premium Boardroom', emoji: '👑', description: 'A full-day boardroom experience.',
    items: ['All-day coffee', 'Plated lunch', 'Petit fours', 'Still & sparkling'], pricePerPerson: 78 },
];

export const seedRentals: RentalItem[] = [
  { id: 'rt1', name: 'Line Array Sound System', category: 'Sound', pricePerDay: 480, ownership: 'internal', depositPct: 100, image: heroRentals, description: 'Studio-grade sound for up to 600 guests.', available: true },
  { id: 'rt2', name: 'Wireless Microphone Set', category: 'Sound', pricePerDay: 90, ownership: 'internal', depositPct: 100, image: heroRentals, description: 'Four channels of crystal-clear vocal.', available: true },
  { id: 'rt3', name: 'Chiavari Chair (Gold)', category: 'Seating', pricePerDay: 6, ownership: 'vendor', depositPct: 70, image: heroRentals, description: 'Classic gold ballroom chair.', available: true },
  { id: 'rt4', name: 'Architectural Uplighting', category: 'Lighting', pricePerDay: 220, ownership: 'vendor', depositPct: 60, image: heroRentals, description: 'Wash any room in your brand colour.', available: true },
  { id: 'rt5', name: 'Stretch Tent (Large)', category: 'Tents', pricePerDay: 850, ownership: 'vendor', depositPct: 65, image: heroRentals, description: 'Sculptural shelter for 200 guests.', available: true },
  { id: 'rt6', name: 'Floral Centerpiece', category: 'Decor', pricePerDay: 45, ownership: 'vendor', depositPct: 70, image: heroRentals, description: 'Seasonal arrangement, table-ready.', available: true },
];
