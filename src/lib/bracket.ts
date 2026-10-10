export const TOURNAMENT_SIZES = [4, 8, 16] as const;

export type Match = { round: number; index: number; a: string; b: string; winner: string | null };

/**
 * Replays a single-elimination bracket. `entrants` are seeded in order
 * (1v2, 3v4, …) and `picks` are the winners of each match, in play order.
 * Invalid picks (a wing that isn't in that match) stop the replay.
 */
export function buildBracket(entrants: string[], picks: string[]) {
  const matches: Match[] = [];
  let field = [...entrants];
  let round = 1;
  let p = 0;
  while (field.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < field.length; i += 2) {
      const a = field[i];
      const b = field[i + 1];
      const pick = picks[p];
      const winner = pick === a || pick === b ? pick : null;
      matches.push({ round, index: i / 2, a, b, winner });
      if (!winner) {
        return { matches, rounds: roundCount(entrants.length), current: matches.at(-1)!, champion: null, complete: false as const };
      }
      p++;
      next.push(winner);
    }
    field = next;
    round++;
  }
  return { matches, rounds: roundCount(entrants.length), current: null, champion: field[0] ?? null, complete: true as const };
}

export function roundCount(size: number) {
  return Math.log2(size);
}

export function roundName(round: number, rounds: number) {
  const fromEnd = rounds - round;
  if (fromEnd === 0) return "The Final";
  if (fromEnd === 1) return "Semifinals";
  if (fromEnd === 2) return "Quarterfinals";
  return `Round ${round}`;
}

/** Standard seeding order (1v8, 4v5, 2v7, 3v6 …) as 1-based seed numbers. */
export function seedOrder(size: number) {
  let order = [1];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n + 1 - s]);
  }
  return order;
}

/** Arrange ids (strongest first) into bracket order so top seeds meet late. */
export function seedEntrants<T>(strongestFirst: T[]) {
  return seedOrder(strongestFirst.length).map((s) => strongestFirst[s - 1]);
}
