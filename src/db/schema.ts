import {
  pgTable,
  pgEnum,
  uuid,
  text,
  jsonb,
  timestamp,
  numeric,
  integer,
  boolean,
  uniqueIndex,
  index,
  primaryKey,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =========================================================
// ENUMS
// =========================================================
export const appRoleEnum = pgEnum('app_role', ['owner', 'admin', 'staff']);
export const packageKindEnum = pgEnum('package_kind', ['coffee', 'food']);
export const rentalOwnershipEnum = pgEnum('rental_ownership', ['internal', 'vendor']);
export const bookingTypeEnum = pgEnum('booking_type', ['reservation', 'rental']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'processing', 'completed', 'cancelled']);
export const paymentStatusEnum = pgEnum('payment_status', ['unpaid', 'deposit', 'paid', 'refunded']);
export const movementTypeEnum = pgEnum('movement_type', ['out', 'in', 'damaged', 'restock']);

// =========================================================
// ROLES + PROFILES + AUTH
// =========================================================
export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    tabs: text('tabs').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('roles_name_idx').on(t.name),
  ]
);

export const profiles = pgTable(
  'profiles',
  {
    id: text('id').primaryKey(), // Clerk user ID
    name: text('name').notNull(),
    email: text('email').notNull(),
    roleId: uuid('role_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('profiles_email_idx').on(t.email),
    foreignKey({
      columns: [t.roleId],
      foreignColumns: [roles.id],
      name: 'profiles_role_id_fk',
    }).onDelete('set null'),
  ]
);

export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(), // Clerk user ID
    role: appRoleEnum('role').notNull(),
  },
  (t) => [
    uniqueIndex('user_roles_user_id_role_idx').on(t.userId, t.role),
  ]
);

// =========================================================
// BRANDING + SITE CONTENT
// =========================================================
export const branding = pgTable('branding', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandName: text('brand_name').notNull(),
  tagline: text('tagline').notNull(),
  primaryAccent: text('primary_accent').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const siteContent = pgTable('site_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =========================================================
// CATALOG: HOTELS, ROOMS, HALLS, PACKAGES
// =========================================================
export const hotels = pgTable(
  'hotels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    location: text('location').notNull(),
    tagline: text('tagline').notNull().default(''),
    image: text('image').notNull().default(''),
    rating: numeric('rating', { precision: 2, scale: 1 }).notNull().default('5.0'),
    amenities: text('amenities').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('hotels_name_idx').on(t.name),
  ]
);

export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hotelId: uuid('hotel_id').notNull(),
    type: text('type').notNull(),
    description: text('description').notNull().default(''),
    price: numeric('price').notNull().default('0'),
    capacity: integer('capacity').notNull().default(1),
    image: text('image').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('rooms_hotel_id_idx').on(t.hotelId),
    foreignKey({
      columns: [t.hotelId],
      foreignColumns: [hotels.id],
      name: 'rooms_hotel_id_fk',
    }).onDelete('cascade'),
  ]
);

export const halls = pgTable(
  'halls',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hotelId: uuid('hotel_id').notNull(),
    name: text('name').notNull(),
    capacity: integer('capacity').notNull().default(1),
    pricePerHour: numeric('price_per_hour').notNull().default('0'),
    image: text('image').notNull().default(''),
    amenities: text('amenities').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('halls_hotel_id_idx').on(t.hotelId),
    foreignKey({
      columns: [t.hotelId],
      foreignColumns: [hotels.id],
      name: 'halls_hotel_id_fk',
    }).onDelete('cascade'),
  ]
);

export const packages = pgTable(
  'packages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hotelId: uuid('hotel_id').notNull(),
    kind: packageKindEnum('kind').notNull().default('coffee'),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    items: text('items').array().notNull().default([]),
    pricePerPerson: numeric('price_per_person').notNull().default('0'),
    timeSlots: jsonb('time_slots').notNull().default('[]'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('packages_hotel_id_idx').on(t.hotelId),
    foreignKey({
      columns: [t.hotelId],
      foreignColumns: [hotels.id],
      name: 'packages_hotel_id_fk',
    }).onDelete('cascade'),
  ]
);

