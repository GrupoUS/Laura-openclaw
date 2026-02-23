import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const result = await sql\`
    SELECT * FROM agent_memories 
    WHERE metadata->>'category' = 'whatsapp' 
    ORDER BY created_at DESC 
    LIMIT 50
  \`;
  console.log(JSON.stringify(result, null, 2));
}
main();
