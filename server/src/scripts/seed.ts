import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config({ path: resolve(__dirname, '../../../.env') });

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const questionsSql = readFileSync(resolve(__dirname, '../../../db/seed-questions.sql'), 'utf-8');
  const seedSql = readFileSync(resolve(__dirname, '../../../db/seed.sql'), 'utf-8');

  try {
    await pool.query(questionsSql);
    await pool.query(seedSql);
    console.log('Seed data inserted successfully (30 citizens with dynamic responses)');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
