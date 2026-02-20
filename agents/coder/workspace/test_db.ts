import { Client } from "pg";
const client = new Client(process.env.DATABASE_URL || "postgresql://localhost:5432/db");
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
