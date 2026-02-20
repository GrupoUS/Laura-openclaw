import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

async function setup() {
  try {
    // Enable pgvector extension
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;

    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC,
        format TEXT,
        category TEXT,
        details JSONB,
        embedding VECTOR(768), -- Adjusted for Gemini/standard embeddings if needed
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log("Table 'products' is ready.");
  } catch (err) {
    console.error("Setup error:", err);
  }
}

setup();
