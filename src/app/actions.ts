"use server";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { spotReviews, spots, tastings, tournaments, wingTypes, wings } from "@/db/schema";
import { recordBattle, recordSpotBattle } from "@/lib/battle-engine";
import { scoresSchema, spotScoresSchema } from "@/lib/scoring";
import { findOrCreateWingType } from "@/lib/wing-types";
import { getCurrentUser } from "@/lib/session";
import { buildBracket, TOURNAMENT_SIZES } from "@/lib/bracket";

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | null;

function fail(error: z.ZodError | string): FormState {
  if (typeof error === "string") return { error };
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    fieldErrors[key] ??= issue.message;
  }
  return { error: "A few things need fixing.", fieldErrors };
}

async function mustUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

const trimmed = (max: number) => z.string().trim().max(max);

/* ── spots ───────────────────────────────────────────────────── */

const spotSchema = z.object({
  name: trimmed(80).min(2, "Give the spot a name."),
  neighborhood: trimmed(60).default(""),
  description: trimmed(400).default(""),
});

export async function createSpot(_: FormState, form: FormData): Promise<FormState> {
  const user = await mustUser();
  const parsed = spotSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error);
  const [spot] = await db
    .insert(spots)
    .values({ ...parsed.data, createdById: user.id })
    .returning({ id: spots.id });
  redirect(`/spots/${spot.id}?added=1`);
}

/* ── wings ───────────────────────────────────────────────────── */

const NEW_TYPE = "__new";

const wingSchema = z.object({
  spotId: z.string().min(1),
  name: trimmed(80).min(2, "What flavor is it?"),
  wingTypeId: z.string().min(1, "Pick a wing type (or add a new one)."),
  newType: trimmed(40).default(""),
  style: z.enum(["bone-in", "boneless"]),
  heat: z.coerce.number().int().min(0).max(5),
  description: trimmed(400).default(""),
});

export async function createWing(_: FormState, form: FormData): Promise<FormState> {
  const user = await mustUser();
  const parsed = wingSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error);
  const { newType, wingTypeId: rawType, ...fields } = parsed.data;
  const [spot] = await db.select({ id: spots.id }).from(spots).where(eq(spots.id, fields.spotId));
  if (!spot) return fail("That spot has vanished into the mist.");

  let wingTypeId = rawType;
  if (rawType === NEW_TYPE) {
    if (newType.length < 2) return { error: "A few things need fixing.", fieldErrors: { newType: "Name the new wing type." } };
    wingTypeId = await findOrCreateWingType(db, newType, user.id);
  } else {
    const [type] = await db.select({ id: wingTypes.id }).from(wingTypes).where(eq(wingTypes.id, rawType));
    if (!type) return { error: "A few things need fixing.", fieldErrors: { wingTypeId: "That wing type doesn't exist." } };
  }

  const [wing] = await db
    .insert(wings)
    .values({ ...fields, wingTypeId, createdById: user.id })
    .returning({ id: wings.id });
  redirect(`/wings/${wing.id}?added=1`);
}

/** Uncategorized wings (e.g. from before wing types existed) can be given a type once. */
export async function assignWingType(_: FormState, form: FormData): Promise<FormState> {
  const user = await mustUser();
  const parsed = z
    .object({ wingId: z.string().min(1), wingTypeId: z.string().min(1, "Pick a wing type."), newType: trimmed(40).default("") })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error);
  const { wingId, wingTypeId: rawType, newType } = parsed.data;

  let wingTypeId = rawType;
  if (rawType === NEW_TYPE) {
    if (newType.length < 2) return { error: "Name the new wing type." };
    wingTypeId = await findOrCreateWingType(db, newType, user.id);
  } else {
    const [type] = await db.select({ id: wingTypes.id }).from(wingTypes).where(eq(wingTypes.id, rawType));
    if (!type) return { error: "That wing type doesn't exist." };
  }
  await db
    .update(wings)
    .set({ wingTypeId })
    .where(and(eq(wings.id, wingId), isNull(wings.wingTypeId)));
  redirect(`/wings/${wingId}`);
}

/* ── solo tastings ───────────────────────────────────────────── */

const tastingSchema = scoresSchema.extend({
  wingId: z.string().min(1),
  notes: trimmed(500).default(""),
});

export async function logTasting(_: FormState, form: FormData): Promise<FormState> {
  const user = await mustUser();
  const parsed = tastingSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error);
  const [wing] = await db.select({ id: wings.id }).from(wings).where(eq(wings.id, parsed.data.wingId));
  if (!wing) return fail("That wing has wandered off.");
  await db.insert(tastings).values({ ...parsed.data, userId: user.id });
  redirect(`/wings/${wing.id}?tasted=1`);
}

/* ── spot reviews ────────────────────────────────────────────── */

const spotReviewSchema = spotScoresSchema.extend({
  spotId: z.string().min(1),
  notes: trimmed(500).default(""),
});

