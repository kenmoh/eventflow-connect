import { getDb } from '@/db/client';
import { asc, desc, eq } from 'drizzle-orm';
import {
  bookings,
  branding,
  contacts,
  faqs,
  hotels,
  halls,
  inventoryMovements,
  packages,
  profiles,
  receipts,
  rentals,
  roles,
  rooms,
  seatArrangements,
  siteContent,
} from '@/db/schema';
import type {
  Hotel,
  Room,
  Hall,
  Pkg,
  RentalItem,
  Booking,
  BookingLine,
  Branding,
  Employee,
  Role,
  InventoryMovement,
  SiteContent,
  SeatArrangement,
  FAQ,
  AdminTab,
  SavedReceipt,
  Contact,
} from './types';

// --- Auth Helpers ---
async function requireAdmin(): Promise<string | null> {
  return 'server';
}

async function requireOwner(): Promise<string | null> {
  return 'server';
}

// --- Mappers & Helpers ---
const mapMovement = (r: any): InventoryMovement => ({
  id: r.id,
  itemId: r.itemId,
  type: r.type,
  qty: r.qty,
  note: r.note ?? '',
  reference: r.reference ?? undefined,
  location: r.location ?? undefined,
  handledBy: r.handledBy ?? undefined,
  at: r.at,
});

const mapContact = (r: any): Contact => ({
  id: r.id,
  name: r.name,
  email: r.email,
  phone: r.phone ?? '',
  subject: r.subject,
  message: r.message,
  createdAt: r.createdAt,
});

const mapBooking = (r: any): Booking => ({
  reference: r.reference,
  createdAt: r.createdAt,
  type: r.type,
  customer: { name: r.customerName, email: r.customerEmail, phone: r.customerPhone },
  lines: r.lines as BookingLine[] | undefined,
  details: r.details ?? {},
  total: Number(r.total),
  amountPaid: Number(r.amountPaid),
  balanceDue: Number(r.balanceDue),
  paymentStatus: r.paymentStatus,
  fulfillment: r.fulfillment,
});

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const idOrNew = (id: string) => isUuid(id) ? id : undefined;

// --- CORE LOGIC ---

export async function dbLoadCatalog() {
  try {
    const db = getDb();
    
    // Split into smaller batches or sequential to avoid overwhelming the serverless function/connection
    const brandingRow = await db.query.branding.findFirst().catch(() => null);
    const contentRow = await db.query.siteContent.findFirst().catch(() => null);
    const hotelsRows = await db.select().from(hotels).orderBy(asc(hotels.name)).execute().catch(() => []);
    const roomsRows = await db.select().from(rooms).orderBy(asc(rooms.type)).execute().catch(() => []);
    const hallsRows = await db.select().from(halls).orderBy(asc(halls.name)).execute().catch(() => []);
    const packagesRows = await db.select().from(packages).orderBy(asc(packages.name)).execute().catch(() => []);
    const arrangementsRows = await db.select().from(seatArrangements).orderBy(asc(seatArrangements.name)).execute().catch(() => []);
    const rentalsRows = await db.select().from(rentals).orderBy(asc(rentals.name)).execute().catch(() => []);
    const faqsRows = await db.select().from(faqs).orderBy(asc(faqs.order)).execute().catch(() => []);
    const bookingsRows = await db.select().from(bookings).orderBy(desc(bookings.createdAt)).execute().catch(() => []);
    const movementsRows = await db.select().from(inventoryMovements).orderBy(desc(inventoryMovements.at)).execute().catch(() => []);
    const rolesRows = await db.select().from(roles).orderBy(asc(roles.name)).execute().catch(() => []);
    const receiptsRows = await db.select().from(receipts).orderBy(desc(receipts.createdAt)).execute().catch(() => []);
    const contactsRows = await db.select().from(contacts).orderBy(desc(contacts.createdAt)).execute().catch(() => []);

    return {
    branding: brandingRow
      ? {
          brandName: brandingRow.brandName,
          tagline: brandingRow.tagline,
          primaryAccent: brandingRow.primaryAccent,
        }
      : null,
    content: contentRow?.data ?? null,
    hotels: (hotelsRows || []) as Hotel[],
    rooms: (roomsRows || []) as Room[],
    halls: (hallsRows || []) as Hall[],
    packages: (packagesRows || []) as Pkg[],
    arrangements: (arrangementsRows || []) as SeatArrangement[],
    rentals: (rentalsRows || []) as RentalItem[],
    faqs: (faqsRows || []) as FAQ[],
    bookings: (bookingsRows || []).map(mapBooking),
    movements: (movementsRows || []).map(mapMovement),
    roles: (rolesRows || []).map((r: any): Role => ({ id: r.id, name: r.name, tabs: (r.tabs ?? []) as AdminTab[] })),
    receipts: (receiptsRows || []).map((r: any): SavedReceipt => ({
      id: r.id,
      docType: r.docType ?? 'receipt',
      clientName: r.customerName ?? '',
      clientEmail: r.customerEmail ?? '',
      clientPhone: r.customerPhone ?? '',
      clientAddress: r.customerAddress ?? '',
      items: r.items ?? [],
      notes: r.notes ?? '',
      total: Number(r.total),
      createdAt: r.createdAt,
    })),
    contacts: (contactsRows || []).map(mapContact),
  };
}

export async function dbSaveBranding(b: Branding) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const db = getDb();
  const existing = await db.query.branding.findFirst();
  const payload = { brandName: b.brandName, tagline: b.tagline, primaryAccent: b.primaryAccent };
  if (existing) {
    await db.update(branding).set(payload).where(eq(branding.id, existing.id));
  } else {
    await db.insert(branding).values(payload);
  }
}

