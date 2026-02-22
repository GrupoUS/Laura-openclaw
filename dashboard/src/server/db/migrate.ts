import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL is missing. Please set it in .env');
}

/* eslint-disable no-console -- CLI migration script needs stdout/stderr */
console.log('Migrating database...');

const pool = new Pool({ connectionString: dbUrl });
const db = drizzle(pool);

async function main() {
  console.log('Enabling pgvector extension...');
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
  console.log('pgvector created successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
/* eslint-enable no-console */
