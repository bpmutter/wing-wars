"use server";

import { eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { spots, tastings, tournaments, wings } from "@/db/schema";
import { recordBattle } from "@/lib/battle-engine";
import { scoresSchema } from "@/lib/scoring";
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

const wingSchema = z.object({
  spotId: z.string().min(1),
  name: trimmed(80).min(2, "What flavor is it?"),
  style: z.enum(["bone-in", "boneless"]),
  heat: z.coerce.number().int().min(0).max(5),
  description: trimmed(400).default(""),
});

export async function createWing(_: FormState, form: FormData): Promise<FormState> {
  const user = await mustUser();
  const parsed = wingSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error);
  const [spot] = await db.select({ id: spots.id }).from(spots).where(eq(spots.id, parsed.data.spotId));
  if (!spot) return fail("That spot has vanished into the mist.");
  const [wing] = await db
    .insert(wings)
    .values({ ...parsed.data, createdById: user.id })
    .returning({ id: wings.id });
  redirect(`/wings/${wing.id}?added=1`);
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
