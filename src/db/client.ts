import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * Local mode: a SQLite file (`local.db`) in the project root.
 * Deployed: a Turso database (set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN).
 */
export function databaseUrl() {
  return process.env.TURSO_DATABASE_URL || "file:local.db";
}

export function createDb() {
  const client = createClient({
    url: databaseUrl(),
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;
