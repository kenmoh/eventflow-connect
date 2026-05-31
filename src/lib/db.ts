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
  RentalCategory,
  SavedReceipt,
  Contact,
} from './types';

// TODO: Replace these stubs with Clerk metadata / server auth checks.
async function requireAdmin(): Promise<string | null> {
  return 'server';
}

async function requireOwner(): Promise<string | null> {
  return 'server';
}

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

export async function loadCatalog() {
  const [brandingRow, contentRow, hotelsRows, roomsRows, hallsRows, packagesRows, arrangementsRows, rentalsRows, faqsRows, bookingsRows, movementsRows, rolesRows, receiptsRows, contactsRows] = await Promise.all([
    getDb().query.branding.findFirst(),
    getDb().query.siteContent.findFirst(),
    getDb().select().from(hotels).orderBy(asc(hotels.name)).execute(),
    getDb().select().from(rooms).orderBy(asc(rooms.type)).execute(),
    getDb().select().from(halls).orderBy(asc(halls.name)).execute(),
    getDb().select().from(packages).orderBy(asc(packages.name)).execute(),
    getDb().select().from(seatArrangements).orderBy(asc(seatArrangements.name)).execute(),
    getDb().select().from(rentals).orderBy(asc(rentals.name)).execute(),
    getDb().select().from(faqs).orderBy(asc(faqs.order)).execute(),
    getDb().select().from(bookings).orderBy(desc(bookings.createdAt)).execute(),
    getDb().select().from(inventoryMovements).orderBy(desc(inventoryMovements.at)).execute(),
    getDb().select().from(roles).orderBy(asc(roles.name)).execute(),
    getDb().select().from(receipts).orderBy(desc(receipts.createdAt)).execute(),
    getDb().select().from(contacts).orderBy(desc(contacts.createdAt)).execute(),
  ]);

  return {
    branding: brandingRow
      ? {
          brandName: brandingRow.brandName,
          tagline: brandingRow.tagline,
          primaryAccent: brandingRow.primaryAccent,
        }
      : null,
    content: contentRow?.data ?? null,
    hotels: hotelsRows as Hotel[],
    rooms: roomsRows as Room[],
    halls: hallsRows as Hall[],
    packages: packagesRows as Pkg[],
    arrangements: arrangementsRows as SeatArrangement[],
    rentals: rentalsRows as RentalItem[],
    faqs: faqsRows as FAQ[],
    bookings: bookingsRows.map(mapBooking),
    movements: movementsRows.map(mapMovement),
    roles: rolesRows.map((r: any): Role => ({ id: r.id, name: r.name, tabs: (r.tabs ?? []) as AdminTab[] })),
    receipts: receiptsRows.map((r: any): SavedReceipt => ({
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
    contacts: contactsRows.map(mapContact),
  };
}

export async function saveBranding(b: Branding) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const existing = await getDb().query.branding.findFirst();
  const payload = { brandName: b.brandName, tagline: b.tagline, primaryAccent: b.primaryAccent };
  if (existing) {
    await getDb().update(branding).set(payload).where(eq(branding.id, existing.id));
  } else {
    await getDb().insert(branding).values(payload);
  }
}

export async function saveContent(c: SiteContent) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const existing = await getDb().query.siteContent.findFirst();
  if (existing) {
    await getDb().update(siteContent).set({ data: c as any }).where(eq(siteContent.id, existing.id));
  } else {
    await getDb().insert(siteContent).values({ data: c as any });
  }
}

type AnyTable = 'hotels' | 'rooms' | 'halls' | 'packages' | 'seat_arrangements' | 'rentals' | 'faqs';
async function del(table: AnyTable, id: string) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  switch (table) {
    case 'hotels': return getDb().delete(hotels).where(eq(hotels.id, id));
    case 'rooms': return getDb().delete(rooms).where(eq(rooms.id, id));
    case 'halls': return getDb().delete(halls).where(eq(halls.id, id));
    case 'packages': return getDb().delete(packages).where(eq(packages.id, id));
    case 'seat_arrangements': return getDb().delete(seatArrangements).where(eq(seatArrangements.id, id));
    case 'rentals': return getDb().delete(rentals).where(eq(rentals.id, id));
    case 'faqs': return getDb().delete(faqs).where(eq(faqs.id, id));
  }
}

export async function upsertHotel(h: Hotel) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const payload = {
    id: idOrNew(h.id),
    name: h.name,
    location: h.location,
    tagline: h.tagline,
    image: h.image,
    rating: h.rating,
    amenities: h.amenities,
  };
  await getDb().insert(hotels).values(payload as any).onConflictDoUpdate({ target: hotels.id, set: payload });
}
export const deleteHotel = (id: string) => del('hotels', id);

export async function upsertRoom(r: Room) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const payload = { id: idOrNew(r.id), hotelId: r.hotelId, type: r.type, description: r.description, price: r.price, capacity: r.capacity, image: r.image };
  await getDb().insert(rooms).values(payload as any).onConflictDoUpdate({ target: rooms.id, set: payload });
}
export const deleteRoom = (id: string) => del('rooms', id);

