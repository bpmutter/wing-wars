"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitWarScorecard, type FormState } from "@/app/actions";
import { HeatPips } from "@/components/bits";
import { FormError, SubmitButton } from "@/components/form-bits";
import { ScoreSlider } from "@/components/score-slider";
import { WingSpirit } from "@/components/wing-spirit";
import { ELEMENTS, MAX_TOTAL, startingScores, total, type Scores } from "@/lib/scoring";

type Wing = { id: string; name: string; heat: number; style: "bone-in" | "boneless"; typeName: string | null; typeEmoji: string | null };

/** One wing at a battleground: score it (or update your score) for this war. */
export function WingScorecard({
  warId,
  wing,
  mine,
  canScore,
  openByDefault,
  warAverage,
}: {
  warId: string;
  wing: Wing;
  mine: (Scores & { notes: string }) | null;
  canScore: boolean;
  openByDefault: boolean;
  warAverage: { avg: number; judges: number } | null;
}) {
  const [state, action] = useActionState<FormState, FormData>(submitWarScorecard, null);
  const [open, setOpen] = useState(openByDefault && canScore);
  const [scores, setScores] = useState<Scores>(() =>
    mine ? { crisp: mine.crisp, sauce: mine.sauce, juiciness: mine.juiciness, heat: mine.heat, value: mine.value } : startingScores(ELEMENTS),
  );

  return (
    <div id={`wing-${wing.id}`} className={`card scroll-mt-24 p-5 ${mine ? "border-meadow!" : ""}`}>
      <div className="flex items-center gap-4">
        <WingSpirit seed={wing.id} heat={wing.heat} style={wing.style} size={64} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <Link href={`/wings/${wing.id}`} className="link truncate font-display text-lg font-semibold">
            {wing.name}
          </Link>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {wing.typeName && (
              <span className="chip">
                {wing.typeEmoji} {wing.typeName}
              </span>
            )}
            <span className="chip">{wing.style}</span>
            <HeatPips heat={wing.heat} />
          </div>
        </div>
        <div className="shrink-0 text-right">
          {mine ? (
            <>
              <div className="text-xs font-bold uppercase tracking-wider text-forest">✅ Your score</div>
              <div className="font-display text-2xl font-semibold tabular-nums">
                {total(mine)}
                <span className="text-sm text-ink-soft">/{MAX_TOTAL}</span>
              </div>
            </>
          ) : (
            <div className="text-sm text-ink-soft">Not scored yet</div>
          )}
          {warAverage && (
            <div className="text-xs text-ink-soft">
              war avg {warAverage.avg.toFixed(1)} · {warAverage.judges} judge{warAverage.judges === 1 ? "" : "s"}
            </div>
          )}
        </div>
      </div>

      {canScore && !open && (
        <button type="button" className={`btn mt-4 text-sm ${mine ? "btn-secondary" : "btn-primary"}`} onClick={() => setOpen(true)}>
          {mine ? "✏️ Change my scores" : "🍗 I ate this — score it"}
        </button>
      )}

      {canScore && open && (
        <form action={action} className="mt-5 grid gap-4 border-t border-line pt-5">
          <input type="hidden" name="warId" value={warId} />
          <input type="hidden" name="wingId" value={wing.id} />
          {ELEMENTS.map((e) => (
            <div key={e.key}>
              <div className="flex justify-between gap-2 text-sm">
                <span className="font-bold">
                  {e.icon} {e.label}
                </span>
                <span className="text-right text-ink-soft">{e.hint}</span>
              </div>
              <ScoreSlider name={e.key} label={`${wing.name} ${e.label}`} value={scores[e.key]} onChange={(v) => setScores((s) => ({ ...s, [e.key]: v }))} />
            </div>
          ))}
          <p className="text-right font-display text-xl font-semibold">
            {total(scores)}
            <span className="text-sm text-ink-soft">/{MAX_TOTAL}</span>
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-bold">Notes (optional)</span>
            <textarea name="notes" rows={2} maxLength={500} defaultValue={mine?.notes} className="field" placeholder="Shatteringly crisp. Sauce like a sunset." />
          </label>
          <FormError error={state?.error} />
          <div className="flex gap-2">
            <SubmitButton pendingText="Sealing the scroll…">{mine ? "Update scorecard" : "📜 File scorecard"}</SubmitButton>
            <button type="button" className="btn btn-ghost text-sm" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
