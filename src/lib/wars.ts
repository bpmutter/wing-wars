/** War lifecycle helpers — pure, so they work on the server and in tests. */
export type WarTiming = { endsAt: Date | null; endedAt: Date | null; fogOfWar: boolean };

export function warEnded(war: WarTiming, now = new Date()) {
  return !!war.endedAt || (!!war.endsAt && war.endsAt.getTime() <= now.getTime());
}

/** When the war ended (or will end), if known. */
export function warEndTime(war: WarTiming) {
  return war.endedAt ?? war.endsAt;
}

/** Standings are visible once the war ends, or all along if fog of war is off. */
export function resultsVisible(war: WarTiming, now = new Date()) {
  return warEnded(war, now) || !war.fogOfWar;
}

/**
 * Whether one battleground's scores are visible to a viewer. Under fog of war,
 * each battle lifts its fog for you once you've filed a scorecard there, so you
 * can't be swayed by the crowd before you've judged it yourself. The overall
 * standings and honors still wait for the end of the war.
 */
export function battleVisible(war: WarTiming, viewerJudgedIt: boolean, now = new Date()) {
  return resultsVisible(war, now) || viewerJudgedIt;
}

export function timeLeft(endsAt: Date, now = new Date()) {
  const ms = endsAt.getTime() - now.getTime();
  if (ms <= 0) return "ended";
  const h = Math.round(ms / 3_600_000);
  if (h < 48) return `${h} hour${h === 1 ? "" : "s"} left`;
  const d = Math.round(h / 24);
  return `${d} days left`;
}

/** A sensible default deadline for a new war: two weeks out, as YYYY-MM-DD. */
export function defaultEndDate(now = new Date()) {
  return new Date(now.getTime() + 14 * 86_400_000).toISOString().slice(0, 10);
}
