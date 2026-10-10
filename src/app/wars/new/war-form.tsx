"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { createWar, type FormState } from "@/app/actions";
import { Field, FormError, SubmitButton } from "@/components/form-bits";
import { SpotSpirit } from "@/components/spot-spirit";

type SpotOption = { id: string; name: string; neighborhood: string };
type TypeOption = { id: string; name: string; emoji: string };

const SEASONS = ["Spring", "Summer", "Harvest Moon", "First Snow", "Lantern Festival", "Midsummer"];

function suggestName(type?: TypeOption) {
  const season = SEASONS[Math.floor(Math.random() * SEASONS.length)];
  return type ? `The ${season} ${type.name} War` : `The ${season} Wing War`;
}

export function WarForm({ spots, types, defaultEndsOn }: { spots: SpotOption[]; types: TypeOption[]; defaultEndsOn: string }) {
  const [state, action] = useActionState<FormState, FormData>(createWar, null);
  const [typeId, setTypeId] = useState("");
  const [name, setName] = useState(() => suggestName());
  const [nameTouched, setNameTouched] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const fe = state?.fieldErrors ?? {};

  const visible = useMemo(
    () => spots.filter((s) => `${s.name} ${s.neighborhood}`.toLowerCase().includes(filter.toLowerCase())),
    [spots, filter],
  );

  function chooseType(id: string) {
    setTypeId(id);
    if (!nameTouched) setName(suggestName(types.find((t) => t.id === id)));
  }

  return (
    <form action={action} className="grid gap-6">
      <section className="card grid gap-5 p-6">
        <Field label="Name of the war" error={fe.name}>
          <input
            name="name"
            required
            maxLength={80}
            className="field font-display text-xl"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameTouched(true);
            }}
          />
        </Field>
        <Field label="The call to arms (optional)" error={fe.description} hint="Rules, vibes, who's bringing the wet wipes.">
          <textarea name="description" maxLength={600} rows={3} className="field" placeholder="Every Friday until the leaves fall, we eat. Bring napkins and an open heart." />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Which wings count?" error={fe.wingTypeId} hint="Pick a type for a focused war, like a Buffalo War.">
            <select name="wingTypeId" className="field" value={typeId} onChange={(e) => chooseType(e.target.value)}>
              <option value="">Any wing — the full menu</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.emoji} {t.name} only
                </option>
              ))}
            </select>
          </Field>
          <Field label="The war ends on" error={fe.endsOn} hint="Optional. Leave blank and you, the host, decide when it ends.">
            <input type="date" name="endsOn" defaultValue={defaultEndsOn} className="field" />
          </Field>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-paper p-4">
          <input type="checkbox" name="fogOfWar" defaultChecked className="mt-1 h-5 w-5 accent-[var(--sauce)]" />
          <span>
            <span className="font-bold">🌫️ Fog of war</span>
            <span className="block text-sm text-ink-soft">
              Keep the standings hidden until the war ends, so nobody gets swayed by the scoreboard. Everyone sees
              the grand reveal together. (Recommended.)
            </span>
          </span>
        </label>
      </section>

      <section className="card p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">
              Battlegrounds <span className="text-ink-soft">({selected.length})</span>
            </h2>
            <p className="text-sm text-ink-soft">Each restaurant is a battle in this war. Members can add more later.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary text-sm" onClick={() => setSelected(spots.map((s) => s.id))}>
              Select all
            </button>
            <button type="button" className="btn btn-ghost text-sm" onClick={() => setSelected([])}>
              Clear
            </button>
          </div>
        </div>
        <input className="field mb-4" placeholder="Search spots…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Search spots" />
        <div className="grid max-h-[26rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {visible.map((s) => {
            const on = selected.includes(s.id);
            return (
              <label
                key={s.id}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-2 transition ${on ? "border-sauce bg-sauce/10" : "border-line hover:border-honey"}`}
              >
                <input
                  type="checkbox"
                  name="spotIds"
                  value={s.id}
                  checked={on}
                  onChange={() => setSelected((sel) => (on ? sel.filter((x) => x !== s.id) : [...sel, s.id]))}
                  className="sr-only"
                />
                <SpotSpirit seed={s.id} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{s.name}</span>
                  <span className="block truncate text-xs text-ink-soft">{s.neighborhood || "—"}</span>
                </span>
                <span aria-hidden>{on ? "✅" : "➕"}</span>
              </label>
            );
          })}
        </div>
        {fe.spotIds && <p className="mt-3 text-sm font-bold text-ember">{fe.spotIds}</p>}
        <p className="mt-4 text-sm text-ink-soft">
          Missing a spot? <Link href="/spots/new" className="link">Add it first</Link>, or add it from inside the war once it starts.
        </p>
      </section>

      <FormError error={state?.error} />
      <div className="flex justify-center">
        <SubmitButton pendingText="Sounding the war horns…">🏯 Declare war</SubmitButton>
      </div>
    </form>
  );
}
