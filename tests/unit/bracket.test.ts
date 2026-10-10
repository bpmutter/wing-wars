import { describe, expect, it } from "vitest";
import { buildBracket, seedEntrants, seedOrder } from "@/lib/bracket";

describe("bracket", () => {
  it("seeds so the top two can only meet in the final", () => {
    expect(seedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
    expect(seedEntrants(["a", "b", "c", "d"])).toEqual(["a", "d", "b", "c"]);
  });

  it("replays picks into a champion", () => {
    const b = buildBracket(["a", "b", "c", "d"], ["a", "d", "d"]);
    expect(b.complete).toBe(true);
    expect(b.champion).toBe("d");
    expect(b.matches.map((m) => [m.round, m.a, m.b, m.winner])).toEqual([
      [1, "a", "b", "a"],
      [1, "c", "d", "d"],
      [2, "a", "d", "d"],
    ]);
  });

  it("stops at the first unplayed or invalid match", () => {
    const partial = buildBracket(["a", "b", "c", "d"], ["a"]);
    expect(partial.complete).toBe(false);
    expect(partial.current).toMatchObject({ a: "c", b: "d" });

    const cheat = buildBracket(["a", "b", "c", "d"], ["c"]);
    expect(cheat.complete).toBe(false);
    expect(cheat.matches).toHaveLength(1);
  });
});
