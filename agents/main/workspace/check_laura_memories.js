import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const laura_memories_schema = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'laura_memories'
    `;
    console.log('Schema for laura_memories:', JSON.stringify(laura_memories_schema, null, 2));

    const sample = await sql`SELECT * FROM laura_memories LIMIT 5`;
    console.log('Sample data from laura_memories:', JSON.stringify(sample, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
