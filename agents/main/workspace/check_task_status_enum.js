import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const enum_values = await sql`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'task_status'
    `;
    console.log('Enum task_status values:', JSON.stringify(enum_values, null, 2));

    const samples = await sql`SELECT * FROM tasks ORDER BY created_at DESC LIMIT 20`;
    console.log('Last 20 tasks:', JSON.stringify(samples, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
