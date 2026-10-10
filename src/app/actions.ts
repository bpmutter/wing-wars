"use server";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { spotReviews, spots, tastings, warBattlegrounds, warMembers, wars, wingTypes, wings } from "@/db/schema";
import { scoresSchema, spotScoresSchema } from "@/lib/scoring";
import { getCurrentUser } from "@/lib/session";
import { findOrCreateWingType } from "@/lib/wing-types";
import { warEnded } from "@/lib/wars";

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
const optionalId = z
  .string()
  .optional()
  .transform((v) => v || undefined);

/** Sentinel value for "create a new wing type". Must match the client forms. */
const NEW_TYPE = "__new";

async function resolveWingType(rawType: string, newType: string, userId: string) {
  if (rawType === NEW_TYPE) {
    if (newType.length < 2) return { error: "Name the new wing type." } as const;
    return { id: await findOrCreateWingType(db, newType, userId) } as const;
  }
  const [type] = await db.select({ id: wingTypes.id }).from(wingTypes).where(eq(wingTypes.id, rawType));
  return type ? ({ id: type.id } as const) : ({ error: "That wing type doesn't exist." } as const);
}

/* ── wars: shared checks ─────────────────────────────────────── */

/** Loads a war and checks the user can act in it (member, war still running). */
async function activeWarFor(warId: string, userId: string) {
  const [war] = await db.select().from(wars).where(eq(wars.id, warId));
  if (!war) return { error: "That war has vanished into the mist." } as const;
  if (warEnded(war)) return { error: "This war is over. The scorecards are sealed." } as const;
  const [member] = await db
    .select({ id: warMembers.id })
    .from(warMembers)
    .where(and(eq(warMembers.warId, warId), eq(warMembers.userId, userId)));
  if (!member) return { error: "Join the war first." } as const;
  return { war } as const;
}

async function isBattleground(warId: string, spotId: string) {
  const [row] = await db
    .select({ id: warBattlegrounds.id })
    .from(warBattlegrounds)
    .where(and(eq(warBattlegrounds.warId, warId), eq(warBattlegrounds.spotId, spotId)));
  return !!row;
}

const battlegroundPath = (warId: string, spotId: string) => `/wars/${warId}/spots/${spotId}`;

/* ── spots ───────────────────────────────────────────────────── */

const spotSchema = z.object({
  name: trimmed(80).min(2, "Give the spot a name."),
  neighborhood: trimmed(60).default(""),
  description: trimmed(400).default(""),
  /** If set, the new spot is also added to this war as a battleground. */
  warId: optionalId,
});

export async function createSpot(_: FormState, form: FormData): Promise<FormState> {
  const user = await mustUser();
  const parsed = spotSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error);
  const { warId, ...fields } = parsed.data;

  if (warId) {
    const check = await activeWarFor(warId, user.id);
    if ("error" in check) return fail(check.error!);
  }
  const [spot] = await db
    .insert(spots)
    .values({ ...fields, createdById: user.id })
    .returning({ id: spots.id });
  if (warId) {
    await db.insert(warBattlegrounds).values({ warId, spotId: spot.id, addedById: user.id });
    redirect(`${battlegroundPath(warId, spot.id)}?added=1`);
  }
  redirect(`/spots/${spot.id}?added=1`);
}

/* ── wings ───────────────────────────────────────────────────── */

const wingSchema = z.object({
  spotId: z.string().min(1),
  name: trimmed(80).min(2, "What flavor is it?"),
  wingTypeId: z.string().min(1, "Pick a wing type (or add a new one)."),
  newType: trimmed(40).default(""),
  style: z.enum(["bone-in", "boneless"]),
  heat: z.coerce.number().int().min(0).max(5),
  description: trimmed(400).default(""),
  /** If set, we came from a battleground and go back there afterwards. */
  warId: optionalId,
});

export async function createWing(_: FormState, form: FormData): Promise<FormState> {
  const user = await mustUser();
  const parsed = wingSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error);
  const { newType, wingTypeId: rawType, warId, ...fields } = parsed.data;
  const [spot] = await db.select({ id: spots.id }).from(spots).where(eq(spots.id, fields.spotId));
  if (!spot) return fail("That spot has vanished into the mist.");

  const type = await resolveWingType(rawType, newType, user.id);
  if ("error" in type) return { error: "A few things need fixing.", fieldErrors: { [rawType === NEW_TYPE ? "newType" : "wingTypeId"]: type.error! } };

  const [wing] = await db
    .insert(wings)
    .values({ ...fields, wingTypeId: type.id, createdById: user.id })
    .returning({ id: wings.id });
  if (warId && (await isBattleground(warId, spot.id))) redirect(`${battlegroundPath(warId, spot.id)}?wing=${wing.id}#wing-${wing.id}`);
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
  const type = await resolveWingType(rawType, newType, user.id);
  if ("error" in type) return fail(type.error!);
  await db
    .update(wings)
    .set({ wingTypeId: type.id })
    .where(and(eq(wings.id, wingId), isNull(wings.wingTypeId)));
  redirect(`/wings/${wingId}`);
}

/* ── solo tastings & reviews (outside any war) ───────────────── */

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

/* ── wars ────────────────────────────────────────────────────── */

