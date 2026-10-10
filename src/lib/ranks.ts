/**
 * Ranks, from humble to legendary. Wings grow up like little forest spirits;
 * restaurants grow from roadside stalls into legendary bathhouses.
 */
export const RANKS = [
  { min: -Infinity, title: "Lost Crumb", blurb: "Still finding its way home." },
  { min: 1100, title: "Dust Sprite", blurb: "Small, scrappy, full of heart." },
  { min: 1175, title: "Meadow Wanderer", blurb: "A pleasant stroll through sauce country." },
  { min: 1225, title: "Hilltop Hero", blurb: "Has seen a few battles. Won most." },
  { min: 1300, title: "Sky Captain", blurb: "Soaring over the competition." },
  { min: 1375, title: "Forest Guardian", blurb: "Ancient. Revered. Very crispy." },
  { min: 1450, title: "Great Sauce Spirit", blurb: "The wind itself whispers its name." },
] as const;

export const SPOT_RANKS = [
  { min: -Infinity, title: "Abandoned Shack", blurb: "The lights are on. Barely." },
  { min: 1100, title: "Roadside Stall", blurb: "Humble, but the smell draws you in." },
  { min: 1175, title: "Village Tavern", blurb: "The locals know. Now you do too." },
  { min: 1225, title: "Hilltop Inn", blurb: "Worth the climb." },
  { min: 1300, title: "Famous Teahouse", blurb: "Travelers speak of it on the road." },
  { min: 1375, title: "Grand Festival Hall", blurb: "Lanterns, laughter, and a line out the door." },
  { min: 1450, title: "Legendary Bathhouse", blurb: "Even the spirits come here to eat." },
] as const;

export type RankKind = "wing" | "spot";
export type Rank = { min: number; title: string; blurb: string };

export function ranksFor(kind: RankKind = "wing"): readonly Rank[] {
  return kind === "spot" ? SPOT_RANKS : RANKS;
}

export function rankFor(elo: number, kind: RankKind = "wing"): Rank {
  const list = ranksFor(kind);
  let rank = list[0];
  for (const r of list) if (elo >= r.min) rank = r;
  return rank;
}

export function nextRank(elo: number, kind: RankKind = "wing"): Rank | undefined {
  const list = ranksFor(kind);
  return list[list.indexOf(rankFor(elo, kind)) + 1];
}
