"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { createBattle, type FormState } from "@/app/actions";
import { ScoreSlider } from "@/components/score-slider";
import { WingSpirit } from "@/components/wing-spirit";
import { expectedScore } from "@/lib/elo";
import type { WingOption } from "@/lib/queries";
import { rankFor } from "@/lib/ranks";
import { ELEMENTS, MAX_TOTAL, type Scores } from "@/lib/scoring";

const startScores = (): Scores => ({ crisp: 5, sauce: 5, juiciness: 5, heat: 5, value: 5 });

export function BattleForm({ wings, initialA, initialB }: { wings: WingOption[]; initialA?: string; initialB?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createBattle, null);
  const [aId, setA] = useState(initialA ?? "");
  const [bId, setB] = useState(initialB ?? "");
  const [scoresA, setScoresA] = useState<Scores>(startScores);
  const [scoresB, setScoresB] = useState<Scores>(startScores);
  const [manualWinner, setManualWinner] = useState<"a" | "b" | null>(null);

  const byId = useMemo(() => new Map(wings.map((w) => [w.id, w])), [wings]);
  const a = byId.get(aId);
  const b = byId.get(bId);
  const totalA = ELEMENTS.reduce((s, e) => s + scoresA[e.key], 0);
  const totalB = ELEMENTS.reduce((s, e) => s + scoresB[e.key], 0);
  const suggested = totalA === totalB ? null : totalA > totalB ? "a" : "b";
  const winner = manualWinner ?? suggested;

  const grouped = useMemo(() => {
    const g = new Map<string, WingOption[]>();
    for (const w of wings) g.set(w.spotName, [...(g.get(w.spotName) ?? []), w]);
    return [...g.entries()];
  }, [wings]);

  function randomize() {
    if (wings.length < 2) return;
    const i = Math.floor(Math.random() * wings.length);
    let j = Math.floor(Math.random() * (wings.length - 1));
    if (j >= i) j++;
    setA(wings[i].id);
    setB(wings[j].id);
  }

  const fe = state?.fieldErrors ?? {};

  const contender = (side: "a" | "b") => {
    const id = side === "a" ? aId : bId;
    const other = side === "a" ? bId : aId;
    const w = side === "a" ? a : b;
    const setter = side === "a" ? setA : setB;
    const err = fe[side === "a" ? "wingAId" : "wingBId"];
    return (
      <div className={`flex flex-col items-center gap-3 text-center ${side === "b" ? "md:order-3" : ""}`}>
        <div className="grid h-36 place-items-center">
          {w ? (
            <WingSpirit
              seed={w.id}
              heat={w.heat}
              style={w.style}
              size={136}
              className="animate-bob"
              crowned={winner === side}
            />
          ) : (
            <div className="grid h-28 w-28 place-items-center rounded-full border-2 border-dashed border-line text-4xl text-ink-soft">?</div>
          )}
        </div>
        <label className="w-full">
          <span className="sr-only">Contender {side.toUpperCase()}</span>
          <select
            name={side === "a" ? "wingAId" : "wingBId"}
            value={id}
            onChange={(e) => setter(e.target.value)}
            className="field text-center font-bold"
          >
            <option value="">— Choose contender {side.toUpperCase()} —</option>
            {grouped.map(([spot, list]) => (
              <optgroup key={spot} label={spot}>
                {list.map((o) => (
                  <option key={o.id} value={o.id} disabled={o.id === other}>
                    {o.name} ({o.style})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {err && <p className="text-sm font-bold text-ember">{err}</p>}
        {w && (
          <div className="text-sm text-ink-soft">
            {w.spotName} · <b className="text-ink">{w.elo}</b> · {rankFor(w.elo).title}
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
        <p className="mt-3 text-center text-sm text-ink-soft">
          Not listed? <Link href="/spots/new" className="link">Add a spot</Link> or add a wing from a spot&apos;s page.
        </p>
      </section>

      {/* Tale of the tape */}
      <section className="card p-6">
        <h2 className="mb-1 text-center text-2xl font-semibold">The Five Elements</h2>
        <p className="mb-6 text-center text-sm text-ink-soft">Score each wing from 1 (sad) to 10 (transcendent).</p>
        <div className="grid gap-5">
          {ELEMENTS.map((e) => (
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
              <span className="text-base text-ink-soft">/{MAX_TOTAL}</span>
            </div>
            <div className="text-center text-sm font-bold uppercase tracking-wider text-ink-soft">Total</div>
            <div className="text-center font-display text-3xl font-semibold tabular-nums md:text-left">
              {totalB}
              <span className="text-base text-ink-soft">/{MAX_TOTAL}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Verdict */}
      <section className="card p-6">
        <h2 className="mb-4 text-center text-2xl font-semibold">Declare the victor</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["a", "b"] as const).map((side) => {
            const w = side === "a" ? a : b;
            const selected = winner === side;
            return (
              <label
                key={side}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition ${
                  selected ? "border-sauce bg-sauce/10" : "border-line hover:border-honey"
                }`}
              >
                <input
                  type="radio"
                  name="winner"
                  value={side}
                  checked={selected}
                  onChange={() => setManualWinner(side)}
                  className="accent-[var(--sauce)]"
                />
                <span className="text-2xl" aria-hidden>{selected ? "👑" : "🍗"}</span>
                <span className="font-bold">{w ? w.name : `Contender ${side.toUpperCase()}`}</span>
                {suggested === side && !manualWinner && <span className="chip ml-auto">by score</span>}
              </label>
            );
          })}
        </div>
        {manualWinner && suggested && manualWinner !== suggested && (
          <p className="mt-3 text-center text-sm text-ink-soft">
            A heart-over-head verdict! Your scores favor the other wing, but sometimes the soul knows best.
          </p>
        )}
        {fe.winner && <p className="mt-2 text-center text-sm font-bold text-ember">{fe.winner}</p>}

        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-bold">Battle notes (optional)</span>
          <textarea name="verdict" rows={3} maxLength={500} className="field" placeholder="The blue cheese was a crime. The crunch was a poem." />
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