const warSchema = z.object({
  name: trimmed(80).min(3, "Every war needs a name worthy of song."),
  description: trimmed(600).default(""),
  wingTypeId: optionalId,
  fogOfWar: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  endsOn: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(`${v}T23:59:59`) : undefined))
    .refine((d) => !d || (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()), "The end date must be in the future."),
  spotIds: z.array(z.string().min(1)).min(2, "Pick at least two battlegrounds — it's not much of a war otherwise."),
});

export async function createWar(_: FormState, form: FormData): Promise<FormState> {
  const user = await mustUser();
  const parsed = warSchema.safeParse({ ...Object.fromEntries(form), spotIds: form.getAll("spotIds") });
  if (!parsed.success) return fail(parsed.error);
  const { spotIds, endsOn, wingTypeId, ...fields } = parsed.data;

  const unique = [...new Set(spotIds)];
  const found = await db.select({ id: spots.id }).from(spots).where(inArray(spots.id, unique));
  if (found.length !== unique.length) return fail("Some of those spots no longer exist.");
  if (wingTypeId) {
    const [type] = await db.select({ id: wingTypes.id }).from(wingTypes).where(eq(wingTypes.id, wingTypeId));
    if (!type) return fail("That wing type doesn't exist.");
  }

  const id = await db.transaction(async (tx) => {
    const [war] = await tx
      .insert(wars)
      .values({ ...fields, wingTypeId: wingTypeId ?? null, endsAt: endsOn ?? null, hostId: user.id })
      .returning({ id: wars.id });
    await tx.insert(warMembers).values({ warId: war.id, userId: user.id });
    await tx.insert(warBattlegrounds).values(unique.map((spotId) => ({ warId: war.id, spotId, addedById: user.id })));
    return war.id;
  });
  redirect(`/wars/${id}?started=1`);
}

export async function joinWar(warId: string) {
  const user = await mustUser();
  const [war] = await db.select().from(wars).where(eq(wars.id, warId));
  if (!war || warEnded(war)) redirect(`/wars/${warId}`);
  await db.insert(warMembers).values({ warId, userId: user.id }).onConflictDoNothing();
  redirect(`/wars/${warId}?joined=1`);
}

/** Bound with the war id; adds an existing spot to the war. */
export async function addBattleground(warId: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await mustUser();
  const spotId = String(form.get("spotId") ?? "");
  if (!spotId) return fail("Pick a spot to add.");
  const check = await activeWarFor(warId, user.id);
  if ("error" in check) return fail(check.error!);
  const [spot] = await db.select({ id: spots.id }).from(spots).where(eq(spots.id, spotId));
  if (!spot) return fail("That spot has vanished into the mist.");
  await db.insert(warBattlegrounds).values({ warId, spotId, addedById: user.id }).onConflictDoNothing();
  redirect(battlegroundPath(warId, spotId));
}

export async function endWar(warId: string) {
  const user = await mustUser();
  const [war] = await db.select().from(wars).where(eq(wars.id, warId));
  if (!war || war.hostId !== user.id || warEnded(war)) redirect(`/wars/${warId}`);
  await db.update(wars).set({ endedAt: new Date() }).where(eq(wars.id, warId));
  redirect(`/wars/${warId}?revealed=1`);
}

const warScorecardSchema = scoresSchema.extend({
  warId: z.string().min(1),
  wingId: z.string().min(1),
  notes: trimmed(500).default(""),
});

/** Files (or updates) your scorecard for one wing in one war. */
export async function submitWarScorecard(_: FormState, form: FormData): Promise<FormState> {
  const user = await mustUser();
  const parsed = warScorecardSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error);
  const { warId, wingId, ...scores } = parsed.data;

  const check = await activeWarFor(warId, user.id);
  if ("error" in check) return fail(check.error!);
  const [wing] = await db.select().from(wings).where(eq(wings.id, wingId));
  if (!wing) return fail("That wing has wandered off.");
  if (!(await isBattleground(warId, wing.spotId))) return fail("That spot isn't part of this war.");
  if (check.war.wingTypeId && wing.wingTypeId !== check.war.wingTypeId) return fail("Only wings of this war's type count.");

  const now = new Date();
  await db
    .insert(tastings)
    .values({ ...scores, warId, wingId, userId: user.id, createdAt: now })
    .onConflictDoUpdate({ target: [tastings.warId, tastings.userId, tastings.wingId], set: { ...scores, createdAt: now } });
  redirect(`${battlegroundPath(warId, wing.spotId)}?saved=${wingId}#wing-${wingId}`);
}

const warReviewSchema = spotScoresSchema.extend({
  warId: z.string().min(1),
  spotId: z.string().min(1),
  notes: trimmed(500).default(""),
});

/** Files (or updates) your review of the restaurant itself in one war. */
export async function submitWarReview(_: FormState, form: FormData): Promise<FormState> {
  const user = await mustUser();
  const parsed = warReviewSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error);
  const { warId, spotId, ...scores } = parsed.data;

  const check = await activeWarFor(warId, user.id);
  if ("error" in check) return fail(check.error!);
  if (!(await isBattleground(warId, spotId))) return fail("That spot isn't part of this war.");

  const now = new Date();
  await db
    .insert(spotReviews)
    .values({ ...scores, warId, spotId, userId: user.id, createdAt: now })
    .onConflictDoUpdate({ target: [spotReviews.warId, spotReviews.userId, spotReviews.spotId], set: { ...scores, createdAt: now } });
  redirect(`${battlegroundPath(warId, spotId)}?reviewed=1#review`);
}
