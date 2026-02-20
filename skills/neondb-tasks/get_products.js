import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.NEON_DATABASE_URL);
async function get() {
  const products = await sql`SELECT * FROM products`;
  console.log(JSON.stringify(products, null, 2));
}
get();
