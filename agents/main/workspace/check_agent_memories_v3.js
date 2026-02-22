import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const samples = await sql`SELECT * FROM agent_memories ORDER BY created_at DESC LIMIT 50`;
    console.log('Last 50 agent memories:', JSON.stringify(samples, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
