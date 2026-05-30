import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_KEY;
const DATABASE_URL = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !DATABASE_URL) {
  console.error('Missing required environment variables.');
  console.error('  SUPABASE_URL or VITE_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_KEY or VITE_SUPABASE_SERVICE_KEY');
  console.error('  DATABASE_URL or NEON_DATABASE_URL');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const pool = new Pool({ connectionString: DATABASE_URL });

const tables = [
  'roles',
  'branding',
  'site_content',
  'hotels',
  'rooms',
  'halls',
  'packages',
  'seat_arrangements',
  'rentals',
  'faqs',
  'bookings',
  'inventory_movements',
  'receipts',
  'contacts',
];

const skippedTables = ['profiles', 'user_roles'];

function buildInsertSql(table, columns, rowCount) {
  const quoted = columns.map((column) => `"${column}"`);
  const valuesSql = Array.from({ length: rowCount }).map((_, rowIndex) => {
    const offset = rowIndex * columns.length;
    const placeholders = columns.map((_, columnIndex) => `$${offset + columnIndex + 1}`);
    return `(${placeholders.join(', ')})`;
  }).join(', ');

  const updateSet = columns
    .filter((column) => column !== 'id')
    .map((column) => `"${column}" = EXCLUDED."${column}"`)
    .join(', ');

  return `INSERT INTO "${table}" (${quoted.join(', ')}) VALUES ${valuesSql} ON CONFLICT (id) DO UPDATE SET ${updateSet};`;
}

async function fetchSupabaseRows(table) {
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    if (error.details?.includes('relation') || error.details?.includes('does not exist')) {
      console.warn(`Skipping ${table}: table does not exist in Supabase.`);
      return null;
    }
    throw error;
  }
  return data;
}

async function run() {
 

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const table of tables) {
      // Ensure target table exists in Neon before attempting insert
      const existsRes = await client.query(`SELECT to_regclass('public.${table}') as reg`);
      const exists = existsRes.rows[0] && existsRes.rows[0].reg !== null;
      if (!exists) {
        console.warn(`Target table '${table}' does not exist in Neon. Skipping.`);
        continue;
      }

      const rows = await fetchSupabaseRows(table);
      if (!rows) {
        continue;
      }
      if (rows.length === 0) {
       
        continue;
      }

      const columns = Object.keys(rows[0]);

      // Per-table source->target column renames when Supabase column names differ
      const renameMap = {
        receipts: {
          client_name: 'customer_name',
          client_email: 'customer_email',
          client_phone: 'customer_phone',
          client_address: 'customer_address',
        },
      };

      const columnPairs = columns.map((orig) => ({ orig, target: renameMap[table]?.[orig] ?? orig }));

      // Clean JSON-like strings: iteratively unescape and try to parse strings that contain JSON
      function tryParseJsonStr(s) {
        let cur = s;
        for (let i = 0; i < 6; i++) {
          try {
            return JSON.parse(cur);
          } catch (e) {
            // strip outer quotes if present
            if (cur.startsWith('"') && cur.endsWith('"')) {
              try {
                return JSON.parse(cur.slice(1, -1));
              } catch (e2) {
                // continue
              }
            }
            const next = cur.replace(/\\\\/g, '\\');
            if (next === cur) break;
            cur = next;
          }
        }
        return null;
      }

      // Columns that should be treated as JSONB in the target schema
      const jsonbColumnsMap = {
        packages: ['time_slots'],
        bookings: ['lines', 'details'],
        receipts: ['items'],
        site_content: ['data'],
      };

      // Columns that should be treated as Postgres arrays (text[])
      const arrayColumnsMap = {
        roles: ['tabs'],
        hotels: ['amenities'],
        halls: ['amenities'],
        packages: ['items'],
      };

      const cleanedRows = rows.map((row) => {
        const newRow = {};
        for (const col of columns) {
          const v = row[col];
          // If column is expected to be jsonb, ensure we pass valid JSON (stringify objects/arrays)
          if (jsonbColumnsMap[table] && jsonbColumnsMap[table].includes(col)) {
            if (v === null || v === undefined) {
              newRow[col] = null;
              continue;
            }
            if (typeof v === 'string') {
              const parsed = tryParseJsonStr(v);
              if (parsed !== null) {
                newRow[col] = JSON.stringify(parsed);
                continue;
              }
            }
            // For objects/arrays, stringify
            if (typeof v === 'object') {
              newRow[col] = JSON.stringify(v);
              continue;
            }
            newRow[col] = v;
            continue;
          }

          // If column is expected to be Postgres array (text[]), leave JS arrays as-is
          if (arrayColumnsMap[table] && arrayColumnsMap[table].includes(col)) {
            newRow[col] = v;
            continue;
          }

          if (typeof v === 'string') {
            const parsed = tryParseJsonStr(v);
            if (parsed !== null) {
              newRow[col] = parsed;
              continue;
            }
          }

          newRow[col] = v;
        }
        return newRow;
      });

      // For receipts, ensure a non-null `reference` column exists (target requires it)
      if (table === 'receipts') {
        if (!columnPairs.some((p) => p.target === 'reference')) {
          columnPairs.push({ orig: '__generated_reference', target: 'reference' });
          cleanedRows.forEach((r) => {
            r['__generated_reference'] = r.id ?? (Math.random().toString(36).slice(2, 10));
          });
        }
      }

      const values = cleanedRows.flatMap((row) => columnPairs.map((p) => row[p.orig]));
      const sql = buildInsertSql(table, columnPairs.map((p) => p.target), rows.length);

      try {
        await client.query(sql, values);
        
      } catch (err) {
        console.error(`Error inserting into table '${table}'. SQL:`);
        console.error(sql);
        console.error('Values (first 50):', values.slice(0, 50));
        throw err;
      }
    }

    await client.query('COMMIT');
 
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
