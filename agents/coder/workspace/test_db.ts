import { Client } from "pg";
const client = new Client("postgresql://neondb_owner:***REMOVED***@ep-falling-morning-acpph9w8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require");
try {
  await client.connect();
  console.log("✅ DB Connected");
  const res = await client.query("SELECT count(*) FROM agent_memories");
  console.log("📊 Memory count:", res.rows[0].count);
} catch (err) {
  console.error("❌ DB Error:", err.message);
} finally {
  await client.end();
}
