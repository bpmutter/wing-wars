import "server-only";
import { and, asc, count, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { spotReviews, spots, tastings, user, warBattlegrounds, warMembers, wars, wingTypes, wings } from "@/db/schema";
import { average, spotAverage, type Scores, type SpotScores } from "./scoring";
import { computeWarResults, PRIOR_WEIGHT } from "./war-results";
import { battleVisible, resultsVisible, warEnded } from "./wars";

/*
 * Rankings everywhere use a Bayesian average (see war-results.ts) so that a
 * wing with one 10/10 scorecard doesn't outrank one with twenty 9s.
 */

const wingTotal = sql<number>`(${tastings.crisp} + ${tastings.sauce} + ${tastings.juiciness} + ${tastings.heat} + ${tastings.value})`;
const reviewTotal = sql<number>`(${spotReviews.wingGame} + ${spotReviews.sides} + ${spotReviews.vibe} + ${spotReviews.service} + ${spotReviews.value})`;

/**
 * Scorecards from a war still under fog of war stay out of every public view
 * (wing pages, judge journals, the Hall of Fame) until the war ends — otherwise
 * the fog would be easy to peek around. They're only shown inside the war itself.
 */
function unfogged(table: "tastings" | "spot_reviews") {
  const warId = sql.raw(`"${table}"."war_id"`);
  return sql`(${warId} is null or exists (select 1 from wars fw where fw.id = ${warId} and (fw.fog_of_war = 0 or fw.ended_at is not null or (fw.ends_at is not null and fw.ends_at <= ${Date.now()}))))`;
}

function tastingStatsQuery() {
  return db
    .select({
      wingId: tastings.wingId,
      tastingCount: count().as("tasting_count"),
      sumTotal: sql<number>`sum(${wingTotal})`.as("sum_total"),
    })
    .from(tastings)
    .where(unfogged("tastings"))
    .groupBy(tastings.wingId)
    .as("ts");
}

async function globalWingMean() {
  const [row] = await db.select({ m: sql<number | null>`avg(${wingTotal})` }).from(tastings).where(unfogged("tastings"));
  return Number(row?.m ?? 30);
}

async function globalReviewMean() {
  const [row] = await db.select({ m: sql<number | null>`avg(${reviewTotal})` }).from(spotReviews).where(unfogged("spot_reviews"));
  return Number(row?.m ?? 30);
}

/** Bayesian score from a sum and a count, without needing every value. */
function adjusted(sum: number, n: number, prior: number) {
  return (sum + prior * PRIOR_WEIGHT) / (n + PRIOR_WEIGHT);
}

/* ── wings ───────────────────────────────────────────────────── */

export type WingListItem = Awaited<ReturnType<typeof listWings>>[number];

export async function listWings(opts: { sort?: "top" | "new" | "tasted"; typeId?: string; spotId?: string; limit?: number } = {}) {
  const filters = [];
  if (opts.typeId) filters.push(eq(wings.wingTypeId, opts.typeId));
  if (opts.spotId) filters.push(eq(wings.spotId, opts.spotId));
  const tastingStats = tastingStatsQuery();
  const [rows, prior] = await Promise.all([
    db
      .select({
        id: wings.id,
        name: wings.name,
        style: wings.style,
        heat: wings.heat,
        createdAt: wings.createdAt,
        typeId: wingTypes.id,
        typeName: wingTypes.name,
        typeEmoji: wingTypes.emoji,
        spotId: spots.id,
        spotName: spots.name,
        neighborhood: spots.neighborhood,
        tastingCount: sql<number>`coalesce(${tastingStats.tastingCount}, 0)`,
        sumTotal: sql<number>`coalesce(${tastingStats.sumTotal}, 0)`,
      })
      .from(wings)
      .innerJoin(spots, eq(wings.spotId, spots.id))
      .leftJoin(wingTypes, eq(wings.wingTypeId, wingTypes.id))
      .leftJoin(tastingStats, eq(tastingStats.wingId, wings.id))
      .where(filters.length ? and(...filters) : undefined),
    globalWingMean(),
  ]);
  const list = rows.map((r) => {
    const n = Number(r.tastingCount);
    return {
      ...r,
      tastingCount: n,
      avgTotal: n ? Number(r.sumTotal) / n : null,
      score: n ? adjusted(Number(r.sumTotal), n, prior) : null,
    };
  });
  list.sort((a, b) => {
    if (opts.sort === "new") return b.createdAt.getTime() - a.createdAt.getTime();
    if (opts.sort === "tasted") return b.tastingCount - a.tastingCount || (b.score ?? 0) - (a.score ?? 0);
    if ((a.score === null) !== (b.score === null)) return a.score === null ? 1 : -1;
    return (b.score ?? 0) - (a.score ?? 0) || a.name.localeCompare(b.name);
  });
  return opts.limit ? list.slice(0, opts.limit) : list;
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
    .select({ tasting: tastings, userName: user.name, warName: wars.name })
    .from(tastings)
    .innerJoin(user, eq(tastings.userId, user.id))
    .leftJoin(wars, eq(tastings.warId, wars.id))
    .where(and(eq(tastings.wingId, id), unfogged("tastings")))
    .orderBy(desc(tastings.createdAt));

  const all = await listWings();
  const place = all.findIndex((w) => w.id === id) + 1;
  const ofType = row.wing.wingTypeId ? all.filter((w) => w.typeId === row.wing.wingTypeId) : [];
  const typePlace = ofType.findIndex((w) => w.id === id) + 1 || null;
  const me = all.find((w) => w.id === id)!;

  return {
    ...row,
    tastings: notes,
    averages: average(notes.map((n) => n.tasting as Scores)),
    avgTotal: me.avgTotal,
    score: me.score,
    place: me.score === null ? null : place,
    typePlace: me.score === null ? null : typePlace,
  };
}

/* ── spots ───────────────────────────────────────────────────── */

export type SpotListItem = Awaited<ReturnType<typeof listSpots>>[number];

export async function listSpots(opts: { limit?: number } = {}) {
  const reviewStats = db
    .select({ spotId: spotReviews.spotId, n: count().as("review_count"), sum: sql<number>`sum(${reviewTotal})`.as("review_sum") })
    .from(spotReviews)
    .where(unfogged("spot_reviews"))
    .groupBy(spotReviews.spotId)
    .as("rs");
  const wingStats = db
    .select({
      spotId: wings.spotId,
      wingCount: sql<number>`count(distinct ${wings.id})`.as("wing_count"),
      tastingCount: sql<number>`count(${tastings.id})`.as("spot_tasting_count"),
      avgWing: sql<number | null>`avg(${wingTotal})`.as("avg_wing"),
    })
    .from(wings)
    .leftJoin(tastings, and(eq(tastings.wingId, wings.id), unfogged("tastings")))
    .groupBy(wings.spotId)
    .as("ws");

  const [rows, prior, crowns] = await Promise.all([
    db
      .select({
        id: spots.id,
        name: spots.name,
        neighborhood: spots.neighborhood,
        description: spots.description,
        reviewCount: sql<number>`coalesce(${reviewStats.n}, 0)`,
        reviewSum: sql<number>`coalesce(${reviewStats.sum}, 0)`,
        wingCount: sql<number>`coalesce(${wingStats.wingCount}, 0)`,
        tastingCount: sql<number>`coalesce(${wingStats.tastingCount}, 0)`,
        avgWing: wingStats.avgWing,
      })
      .from(spots)
      .leftJoin(reviewStats, eq(reviewStats.spotId, spots.id))
      .leftJoin(wingStats, eq(wingStats.spotId, spots.id)),
    globalReviewMean(),
    warCrowns(),
  ]);

  const list = rows.map((r) => {
    const n = Number(r.reviewCount);
    return {
      ...r,
      reviewCount: n,
      wingCount: Number(r.wingCount),
      tastingCount: Number(r.tastingCount),
      avgWing: r.avgWing == null ? null : Number(r.avgWing),
      avgReview: n ? Number(r.reviewSum) / n : null,
      score: n ? adjusted(Number(r.reviewSum), n, prior) : null,
      warsWon: crowns.get(r.id) ?? 0,
    };
  });
  list.sort((a, b) => {
    if ((a.score === null) !== (b.score === null)) return a.score === null ? 1 : -1;
    return b.warsWon - a.warsWon || (b.score ?? 0) - (a.score ?? 0) || a.name.localeCompare(b.name);
  });
  return opts.limit ? list.slice(0, opts.limit) : list;
}

export async function getSpot(id: string) {
  const [spot] = await db.select().from(spots).where(eq(spots.id, id));
  if (!spot) return null;
  const [spotWings, reviews, warRows] = await Promise.all([
    listWings({ spotId: id }),
    db
      .select({ review: spotReviews, userName: user.name, warName: wars.name })
      .from(spotReviews)
      .innerJoin(user, eq(spotReviews.userId, user.id))
      .leftJoin(wars, eq(spotReviews.warId, wars.id))
      .where(and(eq(spotReviews.spotId, id), unfogged("spot_reviews")))
      .orderBy(desc(spotReviews.createdAt)),
    db
      .select({ id: wars.id })
      .from(warBattlegrounds)
      .innerJoin(wars, eq(warBattlegrounds.warId, wars.id))
      .where(eq(warBattlegrounds.spotId, id))
      .orderBy(desc(wars.createdAt)),
  ]);
  const summaries = await warSummaries(warRows.map((w) => w.id));
  const all = await listSpots();
  const me = all.find((s) => s.id === id)!;
  return {
    spot,
    wings: spotWings,
    reviews,
    averages: spotAverage(reviews.map((r) => r.review as SpotScores)),
    avgReview: me.avgReview,
    avgWing: me.avgWing,
    place: me.score === null ? null : all.findIndex((s) => s.id === id) + 1,
    warsWon: me.warsWon,
    wars: summaries.map((w) => ({ ...w, place: w.visible ? (w.standings.find((s) => s.spotId === id)?.place ?? null) : null })),
  };
}

export async function spotOptions() {
  return db
    .select({ id: spots.id, name: spots.name, neighborhood: spots.neighborhood })
    .from(spots)
    .orderBy(asc(spots.name));
}

/* ── wing types ──────────────────────────────────────────────── */

export async function listWingTypes() {
  const [types, allWings] = await Promise.all([db.select().from(wingTypes), listWings()]);
  return types
    .map((t) => {
      const mine = allWings.filter((w) => w.typeId === t.id);
      const tasted = mine.filter((w) => w.tastingCount > 0);
      const n = tasted.reduce((s, w) => s + w.tastingCount, 0);
      const sum = tasted.reduce((s, w) => s + (w.avgTotal ?? 0) * w.tastingCount, 0);
      return {
        ...t,
        wingCount: mine.length,
        spotCount: new Set(mine.map((w) => w.spotId)).size,
        tastingCount: n,
        avgTotal: n ? sum / n : null,
        top: mine.find((w) => w.score !== null) ?? null,
      };
    })
    .sort((a, b) => {
      if (!!a.wingCount !== !!b.wingCount) return a.wingCount ? -1 : 1;
      if ((a.avgTotal === null) !== (b.avgTotal === null)) return a.avgTotal === null ? 1 : -1;
      return (b.avgTotal ?? 0) - (a.avgTotal ?? 0) || a.name.localeCompare(b.name);
    });
}

export type WingTypeListItem = Awaited<ReturnType<typeof listWingTypes>>[number];

export async function getWingType(id: string) {
  const [type] = await db.select().from(wingTypes).where(eq(wingTypes.id, id));
  if (!type) return null;
  const [typeWings, typeWars] = await Promise.all([
    listWings({ typeId: id }),
    db.select({ id: wars.id }).from(wars).where(eq(wars.wingTypeId, id)).orderBy(desc(wars.createdAt)),
  ]);
  return { type, wings: typeWings, wars: await warSummaries(typeWars.map((w) => w.id)) };
}

export async function wingTypeOptions() {
  return db.select({ id: wingTypes.id, name: wingTypes.name, emoji: wingTypes.emoji }).from(wingTypes).orderBy(asc(wingTypes.name));
}

export type WingTypeOption = Awaited<ReturnType<typeof wingTypeOptions>>[number];

/* ── wars ────────────────────────────────────────────────────── */

/** Loads everything needed to compute a war's results. */
async function loadWar(id: string) {
  const [row] = await db
    .select({ war: wars, hostName: user.name, type: wingTypes })
    .from(wars)
    .innerJoin(user, eq(wars.hostId, user.id))
    .leftJoin(wingTypes, eq(wars.wingTypeId, wingTypes.id))
    .where(eq(wars.id, id));
  if (!row) return null;

  const [grounds, members, cards, reviews] = await Promise.all([
    db
      .select({ spotId: spots.id, name: spots.name, neighborhood: spots.neighborhood, addedAt: warBattlegrounds.createdAt })
      .from(warBattlegrounds)
      .innerJoin(spots, eq(warBattlegrounds.spotId, spots.id))
      .where(eq(warBattlegrounds.warId, id))
      .orderBy(asc(warBattlegrounds.createdAt), asc(spots.name)),
    db
      .select({ userId: user.id, name: user.name, joinedAt: warMembers.joinedAt })
      .from(warMembers)
      .innerJoin(user, eq(warMembers.userId, user.id))
      .where(eq(warMembers.warId, id))
      .orderBy(asc(warMembers.joinedAt)),
    db
      .select({ tasting: tastings, spotId: wings.spotId })
      .from(tastings)
      .innerJoin(wings, eq(tastings.wingId, wings.id))
      .where(eq(tastings.warId, id)),
    db.select().from(spotReviews).where(eq(spotReviews.warId, id)),
  ]);

  const results = computeWarResults({
    spotIds: grounds.map((g) => g.spotId),
    memberIds: members.map((m) => m.userId),
    scorecards: cards.map((c) => ({ userId: c.tasting.userId, spotId: c.spotId, wingId: c.tasting.wingId, scores: c.tasting })),
    reviews: reviews.map((r) => ({ userId: r.userId, spotId: r.spotId, scores: r })),
  });

  return { ...row, grounds, members, cards, reviews, results };
}

export type WarSummary = Awaited<ReturnType<typeof warSummaries>>[number];

/** Compact war info for lists: status, counts, and the champion if it's visible. */
export async function warSummaries(ids?: string[]) {
  if (ids && ids.length === 0) return [];
  const rows = await db
    .select({ id: wars.id })
    .from(wars)
    .where(ids ? inArray(wars.id, ids) : undefined)
    .orderBy(desc(wars.createdAt));
  const now = new Date();
  const loaded = await Promise.all(rows.map((r) => loadWar(r.id)));
  return loaded
    .filter((w) => !!w)
    .map((w) => {
      const visible = resultsVisible(w.war, now);
      const championId = visible ? w.results.champion : null;
      return {
        id: w.war.id,
        name: w.war.name,
        description: w.war.description,
        hostId: w.war.hostId,
        hostName: w.hostName,
        type: w.type,
        fogOfWar: w.war.fogOfWar,
        endsAt: w.war.endsAt,
        endedAt: w.war.endedAt,
        createdAt: w.war.createdAt,
        ended: warEnded(w.war, now),
        visible,
        memberIds: w.members.map((m) => m.userId),
        memberCount: w.members.length,
        battlegroundCount: w.grounds.length,
        scorecardCount: w.cards.length,
        completion: w.results.completion,
        standings: visible ? w.results.standings : [],
        champion: championId ? (w.grounds.find((g) => g.spotId === championId) ?? null) : null,
        battlegrounds: w.grounds.map((g) => ({ spotId: g.spotId, name: g.name })),
      };
    });
}

/** spotId → number of ended wars it won. */
async function warCrowns() {
  const ended = await db
    .select({ id: wars.id })
    .from(wars)
    .where(sql`${wars.endedAt} is not null or (${wars.endsAt} is not null and ${wars.endsAt} <= ${Date.now()})`);
  const summaries = await warSummaries(ended.map((w) => w.id));
  const crowns = new Map<string, number>();
  for (const w of summaries) if (w.champion) crowns.set(w.champion.spotId, (crowns.get(w.champion.spotId) ?? 0) + 1);
  return crowns;
}

export async function listWars() {
  const all = await warSummaries();
  return {
    active: all.filter((w) => !w.ended),
    ended: all.filter((w) => w.ended).sort((a, b) => (b.endedAt ?? b.endsAt)!.getTime() - (a.endedAt ?? a.endsAt)!.getTime()),
  };
}

/**
 * The full war page. Under fog of war, the overall results stay hidden until
 * the war ends, but each battleground the viewer has judged is revealed to them
 * (its score, without its overall place, which would leak the others).
 */
export async function getWar(id: string, viewerId: string | null) {
  const w = await loadWar(id);
  if (!w) return null;
  const now = new Date();
  const ended = warEnded(w.war, now);
  const visible = resultsVisible(w.war, now);

  const wingIds = [...new Set(w.cards.map((c) => c.tasting.wingId))];
  const wingRows = wingIds.length
    ? await db
        .select({ id: wings.id, name: wings.name, heat: wings.heat, style: wings.style, spotId: wings.spotId })
        .from(wings)
        .where(inArray(wings.id, wingIds))
    : [];
  const wingById = new Map(wingRows.map((x) => [x.id, x]));

  const judgedBy = (spotId: string) => new Set(w.cards.filter((c) => c.spotId === spotId).map((c) => c.tasting.userId));
  const isMember = !!viewerId && w.members.some((m) => m.userId === viewerId);
  const viewerJudged = new Set(viewerId ? w.cards.filter((c) => c.tasting.userId === viewerId).map((c) => c.spotId) : []);

  return {
    war: w.war,
    hostName: w.hostName,
    type: w.type,
    ended,
    visible,
    isMember,
    isHost: viewerId === w.war.hostId,
    members: w.members.map((m) => ({
      ...m,
      judged: w.results.judges.find((j) => j.userId === m.userId)?.battlegroundsJudged ?? 0,
    })),
    battlegrounds: w.grounds.map((g) => {
      const revealed = battleVisible(w.war, viewerJudged.has(g.spotId), now);
      const standing = w.results.standings.find((s) => s.spotId === g.spotId) ?? null;
      return {
        ...g,
        judges: judgedBy(g.spotId).size,
        viewerJudged: viewerJudged.has(g.spotId),
        revealed,
        // Under fog, only this battle's own numbers: no place, and no adjusted score (it depends on the hidden battles).
        standing: revealed && standing ? { ...standing, place: visible ? standing.place : null, score: visible ? standing.score : null } : null,
      };
    }),
    viewerProgress: viewerJudged.size,
    scorecardCount: w.cards.length,
    results: visible ? w.results : null,
    completion: w.results.completion,
    wings: wingById,
  };
}

/** One restaurant within a war: the wings to judge there and the viewer's scorecards. */
export async function getBattleground(warId: string, spotId: string, viewerId: string | null) {
  const w = await loadWar(warId);
  if (!w) return null;
  const index = w.grounds.findIndex((g) => g.spotId === spotId);
  if (index === -1) return null;
  const now = new Date();
  const visible = resultsVisible(w.war, now);

  const [spot] = await db.select().from(spots).where(eq(spots.id, spotId));
  const spotWings = await listWings({ spotId });
  const eligible = w.war.wingTypeId ? spotWings.filter((x) => x.typeId === w.war.wingTypeId) : spotWings;

  const here = w.cards.filter((c) => c.spotId === spotId);
  const myCards = viewerId ? here.filter((c) => c.tasting.userId === viewerId).map((c) => c.tasting) : [];
  const myReview = viewerId ? (w.reviews.find((r) => r.spotId === spotId && r.userId === viewerId) ?? null) : null;

  // Per-wing war averages at this battleground (only shown once the fog lifts for this viewer).
  const wingAverages = new Map<string, { avg: number; judges: number }>();
  for (const x of eligible) {
    const list = here.filter((c) => c.tasting.wingId === x.id).map((c) => c.tasting);
    if (list.length) wingAverages.set(x.id, { avg: list.reduce((s, t) => s + t.crisp + t.sauce + t.juiciness + t.heat + t.value, 0) / list.length, judges: list.length });
  }

  const revealed = battleVisible(w.war, myCards.length > 0, now);
  const standing = w.results.standings.find((s) => s.spotId === spotId) ?? null;
  const memberName = new Map(w.members.map((m) => [m.userId, m.name]));
  // Each judge's single vote here, plus their notes — the battle laid bare.
  const votes = w.results.judges
    .map((j) => ({ userId: j.userId, vote: j.ranking.find((r) => r.spotId === spotId)?.score ?? null }))
    .filter((j): j is { userId: string; vote: number } => j.vote !== null)
    .map((j) => ({
      ...j,
      name: memberName.get(j.userId) ?? "A judge",
      notes: here.filter((c) => c.tasting.userId === j.userId && c.tasting.notes).map((c) => c.tasting.notes),
    }))
    .sort((a, b) => b.vote - a.vote);

  return {
    war: w.war,
    type: w.type,
    ended: warEnded(w.war, now),
    visible,
    revealed,
    isMember: !!viewerId && w.members.some((m) => m.userId === viewerId),
    spot,
    index,
    total: w.grounds.length,
    prev: w.grounds[index - 1] ?? null,
    next: w.grounds[index + 1] ?? null,
    wings: eligible,
    otherWingCount: spotWings.length - eligible.length,
    myCards,
    myReview,
    judges: new Set(here.map((c) => c.tasting.userId)).size,
    memberCount: w.members.length,
    standing: revealed && standing ? { ...standing, place: visible ? standing.place : null, score: visible ? standing.score : null } : null,
    wingAverages: revealed ? wingAverages : null,
    votes: revealed ? votes : null,
  };
}

/** Spots that aren't battlegrounds in this war yet. */
export async function spotsOutsideWar(warId: string) {
  const inWar = db.select({ id: warBattlegrounds.spotId }).from(warBattlegrounds).where(eq(warBattlegrounds.warId, warId));
  return db
    .select({ id: spots.id, name: spots.name, neighborhood: spots.neighborhood })
    .from(spots)
    .where(notInArray(spots.id, inWar))
    .orderBy(asc(spots.name));
}

/* ── people ──────────────────────────────────────────────────── */

export async function getJudge(userId: string) {
  const [judge] = await db
    .select({ id: user.id, name: user.name, image: user.image, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.id, userId));
  if (!judge) return null;

  const [notes, reviews, memberships] = await Promise.all([
    db
      .select({ tasting: tastings, wingName: wings.name, spotName: spots.name, warName: wars.name })
      .from(tastings)
      .innerJoin(wings, eq(tastings.wingId, wings.id))
      .innerJoin(spots, eq(wings.spotId, spots.id))
      .leftJoin(wars, eq(tastings.warId, wars.id))
      .where(and(eq(tastings.userId, userId), unfogged("tastings")))
      .orderBy(desc(tastings.createdAt))
      .limit(60),
    db
      .select({ review: spotReviews, spotName: spots.name })
      .from(spotReviews)
      .innerJoin(spots, eq(spotReviews.spotId, spots.id))
      .where(and(eq(spotReviews.userId, userId), unfogged("spot_reviews")))
      .orderBy(desc(spotReviews.createdAt))
      .limit(40),
    db.select({ warId: warMembers.warId }).from(warMembers).where(eq(warMembers.userId, userId)),
  ]);

  return {
    judge,
    tastings: notes,
    reviews,
    wars: await warSummaries(memberships.map((m) => m.warId)),
    tastedWingCount: new Set(notes.map((n) => n.tasting.wingId)).size,
  };
}

/** People who have filed the most scorecards. */
export async function topJudges(limit = 5) {
  return db
    .select({ id: user.id, name: user.name, scorecards: count(tastings.id) })
    .from(user)
    .innerJoin(tastings, and(eq(tastings.userId, user.id), unfogged("tastings")))
    .groupBy(user.id)
    .orderBy(desc(count(tastings.id)))
    .limit(limit);
}

/* ── home page ───────────────────────────────────────────────── */

export async function worldStats() {
  const [[w], [s], [wr], [t], [r]] = await Promise.all([
    db.select({ n: count() }).from(wings),
    db.select({ n: count() }).from(spots),
    db.select({ n: count() }).from(wars),
    db.select({ n: count() }).from(tastings),
    db.select({ n: count() }).from(spotReviews),
  ]);
  return { wings: w.n, spots: s.n, wars: wr.n, scorecards: t.n + r.n };
}
