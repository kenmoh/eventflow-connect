let db: any = null;

/** Load db driver packages at runtime so bundlers skip them in client builds. */
function loadDriver() {
  const id = '@neondatabase/serverless';
  const mod = eval('require')(id);
  const { drizzle } = eval('require')('drizzle-orm/neon-http');
  const schema = eval('require')('./schema');
  return { neon: mod.neon, drizzle, schema };
}

export function getDb() {
  if (db) return db;
  if (typeof window !== 'undefined') {
    throw new Error('Database client cannot be used in the browser.');
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const { neon, drizzle, schema } = loadDriver();
  db = drizzle(neon(url), { schema });
  return db;
}
