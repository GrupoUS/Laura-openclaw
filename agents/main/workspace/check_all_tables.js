import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const all_tables = await sql`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    `;
    console.log('All Tables:', JSON.stringify(all_tables, null, 2));

    const check_whatsapp_history = await sql`
      SELECT * FROM information_schema.tables 
      WHERE table_name ILIKE '%message%' OR table_name ILIKE '%chat%' OR table_name ILIKE '%whatsapp%'
    `;
    console.log('Search for message/chat/whatsapp tables:', JSON.stringify(check_whatsapp_history, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
