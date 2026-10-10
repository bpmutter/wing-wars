/** Deletes the local SQLite database so the next `npm run dev` starts fresh. */
import { rmSync } from "node:fs";

for (const f of ["local.db", "local.db-journal", "local.db-wal", "local.db-shm"]) rmSync(f, { force: true });
console.log("🧹 Local database removed. Run `npm run dev` to recreate and reseed it.");
