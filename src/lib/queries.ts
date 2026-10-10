import "server-only";
import { aliasedTable, and, asc, count, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { battles, spots, tastings, tournaments, user, wings } from "@/db/schema";
import { average, type Scores } from "./scoring";

/* ── helpers ─────────────────────────────────────────────────── */

const tastingStats = db
  .select({
    wingId: tastings.wingId,
    tastingCount: count().as("tasting_count"),
    avgTotal: sql<number>`avg(${tastings.crisp} + ${tastings.sauce} + ${tastings.juiciness} + ${tastings.heat} + ${tastings.value})`.as("avg_total"),
  })
  .from(tastings)
  .groupBy(tastings.wingId)
  .as("ts");

const wingListSelect = {
  id: wings.id,
  name: wings.name,
  style: wings.style,
  heat: wings.heat,
  elo: wings.elo,
  wins: wings.wins,
  losses: wings.losses,
  spotId: spots.id,
  spotName: spots.name,
  neighborhood: spots.neighborhood,
  tastingCount: sql<number>`coalesce(${tastingStats.tastingCount}, 0)`,
  avgTotal: tastingStats.avgTotal,
};

export type WingListItem = Awaited<ReturnType<typeof listWings>>[number];

/* ── wings ───────────────────────────────────────────────────── */

export async function listWings(opts: { sort?: "elo" | "new" | "tasted"; limit?: number } = {}) {
  const order =
    opts.sort === "new"
      ? [desc(wings.createdAt)]
      : opts.sort === "tasted"
        ? [desc(sql`coalesce(${tastingStats.tastingCount}, 0)`), desc(wings.elo)]
        : [desc(wings.elo), desc(wings.wins)];
  const q = db
    .select(wingListSelect)
    .from(wings)
    .innerJoin(spots, eq(wings.spotId, spots.id))
    .leftJoin(tastingStats, eq(tastingStats.wingId, wings.id))
    .orderBy(...order);
  return opts.limit ? q.limit(opts.limit) : q;
}

export async function getWing(id: string) {
  const [row] = await db
    .select({ wing: wings, spot: spots })
    .from(wings)
    .innerJoin(spots, eq(wings.spotId, spots.id))
    .where(eq(wings.id, id));
  if (!row) return null;

  const notes = await db
    .select({ tasting: tastings, userName: user.name })
    .from(tastings)
    .innerJoin(user, eq(tastings.userId, user.id))
    .where(eq(tastings.wingId, id))
    .orderBy(desc(tastings.createdAt));

  const [{ place }] = await db
    .select({ place: sql<number>`count(*) + 1` })
    .from(wings)
    .where(sql`${wings.elo} > ${row.wing.elo}`);

  return {
    ...row,
    tastings: notes,
    averages: average(notes.map((n) => n.tasting as Scores)),
    place: Number(place),
  };
}

/** Every wing, lightly, for the battle picker. */
export async function wingOptions() {
  return db
    .select({
      id: wings.id,
      name: wings.name,
      style: wings.style,
      heat: wings.heat,
      elo: wings.elo,
      spotName: spots.name,
    })
    .from(wings)
    .innerJoin(spots, eq(wings.spotId, spots.id))
    .orderBy(asc(spots.name), asc(wings.name));
}

export type WingOption = Awaited<ReturnType<typeof wingOptions>>[number];

/* ── spots ───────────────────────────────────────────────────── */

export async function listSpots() {
  const rows = await db
    .select({
      id: spots.id,
      name: spots.name,
      neighborhood: spots.neighborhood,
      description: spots.description,
      wingCount: sql<number>`count(${wings.id})`,
      bestElo: sql<number | null>`max(${wings.elo})`,
      wins: sql<number>`coalesce(sum(${wings.wins}), 0)`,
      losses: sql<number>`coalesce(sum(${wings.losses}), 0)`,
    })
    .from(spots)
    .leftJoin(wings, eq(wings.spotId, spots.id))
    .groupBy(spots.id)
    .orderBy(desc(sql`max(${wings.elo})`), asc(spots.name));
  return rows;
}

export async function getSpot(id: string) {
  const [spot] = await db.select().from(spots).where(eq(spots.id, id));
  if (!spot) return null;
  const spotWings = await db
    .select(wingListSelect)
    .from(wings)
    .innerJoin(spots, eq(wings.spotId, spots.id))
    .leftJoin(tastingStats, eq(tastingStats.wingId, wings.id))
    .where(eq(wings.spotId, id))
    .orderBy(desc(wings.elo));
  return { spot, wings: spotWings };
}

/* ── battles ─────────────────────────────────────────────────── */

const wingA = aliasedTable(wings, "wing_a");
const wingB = aliasedTable(wings, "wing_b");
const spotA = aliasedTable(spots, "spot_a");
const spotB = aliasedTable(spots, "spot_b");

const battleSelect = {
  id: battles.id,
  kind: battles.kind,
  createdAt: battles.createdAt,
  verdict: battles.verdict,
  winnerId: battles.winnerId,
  tournamentId: battles.tournamentId,
  round: battles.round,
  eloBeforeA: battles.eloBeforeA,
  eloBeforeB: battles.eloBeforeB,
  eloDeltaA: battles.eloDeltaA,
  eloDeltaB: battles.eloDeltaB,
  userId: battles.userId,
  userName: user.name,
  a: { id: wingA.id, name: wingA.name, heat: wingA.heat, style: wingA.style, spotName: spotA.name, spotId: spotA.id },
  b: { id: wingB.id, name: wingB.name, heat: wingB.heat, style: wingB.style, spotName: spotB.name, spotId: spotB.id },
};

function battleQuery() {
  return db
    .select(battleSelect)
    .from(battles)
    .innerJoin(user, eq(battles.userId, user.id))
    .innerJoin(wingA, eq(battles.wingAId, wingA.id))
    .innerJoin(wingB, eq(battles.wingBId, wingB.id))
    .innerJoin(spotA, eq(wingA.spotId, spotA.id))
    .innerJoin(spotB, eq(wingB.spotId, spotB.id));
}

export type BattleListItem = Awaited<ReturnType<typeof recentBattles>>[number];

export async function recentBattles(opts: { limit?: number; wingId?: string; userId?: string; kind?: "duel" | "tournament" } = {}) {
  const filters = [];
  if (opts.wingId) filters.push(or(eq(battles.wingAId, opts.wingId), eq(battles.wingBId, opts.wingId)));
  if (opts.userId) filters.push(eq(battles.userId, opts.userId));
  if (opts.kind) filters.push(eq(battles.kind, opts.kind));
  return battleQuery()
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(battles.createdAt), desc(sql`"battles"."rowid"`))
    .limit(opts.limit ?? 20);
}

