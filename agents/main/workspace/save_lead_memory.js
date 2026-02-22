import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const lead = '+5511969815798';
  const content = "Lead Sthefani Molino (+5511969815798) respondeu ao reaquecimento e foi atendida pela Laura SDR.";
  const metadata = {
    lead: lead,
    type: 'sdr_action',
    action: 'initial_contact',
    timestamp: new Date().toISOString()
  };

  try {
    await sql`
      INSERT INTO laura_memories (content, metadata)
      VALUES (${content}, ${metadata})
    `;
    console.log('Memory saved for lead:', lead);
  } catch (err) {
    console.error('Error saving memory:', err);
  }
}

main();
