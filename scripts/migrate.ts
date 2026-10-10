/** Applies migrations to whatever database the env points at (used on Vercel builds). */
import { migrate } from "drizzle-orm/libsql/migrator";
import { createDb, databaseUrl } from "@/db/client";
import { ensureWingTypes } from "@/lib/wing-types";

async function main() {
  if (!process.env.TURSO_DATABASE_URL && process.env.VERCEL) {
    throw new Error("TURSO_DATABASE_URL is not set. See TODOS.md for database setup.");
  }
  const db = createDb();
  await migrate(db, { migrationsFolder: "drizzle" });
  await ensureWingTypes(db);
  console.log(`🍃 Migrations applied to ${databaseUrl().startsWith("file:") ? databaseUrl() : "remote database"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
