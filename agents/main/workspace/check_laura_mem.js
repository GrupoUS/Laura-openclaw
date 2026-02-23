import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const result = await sql\`
      SELECT * FROM laura_memories 
      ORDER BY created_at DESC 
      LIMIT 20
    \`;
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
