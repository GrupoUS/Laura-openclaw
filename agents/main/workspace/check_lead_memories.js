import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const numbers = [
  '+556399546167',
  '+5512991726474',
  '+5511972737261',
  '+553799994898',
  '+5511969815798',
  '+559899741836',
  '+5511919752205'
];

async function main() {
  try {
    for (const number of numbers) {
      const results = await sql`
        SELECT * FROM laura_memories 
        WHERE metadata->>'lead' = ${number}
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      console.log(`Last memory for ${number}:`, JSON.stringify(results, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
