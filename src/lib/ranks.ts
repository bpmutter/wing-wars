/**
 * Titles earned from an average score out of 50. Wings grow up like little
 * forest spirits; restaurants grow from roadside stalls into legendary bathhouses.
 */
export const RANKS = [
  { min: 0, title: "Lost Crumb", blurb: "Still finding its way home." },
  { min: 20, title: "Dust Sprite", blurb: "Small, scrappy, full of heart." },
  { min: 26, title: "Meadow Wanderer", blurb: "A pleasant stroll through sauce country." },
  { min: 32, title: "Hilltop Hero", blurb: "Solid. Dependable. Napkin-worthy." },
  { min: 36, title: "Sky Captain", blurb: "Soaring over the competition." },
  { min: 40, title: "Forest Guardian", blurb: "Ancient. Revered. Very crispy." },
  { min: 44, title: "Great Sauce Spirit", blurb: "The wind itself whispers its name." },
] as const;

export const SPOT_RANKS = [
  { min: 0, title: "Abandoned Shack", blurb: "The lights are on. Barely." },
  { min: 20, title: "Roadside Stall", blurb: "Humble, but the smell draws you in." },
  { min: 26, title: "Village Tavern", blurb: "The locals know. Now you do too." },
  { min: 32, title: "Hilltop Inn", blurb: "Worth the climb." },
  { min: 36, title: "Famous Teahouse", blurb: "Travelers speak of it on the road." },
  { min: 40, title: "Grand Festival Hall", blurb: "Lanterns, laughter, and a line out the door." },
  { min: 44, title: "Legendary Bathhouse", blurb: "Even the spirits come here to eat." },
] as const;

export type RankKind = "wing" | "spot";
export type Rank = { min: number; title: string; blurb: string };

export function ranksFor(kind: RankKind = "wing"): readonly Rank[] {
  return kind === "spot" ? SPOT_RANKS : RANKS;
}

/** The title for an average score out of 50. */
export function rankFor(score: number, kind: RankKind = "wing"): Rank {
  const list = ranksFor(kind);
  let rank = list[0];
  for (const r of list) if (score >= r.min) rank = r;
  return rank;
}

export function nextRank(score: number, kind: RankKind = "wing"): Rank | undefined {
  const list = ranksFor(kind);
  return list[list.indexOf(rankFor(score, kind)) + 1];
}