export async function dbSaveContent(c: SiteContent) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const db = getDb();
  const existing = await db.query.siteContent.findFirst();
  if (existing) {
    await db.update(siteContent).set({ data: c as any }).where(eq(siteContent.id, existing.id));
  } else {
    await db.insert(siteContent).values({ data: c as any });
  }
}

export async function dbDeleteItem(table: string, id: string) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const db = getDb();
  switch (table) {
    case 'hotels': return db.delete(hotels).where(eq(hotels.id, id));
    case 'rooms': return db.delete(rooms).where(eq(rooms.id, id));
    case 'halls': return db.delete(halls).where(eq(halls.id, id));
    case 'packages': return db.delete(packages).where(eq(packages.id, id));
    case 'seat_arrangements': return db.delete(seatArrangements).where(eq(seatArrangements.id, id));
    case 'rentals': return db.delete(rentals).where(eq(rentals.id, id));
    case 'faqs': return db.delete(faqs).where(eq(faqs.id, id));
    case 'receipts': return db.delete(receipts).where(eq(receipts.id, id));
    case 'contacts': return db.delete(contacts).where(eq(contacts.id, id));
  }
}

export async function dbUpsertHotel(h: Hotel) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const payload = { id: idOrNew(h.id), name: h.name, location: h.location, tagline: h.tagline, image: h.image, rating: h.rating, amenities: h.amenities };
  await getDb().insert(hotels).values(payload as any).onConflictDoUpdate({ target: hotels.id, set: payload });
}

export async function dbUpsertRoom(r: Room) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const payload = { id: idOrNew(r.id), hotelId: r.hotelId, type: r.type, description: r.description, price: r.price, capacity: r.capacity, image: r.image };
  await getDb().insert(rooms).values(payload as any).onConflictDoUpdate({ target: rooms.id, set: payload });
}

export async function dbUpsertHall(h: Hall) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const payload = { id: idOrNew(h.id), hotelId: h.hotelId, name: h.name, capacity: h.capacity, pricePerHour: h.pricePerHour, image: h.image, amenities: h.amenities };
  await getDb().insert(halls).values(payload as any).onConflictDoUpdate({ target: halls.id, set: payload });
}

export async function dbUpsertPackage(p: Pkg) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const payload = { id: idOrNew(p.id), hotelId: p.hotelId, kind: p.kind, name: p.name, description: p.description, items: p.items, pricePerPerson: p.pricePerPerson, timeSlots: p.timeSlots as any };
  await getDb().insert(packages).values(payload as any).onConflictDoUpdate({ target: packages.id, set: payload });
}

export async function dbUpsertArrangement(a: SeatArrangement) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const payload = { id: idOrNew(a.id), name: a.name, description: a.description, image: a.image };
  await getDb().insert(seatArrangements).values(payload as any).onConflictDoUpdate({ target: seatArrangements.id, set: payload });
}

export async function dbUpsertRental(r: RentalItem) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const payload = { id: idOrNew(r.id), name: r.name, category: r.category, pricePerDay: r.pricePerDay, ownership: r.ownership, depositPct: r.depositPct, image: r.image, description: r.description, available: r.available, stockTotal: r.stockTotal, stockAvailable: r.stockAvailable, location: r.location };
  await getDb().insert(rentals).values(payload as any).onConflictDoUpdate({ target: rentals.id, set: payload });
}

