"use client";

import { useActionState, useState } from "react";
import { assignWingType, type FormState } from "@/app/actions";
import { FormError, SubmitButton } from "@/components/form-bits";

/** Must match NEW_TYPE in actions.ts. */
const NEW_TYPE = "__new";

export function AssignTypeForm({ wingId, types }: { wingId: string; types: { id: string; name: string; emoji: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(assignWingType, null);
  const [typeId, setTypeId] = useState("");
  return (
    <form action={action} className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-paper-2 p-3 text-sm">
      <input type="hidden" name="wingId" value={wingId} />
      <span className="font-bold">This wing has no type yet:</span>
      <select name="wingTypeId" required className="field w-auto! py-1.5!" value={typeId} onChange={(e) => setTypeId(e.target.value)} aria-label="Wing type">
        <option value="">— Choose —</option>
        {types.map((t) => (
          <option key={t.id} value={t.id}>
            {t.emoji} {t.name}
          </option>
        ))}
        <option value={NEW_TYPE}>➕ Something new…</option>
      </select>
      {typeId === NEW_TYPE && <input name="newType" maxLength={40} className="field w-auto! py-1.5!" placeholder="New type name" aria-label="New wing type" />}
      <SubmitButton pendingText="…">Set type</SubmitButton>
      <FormError error={state?.error ?? Object.values(state?.fieldErrors ?? {})[0]} />
    </form>
  );
}
