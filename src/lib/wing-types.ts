import { sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { wingTypes } from "@/db/schema";
import { WING_TYPE_CATALOG } from "./wing-type-catalog";

/** Inserts any missing canonical wing types. Idempotent; runs on every migrate. */
export async function ensureWingTypes(db: Db) {
  await db
    .insert(wingTypes)
    .values(WING_TYPE_CATALOG.map((t) => ({ ...t })))
    .onConflictDoNothing({ target: wingTypes.name });
}

/** Finds a wing type by name (case-insensitive) or creates it. */
export async function findOrCreateWingType(db: Db, name: string, userId: string) {
  const clean = name.trim().replace(/\s+/g, " ");
  const [existing] = await db
    .select({ id: wingTypes.id })
    .from(wingTypes)
    .where(sql`lower(${wingTypes.name}) = lower(${clean})`);
  if (existing) return existing.id;
  const [created] = await db
    .insert(wingTypes)
    .values({ name: clean, createdById: userId })
    .onConflictDoNothing({ target: wingTypes.name })
    .returning({ id: wingTypes.id });
  if (created) return created.id;
  // Lost a race with someone adding the same type.
  const [again] = await db.select({ id: wingTypes.id }).from(wingTypes).where(sql`lower(${wingTypes.name}) = lower(${clean})`);
  return again.id;
}
