"use client";

import { useActionState, useState } from "react";
import { logSpotReview, submitWarReview, type FormState } from "@/app/actions";
import { Field, FormError, SubmitButton } from "@/components/form-bits";
import { ScoreSlider } from "@/components/score-slider";
import { MAX_SPOT_TOTAL, SPOT_ELEMENTS, spotTotal, startingScores, type SpotScores } from "@/lib/scoring";

/** Reviews a restaurant. With `warId` it files (or updates) your review for that war. */
export function ReviewForm({
  spotId,
  spotName,
  warId,
  initial,
}: {
  spotId: string;
  spotName: string;
  warId?: string;
  initial?: (SpotScores & { notes: string }) | null;
}) {
  const [state, action] = useActionState<FormState, FormData>(warId ? submitWarReview : logSpotReview, null);
  const [scores, setScores] = useState<SpotScores>(() =>
    initial
      ? { wingGame: initial.wingGame, sides: initial.sides, vibe: initial.vibe, service: initial.service, value: initial.value }
      : startingScores(SPOT_ELEMENTS),
  );
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="spotId" value={spotId} />
      {warId && <input type="hidden" name="warId" value={warId} />}
      {SPOT_ELEMENTS.map((e) => (
        <div key={e.key}>
          <div className="flex justify-between gap-2 text-sm">
            <span className="font-bold">
              {e.icon} {e.label}
            </span>
            <span className="text-right text-ink-soft">{e.hint}</span>
          </div>
          <ScoreSlider name={e.key} label={`${spotName} ${e.label}`} value={scores[e.key]} onChange={(v) => setScores((s) => ({ ...s, [e.key]: v }))} />
        </div>
      ))}
      <p className="text-right font-display text-xl font-semibold">
        {spotTotal(scores)}
        <span className="text-sm text-ink-soft">/{MAX_SPOT_TOTAL}</span>
      </p>
      <Field label="Review notes (optional)">
        <textarea name="notes" defaultValue={initial?.notes} rows={3} maxLength={500} className="field" placeholder="Warm lanterns, sticky tables, a ranch worth crossing rivers for…" />
      </Field>
      <FormError error={state?.error} />
      <div>
        <SubmitButton pendingText="Writing in the guestbook…">{initial ? "🏮 Update review" : "🏮 Review this spot"}</SubmitButton>
      </div>
    </form>
  );
}
