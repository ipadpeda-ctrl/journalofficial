import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS pairs text[];`);
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS emotions text[];`);
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS confluences_pro text[];`);
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS confluences_contro text[];`);
        console.log("Database altered successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error altering database:", error);
        process.exit(1);
    }
}

main();
