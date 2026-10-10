import { describe, expect, it } from "vitest";
import type { Scores, SpotScores } from "@/lib/scoring";
import { bayesian, computeWarResults, spearman, type WarScorecard } from "@/lib/war-results";

const s = (v: number): Scores => ({ crisp: v, sauce: v, juiciness: v, heat: v, value: v });
const r = (v: number): SpotScores => ({ wingGame: v, sides: v, vibe: v, service: v, value: v });
const card = (userId: string, spotId: string, wingId: string, v: number): WarScorecard => ({ userId, spotId, wingId, scores: s(v) });

describe("bayesian", () => {
  it("pulls small samples toward the prior", () => {
    expect(bayesian([10], 5, 2)).toBeCloseTo(20 / 3);
    expect(bayesian([10, 10, 10, 10, 10, 10, 10, 10], 5, 2)).toBeCloseTo(9);
  });
});

describe("spearman", () => {
  it("is 1 for identical and -1 for reversed orderings", () => {
    expect(spearman(["a", "b", "c"], ["a", "b", "c"])).toBe(1);
    expect(spearman(["a", "b", "c"], ["c", "b", "a"])).toBe(-1);
  });
});

describe("computeWarResults", () => {
  it("crowns the spot judges like best, and doesn't let one rave review win", () => {
    const res = computeWarResults({
      spotIds: ["kettle", "shack", "lantern", "ghost"],
      memberIds: ["u1", "u2", "u3"],
      scorecards: [
        // Kettle: consistently great with three judges.
        card("u1", "kettle", "k1", 9), card("u2", "kettle", "k1", 9), card("u3", "kettle", "k1", 8),
        // Shack: one judge loved it (10/10), nobody else went.
        card("u1", "shack", "s1", 10),
        // Lantern: mediocre.
        card("u1", "lantern", "l1", 5), card("u2", "lantern", "l1", 6), card("u3", "lantern", "l2", 4),
      ],
      reviews: [],
    });
    expect(res.champion).toBe("kettle");
    expect(res.standings.map((x) => [x.spotId, x.place])).toEqual([
      ["kettle", 1],
      ["shack", 2],
      ["lantern", 3],
      ["ghost", null],
    ]);
    expect(res.standings[1].rawAvg).toBe(50); // raw average is perfect…
    expect(res.standings[1].score!).toBeLessThan(res.standings[0].score!); // …but shrunk below Kettle.
    expect(res.bestWing?.wingId).toBe("k1");
    expect(res.elementAwards).toHaveLength(5);
  });

  it("averages a judge's wings at one spot into a single vote", () => {
    const res = computeWarResults({
      spotIds: ["a"],
      memberIds: ["u1"],
      scorecards: [card("u1", "a", "w1", 10), card("u1", "a", "w2", 6)],
      reviews: [],
    });
    expect(res.standings[0]).toMatchObject({ judges: 1, scorecards: 2, rawAvg: 40, bestWingId: "w1" });
  });

  it("hands out judge awards and the best hangout", () => {
    const spots = ["a", "b", "c"];
    const consensusFan = spots.map((sp, i) => card("fan", sp, `${sp}1`, 9 - i * 2));
    const agreeable = spots.map((sp, i) => card("agree", sp, `${sp}1`, 8 - i * 2));
    const rebel = spots.map((sp, i) => card("rebel", sp, `${sp}1`, 3 + i * 2));
    const res = computeWarResults({
      spotIds: spots,
      memberIds: ["fan", "agree", "rebel", "lurker"],
      scorecards: [...consensusFan, ...agreeable, ...rebel],
      reviews: [
        { userId: "fan", spotId: "c", scores: r(9) },
        { userId: "agree", spotId: "c", scores: r(9) },
        { userId: "rebel", spotId: "a", scores: r(4) },
      ],
    });
    expect(res.oracle).toBe("fan");
    expect(res.contrarian).toBe("rebel");
    expect(res.bestHangout?.spotId).toBe("c");
    expect(res.completion).toBeCloseTo(9 / 12);
    expect(res.judges.find((j) => j.userId === "lurker")).toMatchObject({ scorecards: 0, agreement: null });
  });

  it("handles an empty war", () => {
    const res = computeWarResults({ spotIds: ["a"], memberIds: [], scorecards: [], reviews: [] });
    expect(res.champion).toBeNull();
    expect(res.bestWing).toBeNull();
    expect(res.mostDevoted).toBeNull();
  });
});
