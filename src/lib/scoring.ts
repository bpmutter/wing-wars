import { z } from "zod";

export type Element<K extends string = string> = { key: K; label: string; hint: string; icon: string };

/** The five elements every wing is judged on. */
export const ELEMENTS = [
  { key: "crisp", label: "Crisp", hint: "Shatter, crackle, crunch.", icon: "🍂" },
  { key: "sauce", label: "Sauce", hint: "Flavor, coverage, stickiness.", icon: "🍯" },
  { key: "juiciness", label: "Juiciness", hint: "Tender, moist, meaty.", icon: "💧" },
  { key: "heat", label: "Heat", hint: "How good is the burn? (not just how hot)", icon: "🔥" },
  { key: "value", label: "Value", hint: "Worth the coin?", icon: "🪙" },
] as const satisfies readonly Element[];

/** The five virtues every restaurant is judged on. */
export const SPOT_ELEMENTS = [
  { key: "wingGame", label: "Wing Game", hint: "How good is the wing menu overall?", icon: "🍗" },
  { key: "sides", label: "Sides & Dips", hint: "Ranch, blue cheese, fries, celery.", icon: "🥣" },
  { key: "vibe", label: "Vibe", hint: "Cozy? Lively? Somewhere you'd linger?", icon: "🏮" },
  { key: "service", label: "Service", hint: "Friendly, quick, napkins on hand.", icon: "🙇" },
  { key: "value", label: "Value", hint: "Worth the coin?", icon: "🪙" },
] as const satisfies readonly Element[];

export type ElementKey = (typeof ELEMENTS)[number]["key"];
export type Scores = Record<ElementKey, number>;
export type SpotElementKey = (typeof SPOT_ELEMENTS)[number]["key"];
export type SpotScores = Record<SpotElementKey, number>;

export const MAX_SCORE = 10;
export const MAX_TOTAL = MAX_SCORE * ELEMENTS.length;
export const MAX_SPOT_TOTAL = MAX_SCORE * SPOT_ELEMENTS.length;

const score = z.coerce.number().int().min(1).max(MAX_SCORE);

export const scoresSchema = z.object({
  crisp: score,
  sauce: score,
  juiciness: score,
  heat: score,
  value: score,
});

export const spotScoresSchema = z.object({
  wingGame: score,
  sides: score,
  vibe: score,
  service: score,
  value: score,
});

/** Sum a scorecard over a set of elements. */
export function sumOf<K extends string>(elements: readonly Element<K>[], s: Record<K, number>) {
  return elements.reduce((sum, e) => sum + s[e.key], 0);
}

/** Average several scorecards, element by element. */
export function averageOf<K extends string>(elements: readonly Element<K>[], list: Record<K, number>[]): Record<K, number> | null {
  if (list.length === 0) return null;
  const out = {} as Record<K, number>;
  for (const e of elements) out[e.key] = list.reduce((sum, s) => sum + s[e.key], 0) / list.length;
  return out;
}

export function startingScores<K extends string>(elements: readonly Element<K>[], v = 5) {
  return Object.fromEntries(elements.map((e) => [e.key, v])) as Record<K, number>;
}

export const total = (s: Scores) => sumOf(ELEMENTS, s);
export const spotTotal = (s: SpotScores) => sumOf(SPOT_ELEMENTS, s);
export const average = (list: Scores[]) => averageOf(ELEMENTS, list);
export const spotAverage = (list: SpotScores[]) => averageOf(SPOT_ELEMENTS, list);

export const HEAT_LABELS = [
  "No heat",
  "Gentle breeze",
  "Warm hearth",
  "Bonfire",
  "Fire demon",
  "Volcanic",
] as const;
