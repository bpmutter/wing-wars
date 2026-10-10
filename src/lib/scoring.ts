import { z } from "zod";

/** The five elements every wing is judged on. */
export const ELEMENTS = [
  { key: "crisp", label: "Crisp", hint: "Shatter, crackle, crunch.", icon: "🍂" },
  { key: "sauce", label: "Sauce", hint: "Flavor, coverage, stickiness.", icon: "🍯" },
  { key: "juiciness", label: "Juiciness", hint: "Tender, moist, meaty.", icon: "💧" },
  { key: "heat", label: "Heat", hint: "How good is the burn? (not just how hot)", icon: "🔥" },
  { key: "value", label: "Value", hint: "Worth the coin?", icon: "🪙" },
] as const;

export type ElementKey = (typeof ELEMENTS)[number]["key"];
export type Scores = Record<ElementKey, number>;

export const MAX_SCORE = 10;
export const MAX_TOTAL = MAX_SCORE * ELEMENTS.length;

const score = z.coerce.number().int().min(1).max(MAX_SCORE);

export const scoresSchema = z.object({
  crisp: score,
  sauce: score,
  juiciness: score,
  heat: score,
  value: score,
});

export function total(s: Scores) {
  return ELEMENTS.reduce((sum, e) => sum + s[e.key], 0);
}

export function average(list: Scores[]): Scores | null {
  if (list.length === 0) return null;
  const out = { crisp: 0, sauce: 0, juiciness: 0, heat: 0, value: 0 };
  for (const s of list) for (const e of ELEMENTS) out[e.key] += s[e.key];
  for (const e of ELEMENTS) out[e.key] = out[e.key] / list.length;
  return out;
}

export const HEAT_LABELS = [
  "No heat",
  "Gentle breeze",
  "Warm hearth",
  "Bonfire",
  "Fire demon",
  "Volcanic",
] as const;
