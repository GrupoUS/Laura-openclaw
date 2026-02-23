import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const memories = await sql`
      SELECT * FROM laura_memories 
      ORDER BY created_at DESC 
      LIMIT 100
    `;
    console.log("All memories:", JSON.stringify(memories, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
