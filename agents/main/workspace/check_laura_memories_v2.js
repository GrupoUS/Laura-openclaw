import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const laura_memories = await sql`
      SELECT * FROM laura_memories 
      ORDER BY created_at DESC 
      LIMIT 100
    `;
    console.log('Recent Laura Memories:', JSON.stringify(laura_memories, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
