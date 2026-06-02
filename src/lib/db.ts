import { getDb } from '@/db/client';
import { asc, desc, eq } from 'drizzle-orm';
import { createServerFn } from '@tanstack/react-start';
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
  // TODO: Add actual auth check here
  return 'server';
}

async function requireOwner(): Promise<string | null> {
  // TODO: Add actual auth check here
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

// --- CORE LOGIC (Server-only) ---

export async function internal_loadCatalog() {
  try {
    const db = getDb();
    const [brandingRow, contentRow, hotelsRows, roomsRows, hallsRows, packagesRows, arrangementsRows, rentalsRows, faqsRows, bookingsRows, movementsRows, rolesRows, receiptsRows, contactsRows] = await Promise.all([
      db.query.branding.findFirst().catch(() => null),
      db.query.siteContent.findFirst().catch(() => null),
      db.select().from(hotels).orderBy(asc(hotels.name)).execute().catch(() => []),
      db.select().from(rooms).orderBy(asc(rooms.type)).execute().catch(() => []),
      db.select().from(halls).orderBy(asc(halls.name)).execute().catch(() => []),
      db.select().from(packages).orderBy(asc(packages.name)).execute().catch(() => []),
      db.select().from(seatArrangements).orderBy(asc(seatArrangements.name)).execute().catch(() => []),
      db.select().from(rentals).orderBy(asc(rentals.name)).execute().catch(() => []),
      db.select().from(faqs).orderBy(asc(faqs.order)).execute().catch(() => []),
      db.select().from(bookings).orderBy(desc(bookings.createdAt)).execute().catch(() => []),
      db.select().from(inventoryMovements).orderBy(desc(inventoryMovements.at)).execute().catch(() => []),
      db.select().from(roles).orderBy(asc(roles.name)).execute().catch(() => []),
      db.select().from(receipts).orderBy(desc(receipts.createdAt)).execute().catch(() => []),
      db.select().from(contacts).orderBy(desc(contacts.createdAt)).execute().catch(() => []),
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
  } catch (error: any) {
    console.error('[internal_loadCatalog] Fatal Error:', error);
    throw new Error(`Database error: ${error.message}`);
  }
}

export async function internal_loadEmployees(): Promise<Omit<Employee, 'password'>[]> {
  try {
    const db = getDb();
    const data = await db.select().from(profiles).orderBy(asc(profiles.name)).execute();
    return (data || []).map((p: any): Omit<Employee, 'password'> => ({
      id: p.id,
      name: p.name,
      email: p.email,
      roleId: p.roleId ?? '',
    }));
  } catch (error: any) {
    console.error('[internal_loadEmployees] Fatal Error:', error);
    throw new Error(`Database error: ${error.message}`);
  }
}

// --- SERVER FUNCTIONS (RPC Endpoints) ---

export const loadCatalog = createServerFn({ method: 'GET' })
  .handler(async () => {
    return internal_loadCatalog();
  });

export const saveBranding = createServerFn({ method: 'POST' })
  .validator((b: Branding) => b)
  .handler(async ({ data: b }) => {
    if (!await requireAdmin()) throw new Error('Unauthorized');
    const existing = await getDb().query.branding.findFirst();
    const payload = { brandName: b.brandName, tagline: b.tagline, primaryAccent: b.primaryAccent };
    if (existing) {
      await getDb().update(branding).set(payload).where(eq(branding.id, existing.id));
    } else {
      await getDb().insert(branding).values(payload);
    }
  });

export const saveContent = createServerFn({ method: 'POST' })
  .validator((c: SiteContent) => c)
  .handler(async ({ data: c }) => {
    if (!await requireAdmin()) throw new Error('Unauthorized');
    const existing = await getDb().query.siteContent.findFirst();
    if (existing) {
      await getDb().update(siteContent).set({ data: c as any }).where(eq(siteContent.id, existing.id));
    } else {
      await getDb().insert(siteContent).values({ data: c as any });
    }
  });

type AnyTable = 'hotels' | 'rooms' | 'halls' | 'packages' | 'seat_arrangements' | 'rentals' | 'faqs';
const internal_del = async (table: AnyTable, id: string) => {
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
};

const _deleteItem = createServerFn({ method: 'POST' })
  .validator((d: { table: AnyTable, id: string }) => d)
  .handler(async ({ data }) => {
    return internal_del(data.table, data.id);
  });

export const deleteHotel = (id: string) => _deleteItem({ data: { table: 'hotels', id } });
export const deleteRoom = (id: string) => _deleteItem({ data: { table: 'rooms', id } });
export const deleteHall = (id: string) => _deleteItem({ data: { table: 'halls', id } });
export const deletePackage = (id: string) => _deleteItem({ data: { table: 'packages', id } });
export const deleteArrangement = (id: string) => _deleteItem({ data: { table: 'seat_arrangements', id } });
export const deleteRental = (id: string) => _deleteItem({ data: { table: 'rentals', id } });
export const deleteFaq = (id: string) => _deleteItem({ data: { table: 'faqs', id } });

export const upsertHotel = createServerFn({ method: 'POST' })
  .validator((h: Hotel) => h)
  .handler(async ({ data: h }) => {
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
  });

export const upsertRoom = createServerFn({ method: 'POST' })
  .validator((r: Room) => r)
  .handler(async ({ data: r }) => {
    if (!await requireAdmin()) throw new Error('Unauthorized');
    const payload = { id: idOrNew(r.id), hotelId: r.hotelId, type: r.type, description: r.description, price: r.price, capacity: r.capacity, image: r.image };
    await getDb().insert(rooms).values(payload as any).onConflictDoUpdate({ target: rooms.id, set: payload });
  });

export const upsertHall = createServerFn({ method: 'POST' })
  .validator((h: Hall) => h)
  .handler(async ({ data: h }) => {
    if (!await requireAdmin()) throw new Error('Unauthorized');
    const payload = { id: idOrNew(h.id), hotelId: h.hotelId, name: h.name, capacity: h.capacity, pricePerHour: h.pricePerHour, image: h.image, amenities: h.amenities };
    await getDb().insert(halls).values(payload as any).onConflictDoUpdate({ target: halls.id, set: payload });
  });

export const upsertPackage = createServerFn({ method: 'POST' })
  .validator((p: Pkg) => p)
  .handler(async ({ data: p }) => {
    if (!await requireAdmin()) throw new Error('Unauthorized');
    const payload = { id: idOrNew(p.id), hotelId: p.hotelId, kind: p.kind, name: p.name, description: p.description, items: p.items, pricePerPerson: p.pricePerPerson, timeSlots: p.timeSlots as any };
    await getDb().insert(packages).values(payload as any).onConflictDoUpdate({ target: packages.id, set: payload });
  });

export const upsertArrangement = createServerFn({ method: 'POST' })
  .validator((a: SeatArrangement) => a)
  .handler(async ({ data: a }) => {
    if (!await requireAdmin()) throw new Error('Unauthorized');
    const payload = { id: idOrNew(a.id), name: a.name, description: a.description, image: a.image };
    await getDb().insert(seatArrangements).values(payload as any).onConflictDoUpdate({ target: seatArrangements.id, set: payload });
  });

export const upsertRental = createServerFn({ method: 'POST' })
  .validator((r: RentalItem) => r)
  .handler(async ({ data: r }) => {
    if (!await requireAdmin()) throw new Error('Unauthorized');
    const payload = { id: idOrNew(r.id), name: r.name, category: r.category, pricePerDay: r.pricePerDay, ownership: r.ownership, depositPct: r.depositPct, image: r.image, description: r.description, available: r.available, stockTotal: r.stockTotal, stockAvailable: r.stockAvailable, location: r.location };
    await getDb().insert(rentals).values(payload as any).onConflictDoUpdate({ target: rentals.id, set: payload });
  });

export const upsertFaq = createServerFn({ method: 'POST' })
  .validator((f: FAQ) => f)
  .handler(async ({ data: f }) => {
    if (!await requireAdmin()) throw new Error('Unauthorized');
    const payload = { id: idOrNew(f.id), question: f.question, answer: f.answer, order: f.order, published: f.published };
    await getDb().insert(faqs).values(payload as any).onConflictDoUpdate({ target: faqs.id, set: payload });
  });

export const insertBooking = createServerFn({ method: 'POST' })
  .validator((b: Booking) => b)
  .handler(async ({ data: b }) => {
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
  });

export const updateBookingDb = createServerFn({ method: 'POST' })
  .validator((d: { ref: string, patch: Partial<Booking> }) => d)
  .handler(async ({ data: { ref, patch } }) => {
    if (!await requireAdmin()) throw new Error('Unauthorized');
    const upd: any = {};
    if (patch.fulfillment) upd.fulfillment = patch.fulfillment;
    if (patch.paymentStatus) upd.paymentStatus = patch.paymentStatus;
    if (patch.amountPaid !== undefined) upd.amountPaid = patch.amountPaid;
    if (patch.balanceDue !== undefined) upd.balanceDue = patch.balanceDue;
    if (Object.keys(upd).length > 0) {
      await getDb().update(bookings).set(upd).where(eq(bookings.reference, ref));
    }
  });

export const lookupBookings = createServerFn({ method: 'GET' })
  .validator((query: string) => query)
  .handler(async ({ data: query }) => {
    const rows = query.includes('@')
      ? await getDb().select().from(bookings).where(eq(bookings.customerEmail, query)).orderBy(desc(bookings.createdAt)).execute()
      : await getDb().select().from(bookings).where(eq(bookings.reference, query)).orderBy(desc(bookings.createdAt)).execute();
    return rows.map(mapBooking);
  });

export const lookupCustomer = createServerFn({ method: 'GET' })
  .validator((email: string) => email)
  .handler(async ({ data: email }) => {
    const rows = await getDb().select().from(bookings).where(eq(bookings.customerEmail, email)).limit(1).execute();
    const row = rows[0];
    if (!row) return null;
    return { name: row.customerName, email: row.customerEmail, phone: row.customerPhone };
  });

export const insertMovement = createServerFn({ method: 'POST' })
  .validator((m: InventoryMovement) => m)
  .handler(async ({ data: m }) => {
    await getDb().insert(inventoryMovements).values({ itemId: m.itemId, type: m.type, qty: m.qty, note: m.note, reference: m.reference ?? null, location: m.location ?? null, handledBy: m.handledBy ?? null } as any);
  });

export const adjustStock = createServerFn({ method: 'POST' })
  .validator((d: { itemId: string, newAvailable: number }) => d)
  .handler(async ({ data: { itemId, newAvailable } }) => {
    await getDb().update(rentals).set({ stockAvailable: newAvailable }).where(eq(rentals.id, itemId));
  });

export const upsertRole = createServerFn({ method: 'POST' })
  .validator((r: Role) => r)
  .handler(async ({ data: r }) => {
    if (!await requireOwner()) throw new Error('Only the owner can manage roles');
    const payload = { id: idOrNew(r.id), name: r.name, tabs: r.tabs as any };
    await getDb().insert(roles).values(payload as any).onConflictDoUpdate({ target: roles.id, set: payload });
  });

export const deleteRole = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    if (!await requireOwner()) throw new Error('Only the owner can delete roles');
    return getDb().delete(roles).where(eq(roles.id, id));
  });

export const loadEmployees = createServerFn({ method: 'GET' })
  .handler(async () => {
    return internal_loadEmployees();
  });

export const setEmployeeRole = createServerFn({ method: 'POST' })
  .validator((d: { userId: string, roleId: string | null }) => d)
  .handler(async ({ data: { userId, roleId } }) => {
    await getDb().update(profiles).set({ roleId: roleId || null }).where(eq(profiles.id, userId));
  });

export const loadReceipts = createServerFn({ method: 'GET' })
  .handler(async () => {
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
  });

export const insertReceipt = createServerFn({ method: 'POST' })
  .validator((r: SavedReceipt) => r)
  .handler(async ({ data: r }) => {
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
  });

export const deleteReceipt = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    if (!await requireAdmin()) throw new Error('Unauthorized');
    await getDb().delete(receipts).where(eq(receipts.id, id));
  });

export const insertContact = createServerFn({ method: 'POST' })
  .validator((c: Omit<Contact, 'id' | 'createdAt'>) => c)
  .handler(async ({ data: c }) => {
    await getDb().insert(contacts).values({ name: c.name, email: c.email, phone: c.phone || null, subject: c.subject, message: c.message } as any);
  });

export const deleteContact = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    if (!await requireOwner()) throw new Error('Only the owner can delete contacts');
    await getDb().delete(contacts).where(eq(contacts.id, id));
  });
