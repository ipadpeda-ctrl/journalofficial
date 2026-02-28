import { pool } from "../server/db";

async function alterDb() {
    const client = await pool.connect();
    try {
        console.log("Starting DB alteration...");

        // Add new columns if they do not exist
        await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS barrier_options text[];
    `);
        console.log("Added barrier_options to users.");

        await client.query(`
      ALTER TABLE trades
      ADD COLUMN IF NOT EXISTS aligned_timeframes text[];
    `);
        console.log("Added aligned_timeframes to trades.");

        await client.query(`
      ALTER TABLE trades
      ADD COLUMN IF NOT EXISTS barrier text[];
    `);
        console.log("Added barrier to trades.");

        console.log("Database altered successfully.");
    } catch (error) {
        console.error("Error altering DB:", error);
    } finally {
        client.release();
        process.exit(0);
    }
}

alterDb();
