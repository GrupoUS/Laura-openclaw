import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const leads = await sql`
      SELECT * FROM leads 
      WHERE last_message_received_at > last_message_sent_at 
      OR last_message_sent_at IS NULL
      ORDER BY last_message_received_at DESC 
    `;
    console.log("Leads needing attention:", JSON.stringify(leads, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
