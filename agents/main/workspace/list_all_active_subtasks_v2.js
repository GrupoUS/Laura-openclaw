import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const subtasks = await sql`
      SELECT id, task_id, title, status, agent, created_at 
      FROM subtasks 
      WHERE status != 'done' 
      ORDER BY created_at DESC 
    `;
    console.log("Active subtasks:", JSON.stringify(subtasks, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
