import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const subtasks = await sql`SELECT * FROM subtasks WHERE status IN ('backlog', 'pending', 'doing')`;
    console.log(JSON.stringify(subtasks, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
