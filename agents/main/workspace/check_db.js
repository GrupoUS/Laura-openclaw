import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

async function main() {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Tables:', JSON.stringify(tables, null, 2));

    for (const table of tables) {
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ${table.table_name}
      `;
      console.log(`Schema for ${table.table_name}:`, JSON.stringify(columns, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