export const seatArrangements = pgTable('seat_arrangements', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  image: text('image').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =========================================================
// RENTALS + INVENTORY
// =========================================================
export const rentals = pgTable(
  'rentals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    pricePerDay: numeric('price_per_day').notNull().default('0'),
    ownership: rentalOwnershipEnum('ownership').notNull().default('internal'),
    depositPct: integer('deposit_pct').notNull().default(100),
    image: text('image').notNull().default(''),
    description: text('description').notNull().default(''),
    available: boolean('available').notNull().default(true),
    stockTotal: integer('stock_total').notNull().default(0),
    stockAvailable: integer('stock_available').notNull().default(0),
    location: text('location').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('rentals_category_idx').on(t.category),
  ]
);

export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id').notNull(),
    type: movementTypeEnum('type').notNull(),
    qty: integer('qty').notNull(),
    note: text('note').notNull().default(''),
    reference: text('reference'),
    location: text('location'),
    handledBy: text('handled_by'),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('inventory_movements_item_id_idx').on(t.itemId),
    foreignKey({
      columns: [t.itemId],
      foreignColumns: [rentals.id],
      name: 'inventory_movements_item_id_fk',
    }).onDelete('cascade'),
  ]
);

// =========================================================
// CMS: FAQs
// =========================================================
export const faqs = pgTable('faqs', {
  id: uuid('id').primaryKey().defaultRandom(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  order: integer('order').notNull().default(0),
  published: boolean('published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =========================================================
// BOOKINGS
// =========================================================
export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reference: text('reference').notNull().unique(),
    type: bookingTypeEnum('type').notNull(),
    customerName: text('customer_name').notNull(),
    customerEmail: text('customer_email').notNull(),
    customerPhone: text('customer_phone').notNull(),
    lines: jsonb('lines').notNull().default('[]'), // BookingLine[] items
    details: jsonb('details').notNull().default('{}'), // Additional order details
    total: numeric('total').notNull().default('0'),
    amountPaid: numeric('amount_paid').notNull().default('0'),
    balanceDue: numeric('balance_due').notNull().default('0'),
    paymentStatus: paymentStatusEnum('payment_status').notNull().default('unpaid'),
    fulfillment: bookingStatusEnum('fulfillment').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('bookings_reference_idx').on(t.reference),
    index('bookings_email_idx').on(t.customerEmail),
  ]
);

// =========================================================
// CONTACTS (from form submissions)
// =========================================================
export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull().default(''),
    subject: text('subject').notNull().default(''),
    message: text('message').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('contacts_email_idx').on(t.email),
  ]
);

// =========================================================
// RECEIPTS (saved invoices)
// =========================================================
export const receipts = pgTable(
  'receipts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('booking_id'),
    reference: text('reference').notNull().unique(),
    docType: text('doc_type').notNull().default('receipt'),
    customerName: text('customer_name').notNull(),
    customerEmail: text('customer_email').notNull(),
    customerPhone: text('customer_phone').notNull().default(''),
    customerAddress: text('customer_address').notNull().default(''),
    items: jsonb('items').notNull().default('[]'),
    notes: text('notes').notNull().default(''),
    total: numeric('total').notNull().default('0'),
    paid: numeric('paid').notNull().default('0'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('receipts_reference_idx').on(t.reference),
  ]
);

// =========================================================
// RELATIONS
// =========================================================
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  role: one(roles, {
    fields: [profiles.roleId],
    references: [roles.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  profiles: many(profiles),
}));

export const hotelsRelations = relations(hotels, ({ many }) => ({
  rooms: many(rooms),
  halls: many(halls),
  packages: many(packages),
}));

export const roomsRelations = relations(rooms, ({ one }) => ({
  hotel: one(hotels, {
    fields: [rooms.hotelId],
    references: [hotels.id],
  }),
}));

export const hallsRelations = relations(halls, ({ one }) => ({
  hotel: one(hotels, {
    fields: [halls.hotelId],
    references: [hotels.id],
  }),
}));

export const packagesRelations = relations(packages, ({ one }) => ({
  hotel: one(hotels, {
    fields: [packages.hotelId],
    references: [hotels.id],
  }),
}));

export const rentalsRelations = relations(rentals, ({ many }) => ({
  movements: many(inventoryMovements),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  item: one(rentals, {
    fields: [inventoryMovements.itemId],
    references: [rentals.id],
  }),
}));
