import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const result = await sql`
      SELECT content, metadata, created_at 
      FROM laura_memories 
      ORDER BY created_at DESC 
      LIMIT 50
    `;
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
