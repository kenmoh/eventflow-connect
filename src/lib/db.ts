import { supabase } from '@/integrations/supabase/client';
import type {
  Hotel, Room, Hall, Pkg, RentalItem, Booking, BookingLine, Branding,
  Employee, Role, InventoryMovement, SiteContent,
  SeatArrangement, FAQ, AdminTab, RentalCategory, SavedReceipt,
} from './types';

// ---------- mappers ----------
const mapHotel = (r: any): Hotel => ({ id: r.id, name: r.name, location: r.location, tagline: r.tagline ?? '', image: r.image ?? '', rating: Number(r.rating ?? 5), amenities: r.amenities ?? [] });
const mapRoom = (r: any): Room => ({ id: r.id, hotelId: r.hotel_id, type: r.type, description: r.description ?? '', price: Number(r.price), capacity: r.capacity, image: r.image ?? '' });
const mapHall = (r: any): Hall => ({ id: r.id, hotelId: r.hotel_id, name: r.name, capacity: r.capacity, pricePerHour: Number(r.price_per_hour), image: r.image ?? '', amenities: r.amenities ?? [] });
const mapPkg = (r: any): Pkg => ({ id: r.id, hotelId: r.hotel_id, kind: r.kind, name: r.name, description: r.description ?? '', items: r.items ?? [], pricePerPerson: Number(r.price_per_person), timeSlots: (r.time_slots ?? []) as Pkg['timeSlots'] });
const mapArr = (r: any): SeatArrangement => ({ id: r.id, name: r.name, description: r.description ?? '', image: r.image ?? '' });
const mapRental = (r: any): RentalItem => ({ id: r.id, name: r.name, category: r.category as RentalCategory, pricePerDay: Number(r.price_per_day), ownership: r.ownership, depositPct: r.deposit_pct, image: r.image ?? '', description: r.description ?? '', available: r.available, stockTotal: r.stock_total, stockAvailable: r.stock_available, location: r.location ?? '' });
const mapMovement = (r: any): InventoryMovement => ({ id: r.id, itemId: r.item_id, type: r.type, qty: r.qty, note: r.note ?? '', reference: r.reference ?? undefined, location: r.location ?? undefined, handledBy: r.handled_by ?? undefined, at: r.at });
const mapFaq = (r: any): FAQ => ({ id: r.id, question: r.question, answer: r.answer, order: r.order, published: r.published });
const mapBranding = (r: any): Branding => ({ brandName: r.brand_name, tagline: r.tagline, primaryAccent: r.primary_accent });
const mapBooking = (r: any): Booking => ({
  reference: r.reference,
  createdAt: r.created_at,
  type: r.type,
  customer: { name: r.customer_name, email: r.customer_email, phone: r.customer_phone },
  lines: r.lines as BookingLine[] | undefined,
  details: r.details ?? {},
  total: Number(r.total), amountPaid: Number(r.amount_paid), balanceDue: Number(r.balance_due),
  paymentStatus: r.payment_status, fulfillment: r.fulfillment,
});

// ---------- bulk loader ----------
export async function loadCatalog() {
  const [branding, content, hotels, rooms, halls, packages, arrangements, rentals, faqs, bookings, movements, roles, receipts] = await Promise.all([
    supabase.from('branding').select('*').limit(1).maybeSingle(),
    supabase.from('site_content').select('data').limit(1).maybeSingle(),
    supabase.from('hotels').select('*').order('name'),
    supabase.from('rooms').select('*').order('type'),
    supabase.from('halls').select('*').order('name'),
    supabase.from('packages').select('*').order('name'),
    supabase.from('seat_arrangements').select('*').order('name'),
    supabase.from('rentals').select('*').order('name'),
    supabase.from('faqs').select('*').order('order'),
    supabase.from('bookings').select('*').order('created_at', { ascending: false }),
    supabase.from('inventory_movements').select('*').order('at', { ascending: false }),
    supabase.from('roles').select('*').order('name'),
    supabase.from('receipts').select('*').order('created_at', { ascending: false }),
  ]);
  return {
    branding: branding.data ? mapBranding(branding.data) : null,
    content: (content.data?.data ?? null) as SiteContent | null,
    hotels: (hotels.data ?? []).map(mapHotel),
    rooms: (rooms.data ?? []).map(mapRoom),
    halls: (halls.data ?? []).map(mapHall),
    packages: (packages.data ?? []).map(mapPkg),
    arrangements: (arrangements.data ?? []).map(mapArr),
    rentals: (rentals.data ?? []).map(mapRental),
    faqs: (faqs.data ?? []).map(mapFaq),
    bookings: (bookings.data ?? []).map(mapBooking),
    movements: (movements.data ?? []).map(mapMovement),
    roles: (roles.data ?? []).map((r: any): Role => ({ id: r.id, name: r.name, tabs: (r.tabs ?? []) as AdminTab[] })),
    receipts: (receipts.data ?? []).map((r: any): SavedReceipt => ({
      id: r.id,
      docType: r.doc_type,
      clientName: r.client_name,
      clientEmail: r.client_email,
      clientPhone: r.client_phone,
      clientAddress: r.client_address,
      items: r.items ?? [],
      notes: r.notes ?? '',
      total: Number(r.total),
      createdAt: r.created_at,
    })),
  };
}