export async function upsertHall(h: Hall) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const payload = { id: idOrNew(h.id), hotelId: h.hotelId, name: h.name, capacity: h.capacity, pricePerHour: h.pricePerHour, image: h.image, amenities: h.amenities };
  await getDb().insert(halls).values(payload as any).onConflictDoUpdate({ target: halls.id, set: payload });
}
export const deleteHall = (id: string) => del('halls', id);

export async function upsertPackage(p: Pkg) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const payload = { id: idOrNew(p.id), hotelId: p.hotelId, kind: p.kind, name: p.name, description: p.description, items: p.items, pricePerPerson: p.pricePerPerson, timeSlots: p.timeSlots as any };
  await getDb().insert(packages).values(payload as any).onConflictDoUpdate({ target: packages.id, set: payload });
}
export const deletePackage = (id: string) => del('packages', id);

export async function upsertArrangement(a: SeatArrangement) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const payload = { id: idOrNew(a.id), name: a.name, description: a.description, image: a.image };
  await getDb().insert(seatArrangements).values(payload as any).onConflictDoUpdate({ target: seatArrangements.id, set: payload });
}
export const deleteArrangement = (id: string) => del('seat_arrangements', id);

export async function upsertRental(r: RentalItem) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const payload = { id: idOrNew(r.id), name: r.name, category: r.category, pricePerDay: r.pricePerDay, ownership: r.ownership, depositPct: r.depositPct, image: r.image, description: r.description, available: r.available, stockTotal: r.stockTotal, stockAvailable: r.stockAvailable, location: r.location };
  await getDb().insert(rentals).values(payload as any).onConflictDoUpdate({ target: rentals.id, set: payload });
}
export const deleteRental = (id: string) => del('rentals', id);

export async function upsertFaq(f: FAQ) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  const payload = { id: idOrNew(f.id), question: f.question, answer: f.answer, order: f.order, published: f.published };
  await getDb().insert(faqs).values(payload as any).onConflictDoUpdate({ target: faqs.id, set: payload });
}
export const deleteFaq = (id: string) => del('faqs', id);

export async function insertBooking(b: Booking) {
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

export async function updateBookingDb(ref: string, patch: Partial<Booking>) {
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

export async function lookupBookings(query: string): Promise<Booking[]> {
  const rows = query.includes('@')
    ? await getDb().select().from(bookings).where(eq(bookings.customerEmail, query)).orderBy(desc(bookings.createdAt)).execute()
    : await getDb().select().from(bookings).where(eq(bookings.reference, query)).orderBy(desc(bookings.createdAt)).execute();
  return rows.map(mapBooking);
}

export async function lookupCustomer(email: string): Promise<{ name: string; email: string; phone: string } | null> {
  const rows = await getDb().select().from(bookings).where(eq(bookings.customerEmail, email)).limit(1).execute();
  const row = rows[0];
  if (!row) return null;
  return { name: row.customerName, email: row.customerEmail, phone: row.customerPhone };
}

export async function insertMovement(m: InventoryMovement) {
  await getDb().insert(inventoryMovements).values({ itemId: m.itemId, type: m.type, qty: m.qty, note: m.note, reference: m.reference ?? null, location: m.location ?? null, handledBy: m.handledBy ?? null } as any);
}

export async function adjustStock(itemId: string, newAvailable: number) {
  await getDb().update(rentals).set({ stockAvailable: newAvailable }).where(eq(rentals.id, itemId));
}

export async function upsertRole(r: Role) {
  if (!await requireOwner()) throw new Error('Only the owner can manage roles');
  const payload = { id: idOrNew(r.id), name: r.name, tabs: r.tabs as any };
  await getDb().insert(roles).values(payload as any).onConflictDoUpdate({ target: roles.id, set: payload });
}

export const deleteRole = async (id: string) => {
  if (!await requireOwner()) throw new Error('Only the owner can delete roles');
  return getDb().delete(roles).where(eq(roles.id, id));
};

export async function loadEmployees(): Promise<Omit<Employee, 'password'>[]> {
  const data = await getDb().select().from(profiles).orderBy(asc(profiles.name)).execute();
  return data.map((p: any): Omit<Employee, 'password'> => ({
    id: p.id,
    name: p.name,
    email: p.email,
    roleId: p.roleId ?? '',
  }));
}

export async function setEmployeeRole(userId: string, roleId: string | null) {
  await getDb().update(profiles).set({ roleId: roleId || null }).where(eq(profiles.id, userId));
}

export async function loadReceipts(): Promise<SavedReceipt[]> {
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

export async function insertReceipt(r: SavedReceipt) {
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

export async function deleteReceipt(id: string) {
  if (!await requireAdmin()) throw new Error('Unauthorized');
  await getDb().delete(receipts).where(eq(receipts.id, id));
}

export async function insertContact(c: Omit<Contact, 'id' | 'createdAt'>) {
  await getDb().insert(contacts).values({ name: c.name, email: c.email, phone: c.phone || null, subject: c.subject, message: c.message } as any);
}

export async function deleteContact(id: string) {
  if (!await requireOwner()) throw new Error('Only the owner can delete contacts');
  await getDb().delete(contacts).where(eq(contacts.id, id));
}
