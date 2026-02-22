import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const memories = await sql`
      SELECT * FROM laura_memories 
      WHERE (metadata->>'type' = 'sdr_action' OR metadata->>'type' = 'lead_interaction')
      AND created_at > NOW() - INTERVAL '48 hours'
      ORDER BY created_at DESC
    `;
    console.log('Recent Lead Interactions:', JSON.stringify(memories, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
