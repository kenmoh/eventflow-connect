import { createServerFn } from '@tanstack/react-start';
import type {
  Hotel,
  Room,
  Hall,
  Pkg,
  RentalItem,
  Booking,
  Branding,
  Employee,
  Role,
  InventoryMovement,
  SiteContent,
  SeatArrangement,
  FAQ,
  SavedReceipt,
  Contact,
} from './types';

// --- INTERNAL SERVER FUNCTIONS (RPC Endpoints) ---

const _loadCatalog = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { dbLoadCatalog } = await import('./db.server');
    return dbLoadCatalog();
  });

const _saveBranding = createServerFn({ method: 'POST' })
  .inputValidator((b: Branding) => b)
  .handler(async ({ data: b }) => {
    const { dbSaveBranding } = await import('./db.server');
    return dbSaveBranding(b);
  });

const _saveContent = createServerFn({ method: 'POST' })
  .inputValidator((c: SiteContent) => c)
  .handler(async ({ data: c }) => {
    const { dbSaveContent } = await import('./db.server');
    return dbSaveContent(c);
  });

const _deleteItem = createServerFn({ method: 'POST' })
  .inputValidator((d: { table: string, id: string }) => d)
  .handler(async ({ data }) => {
    const { dbDeleteItem } = await import('./db.server');
    return dbDeleteItem(data.table, data.id);
  });

const _upsertHotel = createServerFn({ method: 'POST' })
  .inputValidator((h: Hotel) => h)
  .handler(async ({ data: h }) => {
    const { dbUpsertHotel } = await import('./db.server');
    return dbUpsertHotel(h);
  });

const _upsertRoom = createServerFn({ method: 'POST' })
  .inputValidator((r: Room) => r)
  .handler(async ({ data: r }) => {
    const { dbUpsertRoom } = await import('./db.server');
    return dbUpsertRoom(r);
  });

const _upsertHall = createServerFn({ method: 'POST' })
  .inputValidator((h: Hall) => h)
  .handler(async ({ data: h }) => {
    const { dbUpsertHall } = await import('./db.server');
    return dbUpsertHall(h);
  });

const _upsertPackage = createServerFn({ method: 'POST' })
  .inputValidator((p: Pkg) => p)
  .handler(async ({ data: p }) => {
    const { dbUpsertPackage } = await import('./db.server');
    return dbUpsertPackage(p);
  });

const _upsertArrangement = createServerFn({ method: 'POST' })
  .inputValidator((a: SeatArrangement) => a)
  .handler(async ({ data: a }) => {
    const { dbUpsertArrangement } = await import('./db.server');
    return dbUpsertArrangement(a);
  });

const _upsertRental = createServerFn({ method: 'POST' })
  .inputValidator((r: RentalItem) => r)
  .handler(async ({ data: r }) => {
    const { dbUpsertRental } = await import('./db.server');
    return dbUpsertRental(r);
  });

const _upsertFaq = createServerFn({ method: 'POST' })
  .inputValidator((f: FAQ) => f)
  .handler(async ({ data: f }) => {
    const { dbUpsertFaq } = await import('./db.server');
    return dbUpsertFaq(f);
  });

const _insertBooking = createServerFn({ method: 'POST' })
  .inputValidator((b: Booking) => b)
  .handler(async ({ data: b }) => {
    const { dbInsertBooking } = await import('./db.server');
    return dbInsertBooking(b);
  });

const _updateBookingDb = createServerFn({ method: 'POST' })
  .inputValidator((d: { ref: string, patch: Partial<Booking> }) => d)
  .handler(async ({ data: { ref, patch } }) => {
    const { dbUpdateBooking } = await import('./db.server');
    return dbUpdateBooking(ref, patch);
  });

const _lookupBookings = createServerFn({ method: 'GET' })
  .inputValidator((query: string) => query)
  .handler(async ({ data: query }) => {
    const { dbLookupBookings } = await import('./db.server');
    return dbLookupBookings(query);
  });

const _insertMovement = createServerFn({ method: 'POST' })
  .inputValidator((m: InventoryMovement) => m)
  .handler(async ({ data: m }) => {
    const { dbInsertMovement } = await import('./db.server');
    return dbInsertMovement(m);
  });

const _adjustStock = createServerFn({ method: 'POST' })
  .inputValidator((d: { itemId: string, newAvailable: number }) => d)
  .handler(async ({ data: { itemId, newAvailable } }) => {
    const { dbAdjustStock } = await import('./db.server');
    return dbAdjustStock(itemId, newAvailable);
  });

const _upsertRole = createServerFn({ method: 'POST' })
  .inputValidator((r: Role) => r)
  .handler(async ({ data: r }) => {
    const { dbUpsertRole } = await import('./db.server');
    return dbUpsertRole(r);
  });

const _deleteRole = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { dbDeleteRole } = await import('./db.server');
    return dbDeleteRole(id);
  });

const _loadEmployees = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { dbLoadEmployees } = await import('./db.server');
    return dbLoadEmployees();
  });

const _loadActivity = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { dbLoadActivity } = await import('./db.server');
    return dbLoadActivity();
  });

const _loadReceipts = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { dbLoadReceipts } = await import('./db.server');
    return dbLoadReceipts();
  });

const _setEmployeeRole = createServerFn({ method: 'POST' })
  .inputValidator((d: { userId: string, roleId: string | null }) => d)
  .handler(async ({ data: { userId, roleId } }) => {
    const { dbSetEmployeeRole } = await import('./db.server');
    return dbSetEmployeeRole(userId, roleId);
  });

