import 'dotenv/config';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    const defaultRoles = [
      { name: 'owner', tabs: ['dashboard', 'catalog', 'bookings', 'employees', 'branding'] },
      { name: 'admin', tabs: ['dashboard', 'catalog', 'bookings', 'employees'] },
      { name: 'staff', tabs: ['bookings', 'inventory'] },
    ];

    for (const r of defaultRoles) {
      await client.query(
        `INSERT INTO roles (id, name, tabs, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, now(), now()) ON CONFLICT (name) DO NOTHING`,
        [r.name, r.tabs]
      );
    }
    console.log('Seeded default roles.');
  } catch (e) {
    console.error('Seeding failed:', e.message || e);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
