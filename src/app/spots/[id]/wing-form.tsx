"use client";

import { useActionState, useState } from "react";
import { createWing, type FormState } from "@/app/actions";
import { Field, FormError, SubmitButton } from "@/components/form-bits";
import { WingSpirit } from "@/components/wing-spirit";
import { HEAT_LABELS } from "@/lib/scoring";

/** Must match NEW_TYPE in actions.ts. */
const NEW_TYPE = "__new";

export function WingForm({ spotId, types }: { spotId: string; types: { id: string; name: string; emoji: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(createWing, null);
  const [heat, setHeat] = useState(2);
  const [style, setStyle] = useState<"bone-in" | "boneless">("bone-in");
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState("");
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="spotId" value={spotId} />
      <div className="flex justify-center">
        <WingSpirit seed={`${spotId}-${name || "new"}`} heat={heat} style={style} size={110} className="animate-bob" />
      </div>
      <Field label="Flavor / name" error={fe.name}>
        <input name="name" required maxLength={80} className="field" placeholder="Honey Garlic" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Wing type" error={fe.wingTypeId} hint="So it can be compared with the same type at other spots.">
        <select name="wingTypeId" required className="field" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
          <option value="">— Choose a type —</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.emoji} {t.name}
            </option>
          ))}
          <option value={NEW_TYPE}>➕ Something new…</option>
        </select>
      </Field>
      {typeId === NEW_TYPE && (
        <Field label="New wing type" error={fe.newType}>
          <input name="newType" maxLength={40} className="field" placeholder="Maple Bourbon" autoFocus />
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Style" error={fe.style}>
          <select name="style" className="field" value={style} onChange={(e) => setStyle(e.target.value as typeof style)}>
            <option value="bone-in">Bone-in</option>
            <option value="boneless">Boneless</option>
          </select>
        </Field>
        <Field label={`Advertised heat: ${HEAT_LABELS[heat]}`} error={fe.heat}>
          <input type="range" name="heat" min={0} max={5} value={heat} onChange={(e) => setHeat(Number(e.target.value))} className="score-slider mt-3" style={{ ["--fill" as string]: `${heat * 20}%` }} />
        </Field>
      </div>
      <Field label="Description (optional)" error={fe.description}>
        <textarea name="description" maxLength={400} rows={2} className="field" placeholder="Twice-fried, tossed in a ginger glaze." />
      </Field>
      <FormError error={state?.error} />
      <div>
        <SubmitButton pendingText="Summoning…">🍗 Add wing</SubmitButton>
      </div>
    </form>
  );
}
