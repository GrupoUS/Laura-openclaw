import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const active_tasks = await sql`
      SELECT * FROM tasks 
      WHERE status NOT IN ('done', 'failed') 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    console.log('Active tasks:', JSON.stringify(active_tasks, null, 2));

    const sdr_leads = await sql`
      SELECT * FROM tasks 
      WHERE title ILIKE '%SDR%' OR title ILIKE '%Lead%'
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    console.log('SDR related tasks:', JSON.stringify(sdr_leads, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
