import { describe, expect, it } from "vitest";
import { eloUpdate, expectedScore } from "@/lib/elo";
import { rankFor } from "@/lib/ranks";

describe("elo", () => {
  it("gives even odds to equal ratings", () => {
    expect(expectedScore(1200, 1200)).toBeCloseTo(0.5);
  });

  it("is zero-sum", () => {
    const { deltaA, deltaB } = eloUpdate(1300, 1150, false);
    expect(deltaA + deltaB).toBe(0);
  });

  it("rewards upsets more than expected wins", () => {
    const upset = eloUpdate(1100, 1400, true).deltaA;
    const expected = eloUpdate(1400, 1100, true).deltaA;
    expect(upset).toBeGreaterThan(expected);
    expect(eloUpdate(1200, 1200, true).deltaA).toBe(16);
  });
});

describe("ranks", () => {
  it("maps ratings to titles", () => {
    expect(rankFor(900).title).toBe("Lost Crumb");
    expect(rankFor(1200).title).toBe("Meadow Wanderer");
    expect(rankFor(1500).title).toBe("Great Sauce Spirit");
  });
});
