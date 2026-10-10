import { describe, expect, it } from "vitest";
import { battleVisible, resultsVisible, warEnded } from "@/lib/wars";

const now = new Date("2026-10-10T12:00:00Z");
const day = 86_400_000;
const war = (o: Partial<{ endsAt: Date | null; endedAt: Date | null; fogOfWar: boolean }> = {}) => ({
  endsAt: null,
  endedAt: null,
  fogOfWar: true,
  ...o,
});

describe("war visibility", () => {
  it("ends on its deadline or when the host ends it", () => {
    expect(warEnded(war(), now)).toBe(false);
    expect(warEnded(war({ endsAt: new Date(now.getTime() - day) }), now)).toBe(true);
    expect(warEnded(war({ endsAt: new Date(now.getTime() + day) }), now)).toBe(false);
    expect(warEnded(war({ endedAt: now }), now)).toBe(true);
  });

  it("hides overall results under fog until the war ends", () => {
    expect(resultsVisible(war(), now)).toBe(false);
    expect(resultsVisible(war({ fogOfWar: false }), now)).toBe(true);
    expect(resultsVisible(war({ endedAt: now }), now)).toBe(true);
  });

  it("lifts the fog on a battle once you've judged it", () => {
    expect(battleVisible(war(), false, now)).toBe(false);
    expect(battleVisible(war(), true, now)).toBe(true);
    expect(battleVisible(war({ fogOfWar: false }), false, now)).toBe(true);
    expect(battleVisible(war({ endedAt: now }), false, now)).toBe(true);
  });
});
