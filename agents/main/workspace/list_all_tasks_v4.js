import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const tasks = await sql`
      SELECT id, title, status, agent, created_at 
      FROM tasks 
      ORDER BY id ASC
    `;
    console.log("All tasks in DB:", JSON.stringify(tasks, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
