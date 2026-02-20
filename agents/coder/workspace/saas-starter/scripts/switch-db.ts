import { file, write } from "bun";

const schemaPath = "prisma/schema.prisma";
const schemaFile = file(schemaPath);
const content = await schemaFile.text();

const mode = process.argv[2]; // "sqlite" or "postgres"

if (mode === "sqlite") {
  console.log("🔄 Switching to SQLite...");
  const newContent = content.replace(
    /provider\s*=\s*"postgresql"/,
    'provider = "sqlite"'
  ).replace(
    /url\s*=\s*env\("DATABASE_URL"\)/,
    'url      = "file:./dev.db"'
  );
  await write(schemaPath, newContent);
} else if (mode === "postgres") {
  console.log("🔄 Switching to PostgreSQL...");
  const newContent = content.replace(
    /provider\s*=\s*"sqlite"/,
    'provider = "postgresql"'
  ).replace(
    /url\s*=\s*"file:\.\/dev\.db"/,
    'url      = env("DATABASE_URL")'
  );
  await write(schemaPath, newContent);
} else {
  console.error("Usage: bun run db:switch <sqlite|postgres>");
  process.exit(1);
}

console.log("✅ Done.");
