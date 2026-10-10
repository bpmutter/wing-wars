"use client";

import { useActionState, useState } from "react";
import { logTasting, type FormState } from "@/app/actions";
import { Field, FormError, SubmitButton } from "@/components/form-bits";
import { ScoreSlider } from "@/components/score-slider";
import { ELEMENTS, MAX_TOTAL, type Scores } from "@/lib/scoring";

export function TastingForm({ wingId, wingName }: { wingId: string; wingName: string }) {
  const [state, action] = useActionState<FormState, FormData>(logTasting, null);
  const [scores, setScores] = useState<Scores>({ crisp: 5, sauce: 5, juiciness: 5, heat: 5, value: 5 });
  const sum = ELEMENTS.reduce((s, e) => s + scores[e.key], 0);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="wingId" value={wingId} />
      {ELEMENTS.map((e) => (
        <div key={e.key}>
          <div className="flex justify-between text-sm">
            <span className="font-bold">
              {e.icon} {e.label}
            </span>
            <span className="text-ink-soft">{e.hint}</span>
          </div>
          <ScoreSlider name={e.key} label={`${wingName} ${e.label}`} value={scores[e.key]} onChange={(v) => setScores((s) => ({ ...s, [e.key]: v }))} />
        </div>
      ))}
      <p className="text-right font-display text-xl font-semibold">
        {sum}
        <span className="text-sm text-ink-soft">/{MAX_TOTAL}</span>
      </p>
      <Field label="Tasting notes (optional)">
        <textarea name="notes" rows={3} maxLength={500} className="field" placeholder="Crackly skin, sauce like a summer evening…" />
      </Field>
      <FormError error={state?.error} />
      <div>
        <SubmitButton pendingText="Writing in the journal…">📓 Log tasting</SubmitButton>
      </div>
    </form>
  );
}
