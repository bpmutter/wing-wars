import "server-only";
import { aliasedTable, and, asc, count, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { battles, spotBattles, spotReviews, spots, tastings, tournaments, user, wingTypes, wings } from "@/db/schema";
import { average, spotAverage, type Scores, type SpotScores } from "./scoring";

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
  typeId: wingTypes.id,
  typeName: wingTypes.name,
  typeEmoji: wingTypes.emoji,
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

const wingA = aliasedTable(wings, "wing_a");
const wingB = aliasedTable(wings, "wing_b");
const spotA = aliasedTable(spots, "spot_a");
const spotB = aliasedTable(spots, "spot_b");

/* ── wings ───────────────────────────────────────────────────── */

export async function listWings(opts: { sort?: "elo" | "new" | "tasted"; limit?: number; typeId?: string } = {}) {
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
    .leftJoin(wingTypes, eq(wings.wingTypeId, wingTypes.id))
    .leftJoin(tastingStats, eq(tastingStats.wingId, wings.id))
    .where(opts.typeId ? eq(wings.wingTypeId, opts.typeId) : undefined)
    .orderBy(...order);
  return opts.limit ? q.limit(opts.limit) : q;
}

export async function getWing(id: string) {
  const [row] = await db
    .select({ wing: wings, spot: spots, type: wingTypes })
    .from(wings)
    .innerJoin(spots, eq(wings.spotId, spots.id))
    .leftJoin(wingTypes, eq(wings.wingTypeId, wingTypes.id))
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

  let typePlace: number | null = null;
  if (row.wing.wingTypeId) {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*) + 1` })
      .from(wings)
      .where(and(eq(wings.wingTypeId, row.wing.wingTypeId), sql`${wings.elo} > ${row.wing.elo}`));
    typePlace = Number(n);
  }

  return {
    ...row,
    tastings: notes,
    averages: average(notes.map((n) => n.tasting as Scores)),
    place: Number(place),
    typePlace,
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
      typeId: wings.wingTypeId,
      typeName: wingTypes.name,
    })
    .from(wings)
    .innerJoin(spots, eq(wings.spotId, spots.id))
    .leftJoin(wingTypes, eq(wings.wingTypeId, wingTypes.id))
    .orderBy(asc(spots.name), asc(wings.name));
}

export type WingOption = Awaited<ReturnType<typeof wingOptions>>[number];

/* ── spots ───────────────────────────────────────────────────── */

const reviewStats = db
  .select({
    spotId: spotReviews.spotId,
    reviewCount: count().as("review_count"),
    avgTotal: sql<number>`avg(${spotReviews.wingGame} + ${spotReviews.sides} + ${spotReviews.vibe} + ${spotReviews.service} + ${spotReviews.value})`.as("avg_spot_total"),
  })
  .from(spotReviews)
  .groupBy(spotReviews.spotId)
  .as("rs");

export type SpotListItem = Awaited<ReturnType<typeof listSpots>>[number];

export async function listSpots(opts: { limit?: number } = {}) {
  const wingCounts = db
    .select({ spotId: wings.spotId, wingCount: count().as("wing_count"), bestWingElo: sql<number>`max(${wings.elo})`.as("best_wing_elo") })
    .from(wings)
    .groupBy(wings.spotId)
    .as("wc");
  const q = db
    .select({
      id: spots.id,
      name: spots.name,
      neighborhood: spots.neighborhood,
      description: spots.description,
      elo: spots.elo,
      wins: spots.wins,
      losses: spots.losses,
      wingCount: sql<number>`coalesce(${wingCounts.wingCount}, 0)`,
      bestWingElo: wingCounts.bestWingElo,
      reviewCount: sql<number>`coalesce(${reviewStats.reviewCount}, 0)`,
      avgTotal: reviewStats.avgTotal,
    })
    .from(spots)
    .leftJoin(wingCounts, eq(wingCounts.spotId, spots.id))
    .leftJoin(reviewStats, eq(reviewStats.spotId, spots.id))
    .orderBy(desc(spots.elo), asc(spots.name));
  return opts.limit ? q.limit(opts.limit) : q;
}

export async function getSpot(id: string) {
  const [spot] = await db.select().from(spots).where(eq(spots.id, id));
  if (!spot) return null;
  const spotWings = await db
    .select(wingListSelect)
    .from(wings)
    .innerJoin(spots, eq(wings.spotId, spots.id))
    .leftJoin(wingTypes, eq(wings.wingTypeId, wingTypes.id))
    .leftJoin(tastingStats, eq(tastingStats.wingId, wings.id))
    .where(eq(wings.spotId, id))
    .orderBy(desc(wings.elo));

  const reviews = await db
    .select({ review: spotReviews, userName: user.name })
    .from(spotReviews)
    .innerJoin(user, eq(spotReviews.userId, user.id))
    .where(eq(spotReviews.spotId, id))
    .orderBy(desc(spotReviews.createdAt));

  const [{ place }] = await db
    .select({ place: sql<number>`count(*) + 1` })
    .from(spots)
    .where(sql`${spots.elo} > ${spot.elo}`);

  return {
    spot,
    wings: spotWings,
    reviews,
    averages: spotAverage(reviews.map((r) => r.review as SpotScores)),
    place: Number(place),
  };
}

/** Every spot, lightly, for the spot battle picker. */
export async function spotOptions() {
  return db
    .select({ id: spots.id, name: spots.name, neighborhood: spots.neighborhood, elo: spots.elo })
    .from(spots)
    .orderBy(asc(spots.name));
}

export type SpotOption = Awaited<ReturnType<typeof spotOptions>>[number];

/* ── spot battles ────────────────────────────────────────────── */

const spotBattleSelect = {
  id: spotBattles.id,
  createdAt: spotBattles.createdAt,
  verdict: spotBattles.verdict,
  winnerId: spotBattles.winnerId,
  eloBeforeA: spotBattles.eloBeforeA,
  eloBeforeB: spotBattles.eloBeforeB,
  eloDeltaA: spotBattles.eloDeltaA,
  eloDeltaB: spotBattles.eloDeltaB,
  userId: spotBattles.userId,
  userName: user.name,
  a: { id: spotA.id, name: spotA.name, neighborhood: spotA.neighborhood },
  b: { id: spotB.id, name: spotB.name, neighborhood: spotB.neighborhood },
};

function spotBattleQuery() {
  return db
    .select(spotBattleSelect)
    .from(spotBattles)
    .innerJoin(user, eq(spotBattles.userId, user.id))
    .innerJoin(spotA, eq(spotBattles.spotAId, spotA.id))
    .innerJoin(spotB, eq(spotBattles.spotBId, spotB.id));
}

export type SpotBattleListItem = Awaited<ReturnType<typeof recentSpotBattles>>[number];

export async function recentSpotBattles(opts: { limit?: number; spotId?: string; userId?: string } = {}) {
  const filters = [];
  if (opts.spotId) filters.push(or(eq(spotBattles.spotAId, opts.spotId), eq(spotBattles.spotBId, opts.spotId)));
  if (opts.userId) filters.push(eq(spotBattles.userId, opts.userId));
  return spotBattleQuery()
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(spotBattles.createdAt), desc(sql`"spot_battles"."rowid"`))
    .limit(opts.limit ?? 20);
}

export async function getSpotBattle(id: string) {
  const [battle] = await spotBattleQuery().where(eq(spotBattles.id, id));
  if (!battle) return null;
  const cards = await db.select().from(spotReviews).where(eq(spotReviews.spotBattleId, id));
  const cardA = cards.find((c) => c.spotId === battle.a.id) ?? null;
  const cardB = cards.find((c) => c.spotId === battle.b.id) ?? null;
  const h2h = await db
    .select({ winnerId: spotBattles.winnerId, n: count() })
    .from(spotBattles)
    .where(
      or(
        and(eq(spotBattles.spotAId, battle.a.id), eq(spotBattles.spotBId, battle.b.id)),
        and(eq(spotBattles.spotAId, battle.b.id), eq(spotBattles.spotBId, battle.a.id)),
      ),
    )
    .groupBy(spotBattles.winnerId);
  const record = {
    a: h2h.find((r) => r.winnerId === battle.a.id)?.n ?? 0,
    b: h2h.find((r) => r.winnerId === battle.b.id)?.n ?? 0,
  };
  return { battle, cardA, cardB, record };
}

/* ── wing types ──────────────────────────────────────────────── */

/**
 * Win/loss record of each wing type in battles *between different types*
 * (Buffalo vs Buffalo tells us nothing about Buffalo as a whole).
 */
async function crossTypeRecords() {
  const rows = await db
    .select({ typeA: wingA.wingTypeId, typeB: wingB.wingTypeId, aWon: sql<number>`${battles.winnerId} = ${battles.wingAId}` })
    .from(battles)
    .innerJoin(wingA, eq(battles.wingAId, wingA.id))
    .innerJoin(wingB, eq(battles.wingBId, wingB.id))
    .where(sql`${wingA.wingTypeId} is not null and ${wingB.wingTypeId} is not null and ${wingA.wingTypeId} != ${wingB.wingTypeId}`);
  const rec = new Map<string, { wins: number; losses: number }>();
  const bump = (id: string, won: boolean) => {
    const r = rec.get(id) ?? { wins: 0, losses: 0 };
    if (won) r.wins++;
    else r.losses++;
    rec.set(id, r);
  };
  for (const r of rows) {
    bump(r.typeA!, !!r.aWon);
    bump(r.typeB!, !r.aWon);
  }
  return rec;
}

export type WingTypeListItem = Awaited<ReturnType<typeof listWingTypes>>[number];

export async function listWingTypes() {
  const champ = aliasedTable(wings, "type_champ");
  const rows = await db
    .select({
      id: wingTypes.id,
      name: wingTypes.name,
      emoji: wingTypes.emoji,
      description: wingTypes.description,
      wingCount: count(wings.id),
      avgElo: sql<number | null>`avg(${wings.elo})`,
      bestElo: sql<number | null>`max(${wings.elo})`,
    })
    .from(wingTypes)
    .leftJoin(wings, eq(wings.wingTypeId, wingTypes.id))
    .groupBy(wingTypes.id);

  // The best wing of each type.
  const tops = await db
    .select({ typeId: champ.wingTypeId, id: champ.id, name: champ.name, heat: champ.heat, style: champ.style, elo: champ.elo, spotName: spots.name })
    .from(champ)
    .innerJoin(spots, eq(champ.spotId, spots.id))
    .where(sql`${champ.elo} = (select max(w2.elo) from wings w2 where w2.wing_type_id = ${champ.wingTypeId})`);
  const topByType = new Map(tops.map((t) => [t.typeId, t]));
  const records = await crossTypeRecords();

  return rows
    .map((r) => {
      const rec = records.get(r.id) ?? { wins: 0, losses: 0 };
      return { ...r, ...rec, top: topByType.get(r.id) ?? null };
    })
    .sort((x, y) => {
      // Types with wings first, then types with a cross-type record (by win rate), then by average rating.
      if (!!x.wingCount !== !!y.wingCount) return x.wingCount ? -1 : 1;
      const px = x.wins + x.losses;
      const py = y.wins + y.losses;
      if (!!px !== !!py) return px ? -1 : 1;
      const rx = px ? x.wins / px : 0;
      const ry = py ? y.wins / py : 0;
      if (rx !== ry) return ry - rx;
      return Number(y.avgElo ?? 0) - Number(x.avgElo ?? 0);
    });
}

export async function getWingType(id: string) {
  const [type] = await db.select().from(wingTypes).where(eq(wingTypes.id, id));
  if (!type) return null;
  const typeWings = await listWings({ typeId: id });
  const record = (await crossTypeRecords()).get(id) ?? { wins: 0, losses: 0 };
  return { type, wings: typeWings, record };
}

export async function wingTypeOptions() {
  return db.select({ id: wingTypes.id, name: wingTypes.name, emoji: wingTypes.emoji }).from(wingTypes).orderBy(asc(wingTypes.name));
}

export type WingTypeOption = Awaited<ReturnType<typeof wingTypeOptions>>[number];

/* ── battles ─────────────────────────────────────────────────── */


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

  const reviews = await db
    .select({ review: spotReviews, spotName: spots.name })
    .from(spotReviews)
    .innerJoin(spots, eq(spotReviews.spotId, spots.id))
    .where(eq(spotReviews.userId, userId))
    .orderBy(desc(spotReviews.createdAt))
    .limit(50);

  const [{ spotBattleCount }] = await db
    .select({ spotBattleCount: count() })
    .from(spotBattles)
    .where(eq(spotBattles.userId, userId));

  return {
    judge,
    tastings: notes,
    reviews,
    battleCount,
    spotBattleCount,
    tastedWingCount: tasted.size,
    battles: await recentBattles({ userId, limit: 10 }),
    spotBattles: await recentSpotBattles({ userId, limit: 10 }),
  };
}

export async function topJudges(limit = 5) {
  // Spelled out: drizzle drops the table prefix on single-table queries, which breaks the correlation.
  const n = sql<number>`(select count(*) from battles b where b.user_id = "user"."id") + (select count(*) from spot_battles sb where sb.user_id = "user"."id")`;
  return db
    .select({ id: user.id, name: user.name, battles: n })
    .from(user)
    .where(sql`${n} > 0`)
    .orderBy(desc(n))
    .limit(limit);
}

/* ── home page ───────────────────────────────────────────────── */

export async function worldStats() {
  const [[w], [s], [b], [sb], [t], [r]] = await Promise.all([
    db.select({ n: count() }).from(wings),
    db.select({ n: count() }).from(spots),
    db.select({ n: count() }).from(battles),
    db.select({ n: count() }).from(spotBattles),
    db.select({ n: count() }).from(tastings),
    db.select({ n: count() }).from(spotReviews),
  ]);
  return { wings: w.n, spots: s.n, battles: b.n + sb.n, tastings: t.n + r.n };
}

export async function wingsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return db
    .select({ id: wings.id, name: wings.name, spotName: spots.name, elo: wings.elo })
    .from(wings)
    .innerJoin(spots, eq(wings.spotId, spots.id))
    .where(inArray(wings.id, ids));
}
