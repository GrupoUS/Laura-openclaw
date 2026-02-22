import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    // 1. Get recent incoming messages from leads (excluding team)
    // Assuming 'laura_memories' records lead interactions via metadata
    const recent_leads = await sql`
      SELECT DISTINCT metadata->>'lead' as phone
      FROM laura_memories 
      WHERE (metadata->>'type' = 'lead_interaction' OR metadata->>'type' = 'sdr_action')
      AND created_at > NOW() - INTERVAL '7 days'
    `;
    
    console.log('Recent leads found in DB:', recent_leads.map(l => l.phone));

    // Note: The logs show +5511969815798 and +559899741836 are active today.
    // I will check if they have been responded to by looking at the latest memory for each.
    
    const check_list = ['+5511969815798', '+559899741836'];
    for (const phone of check_list) {
      const last_interaction = await sql`
        SELECT * FROM laura_memories 
        WHERE metadata->>'lead' = ${phone}
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      console.log(`Last interaction for ${phone}:`, JSON.stringify(last_interaction, null, 2));
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