export async function dbUpsertFaq(f: FAQ) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const payload = { id: idOrNew(f.id), question: f.question, answer: f.answer, order: f.order, published: f.published };
  await getDb().insert(faqs).values(payload as any).onConflictDoUpdate({ target: faqs.id, set: payload });
}

export async function dbInsertBooking(b: Booking) {
  await getDb().insert(bookings).values({
    reference: b.reference,
    type: b.type,
    customerName: b.customer.name,
    customerEmail: b.customer.email,
    customerPhone: b.customer.phone,
    lines: (b.lines ?? []) as any,
    details: b.details as any,
    total: b.total,
    amountPaid: b.amountPaid,
    balanceDue: b.balanceDue,
    paymentStatus: b.paymentStatus,
    fulfillment: b.fulfillment,
  } as any);
}

export async function dbUpdateBooking(ref: string, patch: Partial<Booking>) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const upd: any = {};
  if (patch.fulfillment) upd.fulfillment = patch.fulfillment;
  if (patch.paymentStatus) upd.paymentStatus = patch.paymentStatus;
  if (patch.amountPaid !== undefined) upd.amountPaid = patch.amountPaid;
  if (patch.balanceDue !== undefined) upd.balanceDue = patch.balanceDue;
  if (Object.keys(upd).length > 0) {
    await getDb().update(bookings).set(upd).where(eq(bookings.reference, ref));
  }
}

export async function dbLookupBookings(query: string) {
  const db = getDb();
  const rows = query.includes('@')
    ? await db.select().from(bookings).where(eq(bookings.customerEmail, query)).orderBy(desc(bookings.createdAt)).execute()
    : await db.select().from(bookings).where(eq(bookings.reference, query)).orderBy(desc(bookings.createdAt)).execute();
  return rows.map(mapBooking);
}

export async function dbInsertMovement(m: InventoryMovement) {
  await getDb().insert(inventoryMovements).values({ itemId: m.itemId, type: m.type, qty: m.qty, note: m.note, reference: m.reference ?? null, location: m.location ?? null, handledBy: m.handledBy ?? null } as any);
}

export async function dbAdjustStock(itemId: string, newAvailable: number) {
  await getDb().update(rentals).set({ stockAvailable: newAvailable }).where(eq(rentals.id, itemId));
}

export async function dbUpsertRole(r: Role) {
  if (!await requireOwner()) throw new Error('Only the owner can manage roles');
  const payload = { id: r.id, name: r.name, tabs: r.tabs as any };
  await getDb().insert(roles).values(payload as any).onConflictDoUpdate({ target: roles.id, set: payload });
}

export async function dbDeleteRole(id: string) {
  if (!await requireOwner()) throw new Error('Only the owner can delete roles');
  return getDb().delete(roles).where(eq(roles.id, id));
}

export async function dbLoadEmployees() {
  try {
    const data = await getDb().select().from(profiles).orderBy(asc(profiles.name)).execute();
    return data.map((p: any): Omit<Employee, 'password'> => ({
      id: p.id,
      name: p.name,
      email: p.email,
      roleId: p.roleId ?? '',
    }));
  } catch (error: any) {
    console.error('[dbLoadEmployees] Error:', error);
    throw error;
  }
}

export async function dbLoadReceipts() {
  const data = await getDb().select().from(receipts).orderBy(desc(receipts.createdAt)).execute();
  return data.map((r: any): SavedReceipt => ({
    id: r.id,
    docType: r.docType ?? 'receipt',
    clientName: r.customerName ?? '',
    clientEmail: r.customerEmail ?? '',
    clientPhone: r.customerPhone ?? '',
    clientAddress: r.customerAddress ?? '',
    items: r.items ?? [],
    notes: r.notes ?? '',
    total: Number(r.total),
    createdAt: r.createdAt,
  }));
}

export async function dbSetEmployeeRole(userId: string, roleId: string | null) {
  await getDb().update(profiles).set({ roleId: roleId || null }).where(eq(profiles.id, userId));
}

export async function dbInsertReceipt(r: SavedReceipt) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  await getDb().insert(receipts).values({
    id: r.id,
    reference: r.id,
    docType: r.docType,
    customerName: r.clientName,
    customerEmail: r.clientEmail,
    customerPhone: r.clientPhone,
    customerAddress: r.clientAddress,
    items: r.items,
    notes: r.notes,
    total: r.total,
    paid: r.total,
  } as any);
}

export async function dbInsertContact(c: Omit<Contact, 'id' | 'createdAt'>) {
  await getDb().insert(contacts).values({ name: c.name, email: c.email, phone: c.phone || null, subject: c.subject, message: c.message } as any);
}
