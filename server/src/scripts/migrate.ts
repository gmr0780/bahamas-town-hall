import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config({ path: resolve(__dirname, '../../../.env') });

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const baseSql = readFileSync(resolve(__dirname, '../../../db/migrate.sql'), 'utf-8');
  const dynamicSql = readFileSync(resolve(__dirname, '../../../db/migrate-dynamic.sql'), 'utf-8');

  try {
    await pool.query(baseSql);
    await pool.query(dynamicSql);
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
