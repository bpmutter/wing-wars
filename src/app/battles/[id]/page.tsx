import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { EloDelta, LeafShower, RankBadge } from "@/components/bits";
import { Radar } from "@/components/radar";
import { WingSpirit } from "@/components/wing-spirit";
import { timeAgo } from "@/lib/format";
import { getBattle } from "@/lib/queries";
import { rankFor } from "@/lib/ranks";
import { ELEMENTS, MAX_SCORE, total, type Scores } from "@/lib/scoring";

export const metadata: Metadata = { title: "Battle report" };

const TAUNTS = [
  "The wind changed direction. So did the rankings.",
  "Somewhere, a napkin weeps.",
  "The forest spirits nod in quiet approval.",
  "It wasn't close. Or maybe it was. The sauce remembers.",
  "A tale they'll tell around the fryer for generations.",
];

export default async function BattlePage({ params, searchParams }: PageProps<"/battles/[id]">) {
  await connection();
  const { id } = await params;
  const { fresh } = await searchParams;
  const data = await getBattle(id);
  if (!data) notFound();
  const { battle, cardA, cardB, record } = data;

  const aWon = battle.winnerId === battle.a.id;
  const winner = aWon ? battle.a : battle.b;
  const loser = aWon ? battle.b : battle.a;
  const newEloA = battle.eloBeforeA + battle.eloDeltaA;
  const newEloB = battle.eloBeforeB + battle.eloDeltaB;
  const winnerBefore = aWon ? battle.eloBeforeA : battle.eloBeforeB;
  const loserBefore = aWon ? battle.eloBeforeB : battle.eloBeforeA;
  const upset = winnerBefore + 50 < loserBefore;
  const rankedUp = (before: number, after: number) => rankFor(after).title !== rankFor(before).title && after > before;
  const taunt = TAUNTS[battle.id.charCodeAt(0) % TAUNTS.length];

  const side = (w: typeof battle.a, before: number, delta: number, won: boolean) => (
    <div className={`flex flex-col items-center text-center ${won ? "" : "opacity-80"}`}>
      <div className={won ? "animate-bob" : ""}>
        <WingSpirit seed={w.id} heat={w.heat} style={w.style} size={won ? 170 : 130} crowned={won} dazed={!won} />
      </div>
      <p className={`mt-2 text-sm font-bold uppercase tracking-[0.2em] ${won ? "text-sauce" : "text-ink-soft"}`}>
        {won ? "👑 Victor" : "Defeated"}
      </p>
      <Link href={`/wings/${w.id}`} className="link font-display text-2xl font-semibold">
        {w.name}
      </Link>
      <Link href={`/spots/${w.spotId}`} className="text-sm text-ink-soft hover:underline">
        {w.spotName}
      </Link>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="tabular-nums text-ink-soft">{before}</span>→
        <span className="font-display text-xl font-semibold tabular-nums">{before + delta}</span>
        (<EloDelta delta={delta} />)
      </div>
      <div className="mt-2">
        <RankBadge elo={before + delta} />
      </div>
      {rankedUp(before, before + delta) && <p className="mt-2 text-sm font-bold text-moss">✨ Ranked up!</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {fresh && <LeafShower />}
      <div className="mb-6 text-center animate-rise">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-sauce">
          {battle.kind === "tournament" ? "🏯 Tournament match" : "⚔️ Battle report"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">
          {winner.name} defeats {loser.name}
        </h1>
        <p className="mt-2 text-ink-soft">
          {upset ? "🌪️ An upset! " : ""}
          {taunt}
        </p>
      </div>

      <section className="card relative overflow-hidden p-6 sm:p-10">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
          {side(battle.a, battle.eloBeforeA, battle.eloDeltaA, aWon)}
          <div className="animate-clash text-center font-display text-5xl font-bold text-sauce">VS</div>
          {side(battle.b, battle.eloBeforeB, battle.eloDeltaB, !aWon)}
        </div>
        <p className="mt-8 text-center text-sm text-ink-soft">
          Judged by{" "}
          <Link className="link font-bold text-ink" href={`/judges/${battle.userId}`}>
            {battle.userName}
          </Link>{" "}
          · {timeAgo(battle.createdAt)} · All-time head-to-head: {battle.a.name} {record.a} – {record.b} {battle.b.name}
        </p>
        {battle.tournamentId && (
          <p className="mt-2 text-center text-sm">
            <Link className="link" href={`/tournaments/${battle.tournamentId}`}>See the full bracket →</Link>
          </p>
        )}
      </section>

      {battle.verdict && (
        <blockquote className="card mx-auto mt-6 max-w-2xl p-6 text-center font-display text-xl italic">
          “{battle.verdict}”
          <footer className="mt-2 font-sans text-sm not-italic text-ink-soft">— {battle.userName}</footer>
        </blockquote>
      )}

      {cardA && cardB && (
        <section className="card mt-6 p-6 sm:p-8">
          <h2 className="mb-6 text-center text-2xl font-semibold">Tale of the tape</h2>
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-4">
              {ELEMENTS.map((e) => (
                <TapeRow key={e.key} label={`${e.icon} ${e.label}`} a={cardA[e.key]} b={cardB[e.key]} max={MAX_SCORE} />
              ))}
              <TapeRow label="Total" a={total(cardA)} b={total(cardB)} max={MAX_SCORE * ELEMENTS.length} bold />
            </div>
            <div className="flex flex-col items-center">
              <Radar
                series={[
                  { scores: cardA as Scores, color: "var(--sauce)", label: battle.a.name },
                  { scores: cardB as Scores, color: "var(--moss)", label: battle.b.name },
                ]}
                size={260}
              />
              <div className="flex gap-4 text-sm">
                <span><span className="inline-block h-3 w-3 rounded-full bg-sauce" /> {battle.a.name}</span>
                <span><span className="inline-block h-3 w-3 rounded-full bg-moss" /> {battle.b.name}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/battle?a=${battle.a.id}&b=${battle.b.id}`} className="btn btn-secondary">
          🔁 Rematch
        </Link>
        <Link href="/battle" className="btn btn-primary">
          ⚔️ New battle
        </Link>
        <Link href="/leaderboard" className="btn btn-secondary">
          🏆 Leaderboard
        </Link>
      </div>
      <p className="mt-4 text-center text-xs text-ink-soft">
        New ratings: {battle.a.name} {newEloA} · {battle.b.name} {newEloB}
      </p>
    </div>
  );
}

function TapeRow({ label, a, b, max, bold }: { label: string; a: number; b: number; max: number; bold?: boolean }) {
  return (
    <div className={`grid grid-cols-[2.5rem_1fr_6.5rem_1fr_2.5rem] items-center gap-2 ${bold ? "border-t border-line pt-4" : ""}`}>
      <span className={`text-right tabular-nums ${a > b ? "font-bold text-sauce" : ""} ${bold ? "font-display text-xl" : ""}`}>{a}</span>
      <div className="flex h-3 justify-end overflow-hidden rounded-full bg-paper-2">
        <div className="rounded-full bg-sauce" style={{ width: `${(a / max) * 100}%` }} />
      </div>
      <span className={`text-center text-sm ${bold ? "font-bold uppercase tracking-wider" : "font-bold"}`}>{label}</span>
      <div className="flex h-3 overflow-hidden rounded-full bg-paper-2">
        <div className="rounded-full bg-moss" style={{ width: `${(b / max) * 100}%` }} />
      </div>
      <span className={`tabular-nums ${b > a ? "font-bold text-moss" : ""} ${bold ? "font-display text-xl" : ""}`}>{b}</span>
    </div>
  );
}
