import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const ids = [16, 15, 14, 8];
    for (const id of ids) {
      await sql`
        UPDATE subtasks 
        SET status = 'done', completed_at = NOW() 
        WHERE id = ${id}
      `;
      console.log(`Updated subtask ${id} to done.`);
    }
  } catch (err) {
    console.error(err);
  }
}
main();
