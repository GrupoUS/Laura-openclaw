import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const enum_values = await sql`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'memory_category'
    `;
    console.log('Enum memory_category values:', JSON.stringify(enum_values, null, 2));

    const samples = await sql`SELECT * FROM agent_memories ORDER BY created_at DESC LIMIT 50`;
    console.log('Last 50 memories:', JSON.stringify(samples, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