export async function logSpotReview(_: FormState, form: FormData): Promise<FormState> {
  const user = await mustUser();
  const parsed = spotReviewSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error);
  const [spot] = await db.select({ id: spots.id }).from(spots).where(eq(spots.id, parsed.data.spotId));
  if (!spot) return fail("That spot has vanished into the mist.");
  await db.insert(spotReviews).values({ ...parsed.data, userId: user.id });
  redirect(`/spots/${spot.id}?reviewed=1`);
}

/* ── battles ─────────────────────────────────────────────────── */

const battleSchema = z
  .object({
    wingAId: z.string().min(1, "Pick the first contender."),
    wingBId: z.string().min(1, "Pick the second contender."),
    winner: z.enum(["a", "b"], { message: "Every battle needs a victor." }),
    verdict: trimmed(500).default(""),
    a: scoresSchema,
    b: scoresSchema,
  })
  .refine((v) => v.wingAId !== v.wingBId, { message: "A wing can't battle itself (it would be very confused).", path: ["wingBId"] });

function nested(form: FormData) {
  const out: Record<string, unknown> = { a: {}, b: {} };
  for (const [k, v] of form) {
    const m = k.match(/^(a|b)\.(\w+)$/);
    if (m) (out[m[1]] as Record<string, unknown>)[m[2]] = v;
    else out[k] = v;
  }
  return out;
}

export async function createBattle(_: FormState, form: FormData): Promise<FormState> {
  const user = await mustUser();
  const parsed = battleSchema.safeParse(nested(form));
  if (!parsed.success) return fail(parsed.error);
  const v = parsed.data;
  let id: string;
  try {
    const res = await db.transaction((tx) =>
      recordBattle(tx, {
        userId: user.id,
        wingAId: v.wingAId,
        wingBId: v.wingBId,
        winnerId: v.winner === "a" ? v.wingAId : v.wingBId,
        verdict: v.verdict,
        scoresA: v.a,
        scoresB: v.b,
      }),
    );
    id = res.id;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "The battle fizzled out.");
  }
  redirect(`/battles/${id}?fresh=1`);
}

const spotBattleSchema = z
  .object({
    spotAId: z.string().min(1, "Pick the first spot."),
    spotBId: z.string().min(1, "Pick the second spot."),
    winner: z.enum(["a", "b"], { message: "Every battle needs a victor." }),
    verdict: trimmed(500).default(""),
    a: spotScoresSchema,
    b: spotScoresSchema,
  })
  .refine((v) => v.spotAId !== v.spotBId, { message: "A spot can't battle itself.", path: ["spotBId"] });

export async function createSpotBattle(_: FormState, form: FormData): Promise<FormState> {
  const user = await mustUser();
  const parsed = spotBattleSchema.safeParse(nested(form));
  if (!parsed.success) return fail(parsed.error);
  const v = parsed.data;
  let id: string;
  try {
    const res = await db.transaction((tx) =>
      recordSpotBattle(tx, {
        userId: user.id,
        spotAId: v.spotAId,
        spotBId: v.spotBId,
        winnerId: v.winner === "a" ? v.spotAId : v.spotBId,
        verdict: v.verdict,
        scoresA: v.a,
        scoresB: v.b,
      }),
    );
    id = res.id;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "The battle fizzled out.");
  }
  redirect(`/spot-battles/${id}?fresh=1`);
}

/* ── tournaments ─────────────────────────────────────────────── */

const tournamentSchema = z.object({
  name: trimmed(80).min(2, "Name your tournament."),
  entrants: z.array(z.string().min(1)).refine((a) => (TOURNAMENT_SIZES as readonly number[]).includes(a.length), "Pick 4, 8 or 16 wings."),
  picks: z.array(z.string().min(1)),
});

export async function saveTournament(input: z.input<typeof tournamentSchema>): Promise<{ error: string } | never> {
  const user = await mustUser();
  const parsed = tournamentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid tournament." };
  const { name, entrants, picks } = parsed.data;
  if (new Set(entrants).size !== entrants.length) return { error: "Each wing can only enter once." };

  const found = await db.select({ id: wings.id }).from(wings).where(inArray(wings.id, entrants));
  if (found.length !== entrants.length) return { error: "Some of those wings no longer exist." };

  // Replay the bracket server-side so nobody can sneak a wing into the final.
  const bracket = buildBracket(entrants, picks);
  if (!bracket.complete) return { error: "The bracket isn't finished yet." };

  const id = await db.transaction(async (tx) => {
    const [t] = await tx
      .insert(tournaments)
      .values({ userId: user.id, name, size: entrants.length, championId: bracket.champion })
      .returning({ id: tournaments.id });
    for (const m of bracket.matches) {
      await recordBattle(tx, {
        userId: user.id,
        wingAId: m.a,
        wingBId: m.b,
        winnerId: m.winner!,
        kind: "tournament",
        tournamentId: t.id,
        round: m.round,
      });
    }
    return t.id;
  });
  redirect(`/tournaments/${id}?fresh=1`);
}
