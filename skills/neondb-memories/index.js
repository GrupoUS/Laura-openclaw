import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

async function saveMemory(content, metadata = {}) {
  const result = await sql`
    INSERT INTO laura_memories (content, metadata)
    VALUES (${content}, ${JSON.stringify(metadata)})
    RETURNING *;
  `;
  return result[0];
}

async function searchMemories(query, limit = 5) {
  // Por enquanto, busca textual simples usando ILIKE
  const result = await sql`
    SELECT * FROM laura_memories
    WHERE content ILIKE ${'%' + query + '%'}
    ORDER BY created_at DESC
    LIMIT ${limit};
  `;
  return result;
}

async function listMemories(limit = 10) {
  const result = await sql`
    SELECT * FROM laura_memories
    ORDER BY created_at DESC
    LIMIT ${limit};
  `;
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : null;
  };

  const action = getArg('action');
  
  if (!process.env.NEON_DATABASE_URL) {
    console.error(JSON.stringify({ error: 'NEON_DATABASE_URL is not set' }));
    process.exit(1);
  }

  try {
    let result;
    switch (action) {
      case 'save_memory':
        result = await saveMemory(getArg('content'), JSON.parse(getArg('metadata') || '{}'));
        break;
      case 'search_memories':
        result = await searchMemories(getArg('query'), parseInt(getArg('limit') || '5'));
        break;
      case 'list_memories':
        result = await listMemories(parseInt(getArg('limit') || '10'));
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

main();
