/**
 * Runs before `npm run dev`: applies migrations and, if the database is
 * empty, seeds it with demo data. Safe to run as often as you like.
 */
import { migrate } from "drizzle-orm/libsql/migrator";
import { createDb, databaseUrl } from "@/db/client";
import { ensureWingTypes } from "@/lib/wing-types";
import { seed } from "./seed";

async function main() {
  const url = databaseUrl();
  const db = createDb();
  await migrate(db, { migrationsFolder: "drizzle" });
  await ensureWingTypes(db);
  console.log(`🍃 Database ready (${url.startsWith("file:") ? url : "remote"})`);
  const shouldSeed = url.startsWith("file:") || process.argv.includes("--seed");
  if (shouldSeed && !process.argv.includes("--no-seed")) await seed(db);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
