import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const tasks = await sql`
      SELECT * FROM tasks 
      ORDER BY created_at DESC 
      LIMIT 50
    `;
    console.log("All tasks:", JSON.stringify(tasks, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
