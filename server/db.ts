import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Ensure missing columns exist in production database immediately on startup
pool.query(`
  ALTER TABLE users ADD COLUMN IF NOT EXISTS barrier_options text[] DEFAULT '{"m15","m10","m5","m1"}'::text[] NOT NULL;
  ALTER TABLE trades ADD COLUMN IF NOT EXISTS aligned_timeframes text[] DEFAULT '{}'::text[] NOT NULL;
  ALTER TABLE trades ADD COLUMN IF NOT EXISTS barrier text[] DEFAULT '{}'::text[] NOT NULL;
`).then(() => {
  console.log("Database schema auto-patch verified successfully.");
}).catch(err => {
  console.error("Failed to execute database schema auto-patch:", err);
});

export const db = drizzle(pool, { schema });
