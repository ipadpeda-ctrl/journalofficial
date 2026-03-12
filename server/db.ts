import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("render.com")
    ? { rejectUnauthorized: false }
    : undefined,
});

// Ensure missing columns exist in production database immediately on startup
pool.query(`
  BEGIN;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS barrier_options text[] DEFAULT '{"m15","m10","m5","m1"}'::text[] NOT NULL;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS has_completed_tutorial boolean DEFAULT false;
  ALTER TABLE trades ADD COLUMN IF NOT EXISTS aligned_timeframes text[] DEFAULT '{}'::text[] NOT NULL;
  ALTER TABLE trades ADD COLUMN IF NOT EXISTS barrier text[] DEFAULT '{}'::text[] NOT NULL;

  -- Multi-Strategy support
  CREATE TABLE IF NOT EXISTS strategies (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    pairs text[],
    confluences_pro text[],
    confluences_contro text[],
    barrier_options text[],
    is_barrier_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  ALTER TABLE trades ADD COLUMN IF NOT EXISTS strategy_id INTEGER REFERENCES strategies(id);
  COMMIT;
`).then(() => {
  console.log("Database schema auto-patch verified successfully.");
}).catch(err => {
  console.error("Failed to execute database schema auto-patch:", err);
});

export const db = drizzle(pool, { schema });
