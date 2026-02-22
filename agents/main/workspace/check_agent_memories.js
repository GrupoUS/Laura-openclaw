import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const agent_memories_sample = await sql`
      SELECT * FROM agent_memories 
      WHERE category = 'whatsapp' 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    console.log('Sample WhatsApp memories:', JSON.stringify(agent_memories_sample, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
