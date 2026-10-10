"use client";

import { useActionState } from "react";
import { createSpot, type FormState } from "@/app/actions";
import { Field, FormError, SubmitButton } from "@/components/form-bits";

export function SpotForm({ warId }: { warId?: string }) {
  const [state, action] = useActionState<FormState, FormData>(createSpot, null);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="card grid gap-5 p-6">
      {warId && <input type="hidden" name="warId" value={warId} />}
      <Field label="Name" error={fe.name}>
        <input name="name" required maxLength={80} className="field" placeholder="The Copper Kettle" />
      </Field>
      <Field label="Neighborhood / city" error={fe.neighborhood} hint="Helps people find it.">
        <input name="neighborhood" maxLength={60} className="field" placeholder="Riverside, Portland" />
      </Field>
      <Field label="What's it like?" error={fe.description}>
        <textarea name="description" maxLength={400} rows={3} className="field" placeholder="Dim lights, sticky tables, legendary ranch." />
      </Field>
      <FormError error={state?.error} />
      <div>
        <SubmitButton pendingText="Raising the lantern…">🏮 Add spot</SubmitButton>
      </div>
    </form>
  );
}
