import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const memories = await sql`
      SELECT id, content, metadata, created_at 
      FROM laura_memories 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    console.log("All memories:", JSON.stringify(memories, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
