import { ELEMENTS, SPOT_ELEMENTS, total, sumOf, type ElementKey, type Scores, type SpotScores } from "./scoring";

/**
 * How many "imaginary average judges" every score starts with. A spot judged
 * once is pulled strongly toward the war-wide average; a spot judged by five
 * people mostly speaks for itself. This stops one rave review from winning a war.
 */
export const PRIOR_WEIGHT = 3;

export type WarScorecard = { userId: string; spotId: string; wingId: string; scores: Scores };
export type WarReview = { userId: string; spotId: string; scores: SpotScores };

export type WarInput = {
  spotIds: string[];
  memberIds: string[];
  scorecards: WarScorecard[];
  reviews: WarReview[];
};

export type Standing = {
  spotId: string;
  /** 1-based place, or null if nobody judged this battleground. */
  place: number | null;
  /** Bayesian-adjusted score out of 50 — what the war is decided on. */
  score: number | null;
  /** Plain average of judges' scores out of 50. */
  rawAvg: number | null;
  judges: number;
  scorecards: number;
  /** The best-scoring wing at this battleground, if any. */
  bestWingId: string | null;
};

export type WingResult = { wingId: string; spotId: string; score: number; rawAvg: number; judges: number };
export type ElementAward = { key: ElementKey; label: string; icon: string; wingId: string; avg: number };
export type JudgeResult = {
  userId: string;
  battlegroundsJudged: number;
  scorecards: number;
  /** Their personal ranking of the battlegrounds they judged, best first. */
  ranking: { spotId: string; score: number }[];
  /** Spearman correlation with the final standings (-1…1), if they judged 3+ spots. */
  agreement: number | null;
};

export type WarResults = {
  standings: Standing[];
  champion: string | null;
  wings: WingResult[];
  bestWing: WingResult | null;
  elementAwards: ElementAward[];
  bestHangout: { spotId: string; score: number; judges: number } | null;
  judges: JudgeResult[];
  mostDevoted: string | null;
  oracle: string | null;
  contrarian: string | null;
  /** Fraction of (member × battleground) pairs that have been judged. */
  completion: number;
};

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Shrinks an average toward the prior based on how many samples it has. */
export function bayesian(values: number[], prior: number, weight = PRIOR_WEIGHT) {
  return (values.reduce((a, b) => a + b, 0) + prior * weight) / (values.length + weight);
}

function groupBy<T>(items: T[], key: (t: T) => string) {
  const m = new Map<string, T[]>();
  for (const it of items) m.set(key(it), [...(m.get(key(it)) ?? []), it]);
  return m;
}

/** Spearman rank correlation between two orderings of the same items. */
export function spearman(a: string[], b: string[]) {
  const n = a.length;
  if (n < 2) return null;
  const pos = new Map(b.map((id, i) => [id, i]));
  const d2 = a.reduce((sum, id, i) => sum + (i - pos.get(id)!) ** 2, 0);
  return 1 - (6 * d2) / (n * (n * n - 1));
}

