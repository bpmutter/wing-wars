"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { createBattle, createSpotBattle, type FormState } from "@/app/actions";
import { ScoreSlider } from "@/components/score-slider";
import { SpotSpirit } from "@/components/spot-spirit";
import { WingSpirit } from "@/components/wing-spirit";
import { expectedScore } from "@/lib/elo";
import { rankFor } from "@/lib/ranks";
import { ELEMENTS, MAX_SCORE, SPOT_ELEMENTS, startingScores, sumOf, type Element } from "@/lib/scoring";

/** Anything that can step into the arena: a wing or a spot. */
export type Contender = {
  id: string;
  name: string;
  /** Shown under the name — the spot for a wing, the neighborhood for a spot. */
  subtitle: string;
  /** Used to group the picker. */
  group: string;
  elo: number;
  heat?: number;
  style?: "bone-in" | "boneless";
  typeId?: string | null;
  typeName?: string | null;
};

type Mode = "wing" | "spot";

const COPY = {
  wing: {
    noun: "wing",
    elementsTitle: "The Five Elements",
    elementsHint: "Score each wing from 1 (sad) to 10 (transcendent).",
    placeholder: "The blue cheese was a crime. The crunch was a poem.",
    notListed: (
      <>
        Not listed? <Link href="/spots/new" className="link">Add a spot</Link> or add a wing from a spot&apos;s page.
      </>
    ),
  },
  spot: {
    noun: "spot",
    elementsTitle: "The Five Virtues",
    elementsHint: "Judge the whole visit, from 1 (never again) to 10 (I live here now).",
    placeholder: "Great wings, but the ranch tasted like regret. The other place had a fireplace.",
    notListed: (
      <>
        Not listed? <Link href="/spots/new" className="link">Add a spot</Link>.
      </>
    ),
  },
} as const;

