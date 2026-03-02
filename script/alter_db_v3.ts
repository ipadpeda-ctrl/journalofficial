import { pool } from "../server/db";

async function alterDb() {
    const client = await pool.connect();
    try {
        console.log("Starting DB alteration v3...");

        await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_barrier_enabled boolean DEFAULT true;
    `);
        console.log("Added is_barrier_enabled to users.");

        await client.query(`
      ALTER TABLE trades
      ADD COLUMN IF NOT EXISTS close_time varchar;
    `);
        console.log("Added close_time to trades.");

        console.log("Database altered successfully.");
    } catch (error) {
        console.error("Error altering DB:", error);
    } finally {
        client.release();
        process.exit(0);
    }
}

alterDb();