const _insertReceipt = createServerFn({ method: 'POST' })
  .inputValidator((r: SavedReceipt) => r)
  .handler(async ({ data: r }) => {
    const { dbInsertReceipt } = await import('./db.server');
    return dbInsertReceipt(r);
  });

const _insertContact = createServerFn({ method: 'POST' })
  .inputValidator((c: Omit<Contact, 'id' | 'createdAt'>) => c)
  .handler(async ({ data: c }) => {
    const { dbInsertContact } = await import('./db.server');
    return dbInsertContact(c);
  });

// --- PUBLIC API WRAPPERS (Maintains existing signatures for UI) ---

export const loadCatalog = () => _loadCatalog();
export const saveBranding = (b: Branding) => _saveBranding({ data: b });
export const saveContent = (c: SiteContent) => _saveContent({ data: c });
export const deleteHotel = (id: string) => _deleteItem({ data: { table: 'hotels', id } });
export const deleteRoom = (id: string) => _deleteItem({ data: { table: 'rooms', id } });
export const deleteHall = (id: string) => _deleteItem({ data: { table: 'halls', id } });
export const deletePackage = (id: string) => _deleteItem({ data: { table: 'packages', id } });
export const deleteArrangement = (id: string) => _deleteItem({ data: { table: 'seat_arrangements', id } });
export const deleteRental = (id: string) => _deleteItem({ data: { table: 'rentals', id } });
export const deleteFaq = (id: string) => _deleteItem({ data: { table: 'faqs', id } });
export const upsertHotel = (h: Hotel) => _upsertHotel({ data: h });
export const upsertRoom = (r: Room) => _upsertRoom({ data: r });
export const upsertHall = (h: Hall) => _upsertHall({ data: h });
export const upsertPackage = (p: Pkg) => _upsertPackage({ data: p });
export const upsertArrangement = (a: SeatArrangement) => _upsertArrangement({ data: a });
export const upsertRental = (r: RentalItem) => _upsertRental({ data: r });
export const upsertFaq = (f: FAQ) => _upsertFaq({ data: f });
export const insertBooking = (b: Booking) => _insertBooking({ data: b });
export const updateBookingDb = (ref: string, patch: Partial<Booking>) => _updateBookingDb({ data: { ref, patch } });
export const lookupBookings = (query: string) => _lookupBookings({ data: query });
export const insertMovement = (m: InventoryMovement) => _insertMovement({ data: m });
export const adjustStock = (itemId: string, newAvailable: number) => _adjustStock({ data: { itemId, newAvailable } });
export const upsertRole = (r: Role) => _upsertRole({ data: r });
export const deleteRole = (id: string) => _deleteRole({ data: id });
export const loadEmployees = () => _loadEmployees();
export const loadActivity = () => _loadActivity();
export const loadReceipts = () => _loadReceipts();
export const setEmployeeRole = (userId: string, roleId: string | null) => _setEmployeeRole({ data: { userId, roleId } });
export const insertReceipt = (r: SavedReceipt) => _insertReceipt({ data: r });
export const deleteReceipt = (id: string) => _deleteItem({ data: { table: 'receipts', id } });
export const insertContact = (c: Omit<Contact, 'id' | 'createdAt'>) => _insertContact({ data: c });
export const deleteContact = (id: string) => _deleteItem({ data: { table: 'contacts', id } });

// --- CUSTOM AUTH SERVER FUNCTIONS ---

export const login = createServerFn({ method: 'POST' })
  .inputValidator((d: { email: string, password: string }) => d)
  .handler(async ({ data }) => {
    const { getDb } = await import('@/db/client');
    const { profiles } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { verifyPassword, createSession } = await import('./auth');

    const user = await getDb().query.profiles.findFirst({
      where: eq(profiles.email, data.email),
    });

    if (!user || !user.passwordHash || !(await verifyPassword(data.password, user.passwordHash))) {
      throw new Error('Invalid email or password');
    }

    await createSession(user.id);
    return { success: true };
  });

export const signup = createServerFn({ method: 'POST' })
  .inputValidator((d: { email: string, password: string, name: string }) => d)
  .handler(async ({ data }) => {
    const { getDb } = await import('@/db/client');
    const { profiles, roles } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { hashPassword, createSession } = await import('./auth');
    const { v4: uuidv4 } = await import('uuid');

    const db = getDb();
    const existing = await db.query.profiles.findFirst({
      where: eq(profiles.email, data.email),
    });

    if (existing) {
      throw new Error('User already exists');
    }

    const passwordHash = await hashPassword(data.password);
    const id = uuidv4();

    // If first user, make them owner
    const allUsers = await db.select().from(profiles).limit(1);
    let roleId: string | null = null;
    if (allUsers.length === 0) {
      const ownerRole = await db.query.roles.findFirst({ where: eq(roles.name, 'owner') });
      if (ownerRole) roleId = ownerRole.id;
    }

    await db.insert(profiles).values({
      id,
      email: data.email,
      name: data.name,
      passwordHash,
      roleId,
    });

    await createSession(id);
    return { success: true };
  });

export const logout = createServerFn({ method: 'POST' })
  .handler(async () => {
    const { destroySession } = await import('./auth');
    await destroySession();
    return { success: true };
  });

export const getSessionUser = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { getCurrentUser } = await import('./auth');
    const user = await getCurrentUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
    };
  });

