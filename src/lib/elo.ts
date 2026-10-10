export const STARTING_ELO = 1200;
export const K_FACTOR = 32;

/** Probability that a wing rated `a` beats a wing rated `b`. */
export function expectedScore(a: number, b: number) {
  return 1 / (1 + 10 ** ((b - a) / 400));
}

/**
 * Classic Elo update for a single head-to-head battle (no draws —
 * there are no ties in Wing Wars, only winners and the defeated).
 */
export function eloUpdate(eloA: number, eloB: number, aWon: boolean) {
  const expectedA = expectedScore(eloA, eloB);
  const scoreA = aWon ? 1 : 0;
  const deltaA = Math.round(K_FACTOR * (scoreA - expectedA));
  // Zero-sum: whatever A gains, B loses.
  return { deltaA, deltaB: -deltaA };
}
