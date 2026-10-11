"use client";

import { useActionState, useState } from "react";
import { logSpotReview, submitWarReview, type FormState } from "@/app/actions";
import { FinalBadge, FinalNotice } from "@/components/bits";
import { Field, FormError, SubmitButton } from "@/components/form-bits";
import { ScoreSlider } from "@/components/score-slider";
import { MAX_SPOT_TOTAL, SPOT_ELEMENTS, spotTotal, startingScores, type SpotScores } from "@/lib/scoring";

/**
 * Reviews a restaurant. With `warId` it files your review for that war, which is
 * final: once `initial` exists it's shown read-only and can't be changed.
 */
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
  const [scores, setScores] = useState<SpotScores>(() => startingScores(SPOT_ELEMENTS));

  if (warId && initial) {
    return (
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-forest">✅ You reviewed {spotName}</span>
          <FinalBadge what="review" />
        </div>
        <ul className="grid gap-1.5">
          {SPOT_ELEMENTS.map((e) => (
            <li key={e.key} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {e.icon} {e.label}
              </span>
              <b className="font-display text-lg tabular-nums">{initial[e.key]}</b>
            </li>
          ))}
        </ul>
        <p className="text-right font-display text-xl font-semibold">
          {spotTotal(initial)}
          <span className="text-sm text-ink-soft">/{MAX_SPOT_TOTAL}</span>
        </p>
        {initial.notes && <p className="text-sm italic">“{initial.notes}”</p>}
      </div>
    );
  }

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
        <textarea name="notes" rows={3} maxLength={500} className="field" placeholder="Warm lanterns, sticky tables, a ranch worth crossing rivers for…" />
      </Field>
      {warId && <FinalNotice what="review" />}
      <FormError error={state?.error} />
      <div>
        <SubmitButton pendingText="Writing in the guestbook…">{warId ? "🔒 File final review" : "🏮 Review this spot"}</SubmitButton>
      </div>
    </form>
  );
}
