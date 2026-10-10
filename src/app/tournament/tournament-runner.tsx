"use client";

import { useMemo, useState, useTransition } from "react";
import { saveTournament } from "@/app/actions";
import { BracketView } from "@/components/bracket-view";
import { WingSpirit } from "@/components/wing-spirit";
import { buildBracket, roundName, seedEntrants, TOURNAMENT_SIZES } from "@/lib/bracket";
import type { WingOption } from "@/lib/queries";

const NAMES = [
  "The Spring Lantern Cup",
  "Festival of a Thousand Napkins",
  "The Windy Hill Invitational",
  "Moonlit Sauce Showdown",
  "The Great Bathhouse Brawl",
  "Harvest Moon Wing Classic",
];

export function TournamentRunner({ wings }: { wings: WingOption[] }) {
  const maxSize = [...TOURNAMENT_SIZES].reverse().find((s) => s <= wings.length) ?? 4;
  const [size, setSize] = useState<number>(Math.min(8, maxSize));
  const [name, setName] = useState(() => NAMES[Math.floor(Math.random() * NAMES.length)]);
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [entrants, setEntrants] = useState<string[] | null>(null);
  const [picks, setPicks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const byId = useMemo(() => new Map(wings.map((w) => [w.id, w])), [wings]);
  const bracket = entrants ? buildBracket(entrants, picks) : null;

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < size ? [...s, id] : s));
  }

  function fillRandom() {
    const pool = wings.map((w) => w.id).filter((id) => !selected.includes(id));
    const out = [...selected];
    while (out.length < size && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    setSelected(out);
  }

  function begin(mode: "seeded" | "shuffled") {
    const list = [...selected];
    if (mode === "seeded") {
      list.sort((a, b) => byId.get(b)!.elo - byId.get(a)!.elo);
      setEntrants(seedEntrants(list));
    } else {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      setEntrants(list);
    }
    setPicks([]);
  }

  function save() {
    if (!entrants) return;
    setError(null);
    startSaving(async () => {
      const res = await saveTournament({ name, entrants, picks });
      if (res?.error) setError(res.error);
    });
  }

  /* ── setup ─────────────────────────────────────────────── */
  if (!entrants || !bracket) {
    const visible = wings.filter((w) => `${w.name} ${w.spotName}`.toLowerCase().includes(filter.toLowerCase()));
    return (
      <div className="grid gap-6">
        <section className="card grid gap-5 p-6">
          <label className="block">
            <span className="mb-1 block text-sm font-bold">Tournament name</span>
            <input className="field font-display text-xl" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
          </label>
          <div>
            <span className="mb-2 block text-sm font-bold">Bracket size</span>
            <div className="flex gap-2">
              {TOURNAMENT_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={s > wings.length}
                  onClick={() => {
                    setSize(s);
                    setSelected((sel) => sel.slice(0, s));
                  }}
                  className={`btn text-sm ${size === s ? "btn-primary" : "btn-secondary"}`}
                >
                  {s} wings
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="card p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">
              Pick your contenders <span className="text-ink-soft">({selected.length}/{size})</span>
            </h2>
            <div className="flex gap-2">
              <button type="button" className="btn btn-secondary text-sm" onClick={fillRandom}>🎲 Fill randomly</button>
              <button type="button" className="btn btn-ghost text-sm" onClick={() => setSelected([])}>Clear</button>
            </div>
          </div>
          <input className="field mb-4" placeholder="Search wings or spots…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <div className="grid max-h-[28rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {visible.map((w) => {
              const on = selected.includes(w.id);
              return (
                <button
                  type="button"
                  key={w.id}
                  onClick={() => toggle(w.id)}
                  aria-pressed={on}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-2 text-left transition ${on ? "border-sauce bg-sauce/10" : "border-line hover:border-honey"}`}
                >
                  <WingSpirit seed={w.id} heat={w.heat} style={w.style} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{w.name}</span>
                    <span className="block truncate text-xs text-ink-soft">{w.spotName} · {w.elo}</span>
                  </span>
                  <span aria-hidden>{on ? "✅" : "➕"}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn btn-primary" disabled={selected.length !== size} onClick={() => begin("seeded")}>
              🏯 Begin (seeded by rating)
            </button>
            <button type="button" className="btn btn-secondary" disabled={selected.length !== size} onClick={() => begin("shuffled")}>
              🎲 Begin (random draw)
            </button>
          </div>
        </section>
      </div>
    );
  }

  /* ── play / finished ───────────────────────────────────── */
  const current = bracket.current;
  const champion = bracket.champion ? byId.get(bracket.champion) : null;

  return (
    <div className="grid gap-6">
      {current ? (
        <section className="card p-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sauce">{roundName(current.round, bracket.rounds)}</p>
          <h2 className="mb-6 text-2xl font-semibold">Which wing wins? Tap the victor.</h2>
          <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
            {[current.a, current.b].map((id, i) => {
              const w = byId.get(id)!;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPicks((p) => [...p, id])}
                  className={`group flex flex-col items-center gap-2 rounded-3xl border-2 border-line p-5 transition hover:-translate-y-1 hover:border-sauce hover:bg-sauce/5 ${i === 1 ? "sm:order-3" : ""}`}
                >
                  <WingSpirit seed={w.id} heat={w.heat} style={w.style} size={120} className="group-hover:animate-bob" />
                  <span className="font-display text-xl font-semibold">{w.name}</span>
                  <span className="text-sm text-ink-soft">{w.spotName} · {w.elo}</span>
                </button>
              );
            })}
            <div className="animate-clash font-display text-4xl font-bold text-sauce sm:order-2">VS</div>
          </div>
          <div className="mt-6 flex justify-center gap-2">
            <button type="button" className="btn btn-ghost text-sm" disabled={picks.length === 0} onClick={() => setPicks((p) => p.slice(0, -1))}>
              ↩ Undo
            </button>
            <button type="button" className="btn btn-ghost text-sm" onClick={() => setEntrants(null)}>
              Start over
            </button>
          </div>
        </section>
      ) : (
        champion && (
          <section className="card p-8 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sauce">🏯 {name}</p>
            <div className="my-4 flex justify-center animate-bob">
              <WingSpirit seed={champion.id} heat={champion.heat} style={champion.style} size={180} crowned />
            </div>
            <h2 className="text-4xl font-semibold">{champion.name} is champion!</h2>
            <p className="mt-1 text-ink-soft">of {champion.spotName}</p>
            <p className="mx-auto mt-4 max-w-md text-sm text-ink-soft">
              Saving records every match as a battle, so ratings will shift across the leaderboard.
            </p>
            {error && <p className="mt-3 font-bold text-ember">{error}</p>}
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? "Inscribing the scroll…" : "📜 Save to the chronicle"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setPicks((p) => p.slice(0, -1))} disabled={saving}>
                ↩ Undo final
              </button>
            </div>
          </section>
        )
      )}

      <section className="card p-6">
        <h3 className="mb-4 text-lg font-semibold">The bracket</h3>
        <BracketView size={entrants.length} matches={bracket.matches} wings={byId} current={current} />
      </section>
    </div>
  );
}