export function BattleForm({
  mode,
  contenders,
  types = [],
  initialA,
  initialB,
}: {
  mode: Mode;
  contenders: Contender[];
  types?: { id: string; name: string; emoji: string }[];
  initialA?: string;
  initialB?: string;
}) {
  const elements: readonly Element[] = mode === "wing" ? ELEMENTS : SPOT_ELEMENTS;
  const copy = COPY[mode];
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "wing" ? createBattle : createSpotBattle, null);
  const [aId, setA] = useState(initialA ?? "");
  const [bId, setB] = useState(initialB ?? "");
  const [typeFilter, setTypeFilter] = useState("");
  const [scoresA, setScoresA] = useState(() => startingScores(elements));
  const [scoresB, setScoresB] = useState(() => startingScores(elements));
  const [manualWinner, setManualWinner] = useState<"a" | "b" | null>(null);

  const byId = useMemo(() => new Map(contenders.map((c) => [c.id, c])), [contenders]);
  const pool = useMemo(() => (typeFilter ? contenders.filter((c) => c.typeId === typeFilter) : contenders), [contenders, typeFilter]);
  const a = byId.get(aId);
  const b = byId.get(bId);
  const totalA = sumOf(elements, scoresA);
  const totalB = sumOf(elements, scoresB);
  const suggested = totalA === totalB ? null : totalA > totalB ? "a" : "b";
  const winner = manualWinner ?? suggested;
  const maxTotal = MAX_SCORE * elements.length;

  const grouped = useMemo(() => {
    const g = new Map<string, Contender[]>();
    for (const c of pool) g.set(c.group, [...(g.get(c.group) ?? []), c]);
    return [...g.entries()];
  }, [pool]);

  // Only types that actually have at least two wings make sense as a filter.
  const usableTypes = useMemo(
    () => types.filter((t) => contenders.filter((c) => c.typeId === t.id).length >= 2),
    [types, contenders],
  );

  function chooseType(id: string) {
    setTypeFilter(id);
    if (id) {
      if (a && a.typeId !== id) setA("");
      if (b && b.typeId !== id) setB("");
    }
  }

  function randomize() {
    if (pool.length < 2) return;
    const i = Math.floor(Math.random() * pool.length);
    let j = Math.floor(Math.random() * (pool.length - 1));
    if (j >= i) j++;
    setA(pool[i].id);
    setB(pool[j].id);
  }

  const fe = state?.fieldErrors ?? {};
  const field = mode === "wing" ? { a: "wingAId", b: "wingBId" } : { a: "spotAId", b: "spotBId" };

  const avatar = (c: Contender, side: "a" | "b") =>
    mode === "wing" ? (
      <WingSpirit seed={c.id} heat={c.heat} style={c.style} size={136} className="animate-bob" crowned={winner === side} />
    ) : (
      <SpotSpirit seed={c.id} size={136} className="animate-bob" crowned={winner === side} />
    );

  const contender = (side: "a" | "b") => {
    const id = side === "a" ? aId : bId;
    const other = side === "a" ? bId : aId;
    const c = side === "a" ? a : b;
    const setter = side === "a" ? setA : setB;
    const err = fe[field[side]];
    return (
      <div className={`flex flex-col items-center gap-3 text-center ${side === "b" ? "md:order-3" : ""}`}>
        <div className="grid h-36 place-items-center">
          {c ? (
            avatar(c, side)
          ) : (
            <div className="grid h-28 w-28 place-items-center rounded-full border-2 border-dashed border-line text-4xl text-ink-soft">?</div>
          )}
        </div>
        <label className="w-full">
          <span className="sr-only">Contender {side.toUpperCase()}</span>
          <select name={field[side]} value={id} onChange={(e) => setter(e.target.value)} className="field text-center font-bold">
            <option value="">— Choose contender {side.toUpperCase()} —</option>
            {grouped.map(([group, list]) => (
              <optgroup key={group} label={group}>
                {list.map((o) => (
                  <option key={o.id} value={o.id} disabled={o.id === other}>
                    {mode === "wing" ? `${o.name} (${o.style})` : o.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {err && <p className="text-sm font-bold text-ember">{err}</p>}
        {c && (
          <div className="text-sm text-ink-soft">
            {c.subtitle && <>{c.subtitle} · </>}
            <b className="text-ink">{c.elo}</b> · {rankFor(c.elo, mode).title}
            {mode === "wing" && c.typeName && <> · {c.typeName}</>}
          </div>
        )}
      </div>
    );
  };

  const odds = a && b ? Math.round(expectedScore(a.elo, b.elo) * 100) : null;

  return (
    <form action={action} className="grid gap-8">
      {/* Contenders */}
      <section className="card relative overflow-hidden p-6">
        {mode === "wing" && usableTypes.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            <label htmlFor="type-filter" className="text-sm font-bold">
              Same-type showdown?
            </label>
            <select id="type-filter" value={typeFilter} onChange={(e) => chooseType(e.target.value)} className="field w-auto! py-1.5! text-sm">
              <option value="">Any type vs any type</option>
              {usableTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.emoji} {t.name} only
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          {contender("a")}
          <div className="flex flex-col items-center gap-3 md:order-2">
            <div className="animate-clash font-display text-5xl font-bold text-sauce">VS</div>
            <button type="button" className="btn btn-secondary text-sm" onClick={randomize}>
              🎲 Surprise me
            </button>
          </div>
          {contender("b")}
        </div>
        {odds !== null && a && b && (
          <p className="mt-6 text-center text-sm text-ink-soft">
            🔮 The forest oracle gives <b className="text-ink">{a.name}</b> a {odds}% chance and{" "}
            <b className="text-ink">{b.name}</b> {100 - odds}%.{" "}
            {Math.abs(odds - 50) >= 15 && "An upset would shake the hills!"}
          </p>
        )}
        <p className="mt-3 text-center text-sm text-ink-soft">{copy.notListed}</p>
      </section>

      {/* Tale of the tape */}
      <section className="card p-6">
        <h2 className="mb-1 text-center text-2xl font-semibold">{copy.elementsTitle}</h2>
        <p className="mb-6 text-center text-sm text-ink-soft">{copy.elementsHint}</p>
        <div className="grid gap-5">
          {elements.map((e) => (
            <div key={e.key} className="grid items-center gap-2 md:grid-cols-[1fr_9rem_1fr] md:gap-6">
              <div className="text-center md:order-2">
                <div className="font-bold">
                  <span aria-hidden>{e.icon}</span> {e.label}
                </div>
                <div className="text-xs text-ink-soft">{e.hint}</div>
              </div>
              <div className="md:order-1">
                <ScoreSlider
                  name={`a.${e.key}`}
                  label={`${a?.name ?? "Contender A"} ${e.label}`}
                  value={scoresA[e.key]}
                  onChange={(v) => setScoresA((s) => ({ ...s, [e.key]: v }))}
                  align="right"
                />
              </div>
              <div className="md:order-3">
                <ScoreSlider
                  name={`b.${e.key}`}
                  label={`${b?.name ?? "Contender B"} ${e.label}`}
                  value={scoresB[e.key]}
                  onChange={(v) => setScoresB((s) => ({ ...s, [e.key]: v }))}
                />
              </div>
            </div>
          ))}
          <div className="grid items-center gap-2 border-t border-line pt-4 md:grid-cols-[1fr_9rem_1fr] md:gap-6">
            <div className="text-center font-display text-3xl font-semibold tabular-nums md:text-right">
              {totalA}
              <span className="text-base text-ink-soft">/{maxTotal}</span>
            </div>
            <div className="text-center text-sm font-bold uppercase tracking-wider text-ink-soft">Total</div>
            <div className="text-center font-display text-3xl font-semibold tabular-nums md:text-left">
              {totalB}
              <span className="text-base text-ink-soft">/{maxTotal}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Verdict */}
      <section className="card p-6">
        <h2 className="mb-4 text-center text-2xl font-semibold">Declare the victor</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["a", "b"] as const).map((side) => {
            const c = side === "a" ? a : b;
            const selected = winner === side;
            return (
              <label
                key={side}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition ${
                  selected ? "border-sauce bg-sauce/10" : "border-line hover:border-honey"
                }`}
              >
                <input type="radio" name="winner" value={side} checked={selected} onChange={() => setManualWinner(side)} className="accent-[var(--sauce)]" />
                <span className="text-2xl" aria-hidden>{selected ? "👑" : mode === "wing" ? "🍗" : "🏮"}</span>
                <span className="font-bold">{c ? c.name : `Contender ${side.toUpperCase()}`}</span>
                {suggested === side && !manualWinner && <span className="chip ml-auto">by score</span>}
              </label>
            );
          })}
        </div>
        {manualWinner && suggested && manualWinner !== suggested && (
          <p className="mt-3 text-center text-sm text-ink-soft">
            A heart-over-head verdict! Your scores favor the other {copy.noun}, but sometimes the soul knows best.
          </p>
        )}
        {fe.winner && <p className="mt-2 text-center text-sm font-bold text-ember">{fe.winner}</p>}

        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-bold">Battle notes (optional)</span>
          <textarea name="verdict" rows={3} maxLength={500} className="field" placeholder={copy.placeholder} />
        </label>

        {state?.error && <p className="mt-4 rounded-xl bg-ember/10 p-3 text-center font-bold text-ember">{state.error}</p>}

        <div className="mt-6 flex justify-center">
          <button type="submit" className="btn btn-primary px-8! text-lg" disabled={pending || !a || !b || !winner}>
            {pending ? "The spirits are deliberating…" : "⚔️ Seal the verdict"}
          </button>
        </div>
      </section>
    </form>
  );
}