// ---------- single-row tables ----------
export async function saveBranding(b: Branding) {
  const { data: existing } = await supabase.from('branding').select('id').limit(1).maybeSingle();
  const payload = { brand_name: b.brandName, tagline: b.tagline, primary_accent: b.primaryAccent };
  if (existing) await supabase.from('branding').update(payload).eq('id', existing.id);
  else await supabase.from('branding').insert(payload);
}
export async function saveContent(c: SiteContent) {
  const { data: existing } = await supabase.from('site_content').select('id').limit(1).maybeSingle();
  if (existing) await supabase.from('site_content').update({ data: c as any }).eq('id', existing.id);
  else await supabase.from('site_content').insert({ data: c as any });
}

// ---------- catalog CRUD ----------
type AnyTable = 'hotels' | 'rooms' | 'halls' | 'packages' | 'seat_arrangements' | 'rentals' | 'faqs';
async function del(table: AnyTable, id: string) { await supabase.from(table).delete().eq('id', id); }

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const idOrNew = (id: string) => isUuid(id) ? id : undefined;

export async function upsertHotel(h: Hotel) {
  const payload = { id: idOrNew(h.id), name: h.name, location: h.location, tagline: h.tagline, image: h.image, rating: h.rating, amenities: h.amenities };
  await supabase.from('hotels').upsert(payload as any);
}
export const deleteHotel = (id: string) => del('hotels', id);

export async function upsertRoom(r: Room) {
  await supabase.from('rooms').upsert({ id: idOrNew(r.id), hotel_id: r.hotelId, type: r.type, description: r.description, price: r.price, capacity: r.capacity, image: r.image } as any);
}
export const deleteRoom = (id: string) => del('rooms', id);

export async function upsertHall(h: Hall) {
  await supabase.from('halls').upsert({ id: idOrNew(h.id), hotel_id: h.hotelId, name: h.name, capacity: h.capacity, price_per_hour: h.pricePerHour, image: h.image, amenities: h.amenities } as any);
}
export const deleteHall = (id: string) => del('halls', id);

export async function upsertPackage(p: Pkg) {
  await supabase.from('packages').upsert({ id: idOrNew(p.id), hotel_id: p.hotelId, kind: p.kind, name: p.name, description: p.description, items: p.items, price_per_person: p.pricePerPerson, time_slots: p.timeSlots as any } as any);
}
export const deletePackage = (id: string) => del('packages', id);

export async function upsertArrangement(a: SeatArrangement) {
  await supabase.from('seat_arrangements').upsert({ id: idOrNew(a.id), name: a.name, description: a.description, image: a.image } as any);
}
export const deleteArrangement = (id: string) => del('seat_arrangements', id);

export async function upsertRental(r: RentalItem) {
  await supabase.from('rentals').upsert({ id: idOrNew(r.id), name: r.name, category: r.category, price_per_day: r.pricePerDay, ownership: r.ownership, deposit_pct: r.depositPct, image: r.image, description: r.description, available: r.available, stock_total: r.stockTotal, stock_available: r.stockAvailable, location: r.location } as any);
}
export const deleteRental = (id: string) => del('rentals', id);

