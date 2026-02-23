import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const leads = await sql`
      SELECT * FROM tasks 
      WHERE (title ILIKE '%SDR%' OR title ILIKE '%Lead%')
      AND status != 'done'
      ORDER BY created_at DESC 
    `;
    console.log("Leads needing attention:", JSON.stringify(leads, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
