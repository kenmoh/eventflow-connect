import 'dotenv/config';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function run(){
  const client = await pool.connect();
  try{
    const res = await client.query('SELECT count(*) as cnt FROM roles');

  }catch(e){
    console.error('Error querying roles:', e.message || e);
  }finally{
    client.release();
    await pool.end();
  }
}

run();