export async function upsertFaq(f: FAQ) {
  await supabase.from('faqs').upsert({ id: idOrNew(f.id), question: f.question, answer: f.answer, order: f.order, published: f.published } as any);
}
export const deleteFaq = (id: string) => del('faqs', id);

// ---------- bookings ----------
export async function insertBooking(b: Booking) {
  await supabase.from('bookings').insert({
    reference: b.reference,
    type: b.type,
    customer_name: b.customer.name,
    customer_email: b.customer.email,
    customer_phone: b.customer.phone,
    lines: (b.lines ?? []) as any,
    details: b.details as any,
    total: b.total, amount_paid: b.amountPaid, balance_due: b.balanceDue,
    payment_status: b.paymentStatus, fulfillment: b.fulfillment,
  } as any);
}
export async function updateBookingDb(ref: string, patch: Partial<Booking>) {
  const upd: any = {};
  if (patch.fulfillment) upd.fulfillment = patch.fulfillment;
  if (patch.paymentStatus) upd.payment_status = patch.paymentStatus;
  if (patch.amountPaid !== undefined) upd.amount_paid = patch.amountPaid;
  if (patch.balanceDue !== undefined) upd.balance_due = patch.balanceDue;
  await supabase.from('bookings').update(upd).eq('reference', ref);
}

// no-login lookup
export async function lookupBookings(query: string): Promise<Booking[]> {
  const { data, error } = await supabase.rpc('lookup_bookings', { _query: query });
  if (error) throw error;
  return (data ?? []).map(mapBooking);
}
export async function lookupCustomer(email: string): Promise<{ name: string; email: string; phone: string } | null> {
  const { data, error } = await supabase.rpc('lookup_customer', { _email: email });
  if (error) throw error;
  const row = (data ?? [])[0];
  return row ? { name: row.name, email: row.email, phone: row.phone } : null;
}

// ---------- inventory ----------
export async function insertMovement(m: InventoryMovement) {
  await supabase.from('inventory_movements').insert({
    item_id: m.itemId, type: m.type, qty: m.qty, note: m.note,
    reference: m.reference ?? null, location: m.location ?? null, handled_by: m.handledBy ?? null,
  } as any);
}
export async function adjustStock(itemId: string, newAvailable: number) {
  await supabase.from('rentals').update({ stock_available: newAvailable }).eq('id', itemId);
}

// ---------- roles & employees ----------
export async function upsertRole(r: Role) {
  await supabase.from('roles').upsert({ id: idOrNew(r.id), name: r.name, tabs: r.tabs as any } as any);
}
export const deleteRole = (id: string) => supabase.from('roles').delete().eq('id', id);

export async function loadEmployees(): Promise<Employee[]> {
  const { data } = await supabase.from('profiles').select('id, name, email, role_id').order('name');
  return (data ?? []).map((p: any): Employee => ({ id: p.id, name: p.name, email: p.email, password: '', roleId: p.role_id ?? '' }));
}
export async function setEmployeeRole(userId: string, roleId: string | null) {
  await supabase.from('profiles').update({ role_id: roleId || null }).eq('id', userId);
}

// ---------- storage ----------
export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}

// ---------- receipts ----------
export async function loadReceipts(): Promise<SavedReceipt[]> {
  const { data } = await supabase.from('receipts').select('*').order('created_at', { ascending: false });
  return (data ?? []).map((r: any): SavedReceipt => ({
    id: r.id,
    docType: r.doc_type,
    clientName: r.client_name,
    clientEmail: r.client_email,
    clientPhone: r.client_phone,
    clientAddress: r.client_address,
    items: r.items ?? [],
    notes: r.notes ?? '',
    total: Number(r.total),
    createdAt: r.created_at,
  }));
}

export async function insertReceipt(r: SavedReceipt) {
  await supabase.from('receipts').insert({
    id: r.id,
    doc_type: r.docType,
    client_name: r.clientName,
    client_email: r.clientEmail,
    client_phone: r.clientPhone,
    client_address: r.clientAddress,
    items: r.items,
    notes: r.notes,
    total: r.total,
  } as any);
}

export async function deleteReceipt(id: string) {
  await supabase.from('receipts').delete().eq('id', id);
}
