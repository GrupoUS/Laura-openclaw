import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

async function main() {
  try {
    const laura_memories = await sql`
      SELECT * FROM laura_memories 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    console.log('Laura Memories:', JSON.stringify(laura_memories, null, 2));

    const agent_memories = await sql`
      SELECT * FROM agent_memories 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    console.log('Agent Memories:', JSON.stringify(agent_memories, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