export function computeWarResults(input: WarInput): WarResults {
  const spots = new Set(input.spotIds);
  const cards = input.scorecards.filter((c) => spots.has(c.spotId));
  const reviews = input.reviews.filter((r) => spots.has(r.spotId));

  /* ── per judge, per battleground: average of the wings they ate there ── */
  const judgeSpot = [...groupBy(cards, (c) => `${c.userId}|${c.spotId}`).values()].map((list) => ({
    userId: list[0].userId,
    spotId: list[0].spotId,
    score: mean(list.map((c) => total(c.scores))),
    count: list.length,
  }));
  const spotPrior = judgeSpot.length ? mean(judgeSpot.map((j) => j.score)) : 0;

  /* ── wings ── */
  const wingPrior = cards.length ? mean(cards.map((c) => total(c.scores))) : 0;
  const wings: WingResult[] = [...groupBy(cards, (c) => c.wingId).values()]
    .map((list) => {
      const totals = list.map((c) => total(c.scores));
      return { wingId: list[0].wingId, spotId: list[0].spotId, score: bayesian(totals, wingPrior), rawAvg: mean(totals), judges: list.length };
    })
    .sort((a, b) => b.score - a.score || b.judges - a.judges || a.wingId.localeCompare(b.wingId));

  /* ── standings ── */
  const bySpot = groupBy(judgeSpot, (j) => j.spotId);
  const scored = input.spotIds.map((spotId) => {
    const list = bySpot.get(spotId) ?? [];
    const values = list.map((j) => j.score);
    return {
      spotId,
      score: list.length ? bayesian(values, spotPrior) : null,
      rawAvg: list.length ? mean(values) : null,
      judges: list.length,
      scorecards: list.reduce((n, j) => n + j.count, 0),
      bestWingId: wings.find((w) => w.spotId === spotId)?.wingId ?? null,
    };
  });
  scored.sort((a, b) => {
    if ((a.score === null) !== (b.score === null)) return a.score === null ? 1 : -1;
    return (b.score ?? 0) - (a.score ?? 0) || b.judges - a.judges || (b.rawAvg ?? 0) - (a.rawAvg ?? 0) || a.spotId.localeCompare(b.spotId);
  });
  let place = 0;
  const standings: Standing[] = scored.map((s) => ({ ...s, place: s.score === null ? null : ++place }));
  const consensus = standings.filter((s) => s.place !== null).map((s) => s.spotId);

  /* ── element awards: the best wing at each of the five elements ── */
  const elementAwards: ElementAward[] = [];
  if (cards.length) {
    for (const e of ELEMENTS) {
      const prior = mean(cards.map((c) => c.scores[e.key]));
      let best: { wingId: string; avg: number; adj: number } | null = null;
      for (const list of groupBy(cards, (c) => c.wingId).values()) {
        const vals = list.map((c) => c.scores[e.key]);
        const adj = bayesian(vals, prior);
        if (!best || adj > best.adj) best = { wingId: list[0].wingId, avg: mean(vals), adj };
      }
      if (best) elementAwards.push({ key: e.key, label: e.label, icon: e.icon, wingId: best.wingId, avg: best.avg });
    }
  }

  /* ── best hangout: the restaurant experience itself ── */
  let bestHangout: WarResults["bestHangout"] = null;
  if (reviews.length) {
    const prior = mean(reviews.map((r) => sumOf(SPOT_ELEMENTS, r.scores)));
    for (const list of groupBy(reviews, (r) => r.spotId).values()) {
      const score = bayesian(list.map((r) => sumOf(SPOT_ELEMENTS, r.scores)), prior);
      if (!bestHangout || score > bestHangout.score) bestHangout = { spotId: list[0].spotId, score, judges: list.length };
    }
  }

  /* ── judges ── */
  const byJudge = groupBy(judgeSpot, (j) => j.userId);
  const judges: JudgeResult[] = input.memberIds.map((userId) => {
    const mine = byJudge.get(userId) ?? [];
    const ranking = [...mine].sort((a, b) => b.score - a.score || a.spotId.localeCompare(b.spotId)).map((j) => ({ spotId: j.spotId, score: j.score }));
    const order = ranking.map((r) => r.spotId);
    const agreement = order.length >= 3 ? spearman(order, consensus.filter((id) => order.includes(id))) : null;
    return {
      userId,
      battlegroundsJudged: mine.length,
      scorecards: mine.reduce((n, j) => n + j.count, 0),
      ranking,
      agreement,
    };
  });

  const active = judges.filter((j) => j.scorecards > 0);
  const mostDevoted = active.length
    ? [...active].sort((a, b) => b.battlegroundsJudged - a.battlegroundsJudged || b.scorecards - a.scorecards)[0].userId
    : null;
  const rated = judges.filter((j) => j.agreement !== null).sort((a, b) => b.agreement! - a.agreement!);
  const oracle = rated.length >= 2 ? rated[0].userId : null;
  const contrarian = rated.length >= 2 && rated.at(-1)!.agreement! < rated[0].agreement! ? rated.at(-1)!.userId : null;

  const pairs = input.memberIds.length * input.spotIds.length;
  return {
    standings,
    champion: standings[0]?.place === 1 ? standings[0].spotId : null,
    wings,
    bestWing: wings[0] ?? null,
    elementAwards,
    bestHangout,
    judges,
    mostDevoted,
    oracle,
    contrarian,
    completion: pairs ? judgeSpot.filter((j) => input.memberIds.includes(j.userId)).length / pairs : 0,
  };
}
