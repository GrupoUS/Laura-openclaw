import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("Tables:", JSON.stringify(tables, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
