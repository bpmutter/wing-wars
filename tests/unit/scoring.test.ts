import { describe, expect, it } from "vitest";
import { average, ELEMENTS, MAX_SPOT_TOTAL, SPOT_ELEMENTS, spotAverage, spotTotal, startingScores, total } from "@/lib/scoring";

describe("scoring", () => {
  it("totals wing and spot scorecards over their own elements", () => {
    expect(total({ crisp: 1, sauce: 2, juiciness: 3, heat: 4, value: 5 })).toBe(15);
    expect(spotTotal({ wingGame: 10, sides: 10, vibe: 10, service: 10, value: 10 })).toBe(MAX_SPOT_TOTAL);
  });

  it("averages element by element", () => {
    expect(average([])).toBeNull();
    expect(spotAverage([startingScores(SPOT_ELEMENTS, 4), startingScores(SPOT_ELEMENTS, 8)])).toEqual(startingScores(SPOT_ELEMENTS, 6));
    expect(Object.keys(startingScores(ELEMENTS))).toEqual(["crisp", "sauce", "juiciness", "heat", "value"]);
  });
});
