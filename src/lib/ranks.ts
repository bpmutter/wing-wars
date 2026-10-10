/**
 * Wing ranks, from humble to legendary. Each wing earns a title from its
 * Elo rating, like a little spirit growing up in the forest.
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

export type Rank = (typeof RANKS)[number];

export function rankFor(elo: number): Rank {
  let rank: Rank = RANKS[0];
  for (const r of RANKS) if (elo >= r.min) rank = r;
  return rank;
}

export function rankIndex(elo: number) {
  return RANKS.indexOf(rankFor(elo));
}