export async function getBattle(id: string) {
  const [battle] = await battleQuery().where(eq(battles.id, id));
  if (!battle) return null;
  const cards = await db.select().from(tastings).where(eq(tastings.battleId, id));
  const cardA = cards.find((c) => c.wingId === battle.a.id) ?? null;
  const cardB = cards.find((c) => c.wingId === battle.b.id) ?? null;

  // All-time head-to-head record between these two wings.
  const h2h = await db
    .select({ winnerId: battles.winnerId, n: count() })
    .from(battles)
    .where(
      or(
        and(eq(battles.wingAId, battle.a.id), eq(battles.wingBId, battle.b.id)),
        and(eq(battles.wingAId, battle.b.id), eq(battles.wingBId, battle.a.id)),
      ),
    )
    .groupBy(battles.winnerId);
  const record = {
    a: h2h.find((r) => r.winnerId === battle.a.id)?.n ?? 0,
    b: h2h.find((r) => r.winnerId === battle.b.id)?.n ?? 0,
  };
  return { battle, cardA, cardB, record };
}

/* ── tournaments ─────────────────────────────────────────────── */

export async function getTournament(id: string) {
  const [row] = await db
    .select({ tournament: tournaments, userName: user.name })
    .from(tournaments)
    .innerJoin(user, eq(tournaments.userId, user.id))
    .where(eq(tournaments.id, id));
  if (!row) return null;
  const matches = await battleQuery()
    .where(eq(battles.tournamentId, id))
    .orderBy(asc(battles.round), asc(sql`"battles"."rowid"`));
  return { ...row, matches };
}

export async function recentTournaments(limit = 6) {
  const champ = aliasedTable(wings, "champ");
  return db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      size: tournaments.size,
      createdAt: tournaments.createdAt,
      userName: user.name,
      championName: champ.name,
      championId: champ.id,
      championSpot: spots.name,
    })
    .from(tournaments)
    .innerJoin(user, eq(tournaments.userId, user.id))
    .leftJoin(champ, eq(tournaments.championId, champ.id))
    .leftJoin(spots, eq(champ.spotId, spots.id))
    .orderBy(desc(tournaments.createdAt))
    .limit(limit);
}

/* ── people ──────────────────────────────────────────────────── */

export async function getJudge(userId: string) {
  const [judge] = await db
    .select({ id: user.id, name: user.name, image: user.image, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.id, userId));
  if (!judge) return null;

  const notes = await db
    .select({
      tasting: tastings,
      wingName: wings.name,
      spotName: spots.name,
    })
    .from(tastings)
    .innerJoin(wings, eq(tastings.wingId, wings.id))
    .innerJoin(spots, eq(wings.spotId, spots.id))
    .where(eq(tastings.userId, userId))
    .orderBy(desc(tastings.createdAt))
    .limit(50);

  const [{ battleCount }] = await db
    .select({ battleCount: count() })
    .from(battles)
    .where(eq(battles.userId, userId));

  const tasted = new Set(notes.map((n) => n.tasting.wingId));

  return {
    judge,
    tastings: notes,
    battleCount,
    tastedWingCount: tasted.size,
    battles: await recentBattles({ userId, limit: 10 }),
  };
}

export async function topJudges(limit = 5) {
  return db
    .select({ id: user.id, name: user.name, battles: count(battles.id) })
    .from(user)
    .innerJoin(battles, eq(battles.userId, user.id))
    .groupBy(user.id)
    .orderBy(desc(count(battles.id)))
    .limit(limit);
}

/* ── home page ───────────────────────────────────────────────── */

export async function worldStats() {
  const [[w], [s], [b], [t]] = await Promise.all([
    db.select({ n: count() }).from(wings),
    db.select({ n: count() }).from(spots),
    db.select({ n: count() }).from(battles),
    db.select({ n: count() }).from(tastings),
  ]);
  return { wings: w.n, spots: s.n, battles: b.n, tastings: t.n };
}

export async function wingsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return db
    .select({ id: wings.id, name: wings.name, spotName: spots.name, elo: wings.elo })
    .from(wings)
    .innerJoin(spots, eq(wings.spotId, spots.id))
    .where(inArray(wings.id, ids));
}
