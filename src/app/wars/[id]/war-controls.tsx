"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addBattleground, endWar, type FormState } from "@/app/actions";
import { FormError, SubmitButton } from "@/components/form-bits";

export function EndWarButton({ warId }: { warId: string }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" className="btn btn-secondary text-sm" onClick={() => setConfirming(true)}>
        🏁 End the war now
      </button>
    );
  }
  return (
    <form action={endWar.bind(null, warId)} className="flex flex-wrap items-center gap-2 rounded-2xl bg-ember/10 p-2 text-sm">
      <span className="font-bold">End it for everyone and reveal the results?</span>
      <SubmitButton pendingText="Revealing…">Yes, end the war</SubmitButton>
      <button type="button" className="btn btn-ghost text-sm" onClick={() => setConfirming(false)}>
        Not yet
      </button>
    </form>
  );
}

export function AddBattlegroundForm({ warId, spots }: { warId: string; spots: { id: string; name: string; neighborhood: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(addBattleground.bind(null, warId), null);
  return (
    <form action={action} className="grid gap-3">
      {spots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <select name="spotId" required className="field flex-1" aria-label="Spot to add" defaultValue="">
            <option value="" disabled>
              — Pick a spot —
            </option>
            {spots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.neighborhood && ` · ${s.neighborhood}`}
              </option>
            ))}
          </select>
          <SubmitButton pendingText="Adding…">➕ Add battleground</SubmitButton>
        </div>
      )}
      <p className="text-sm text-ink-soft">
        Not listed?{" "}
        <Link href={`/spots/new?war=${warId}`} className="link">
          Add a brand-new spot to the war
        </Link>
        .
      </p>
      <FormError error={state?.error} />
    </form>
  );
}
