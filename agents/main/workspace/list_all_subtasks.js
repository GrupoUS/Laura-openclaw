import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const subtasks = await sql\`SELECT * FROM subtasks LIMIT 20\`;
    console.log(JSON.stringify(subtasks, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
