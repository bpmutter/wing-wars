import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { EloDelta, LeafShower, RankBadge, TapeRow } from "@/components/bits";
import { Radar } from "@/components/radar";
import { SpotSpirit } from "@/components/spot-spirit";
import { timeAgo } from "@/lib/format";
import { getSpotBattle } from "@/lib/queries";
import { rankFor } from "@/lib/ranks";
import { MAX_SCORE, SPOT_ELEMENTS, spotTotal } from "@/lib/scoring";

export const metadata: Metadata = { title: "Spot showdown" };

const TAUNTS = [
  "The lanterns of one tavern burn a little brighter tonight.",
  "Somewhere, a basket of fries goes cold in defeat.",
  "The ranch has spoken.",
  "Travelers will remember this one.",
  "Two kitchens enter. One gets the line out the door.",
];

export default async function SpotBattlePage({ params, searchParams }: PageProps<"/spot-battles/[id]">) {
  await connection();
  const { id } = await params;
  const { fresh } = await searchParams;
  const data = await getSpotBattle(id);
  if (!data) notFound();
  const { battle, cardA, cardB, record } = data;

  const aWon = battle.winnerId === battle.a.id;
  const winner = aWon ? battle.a : battle.b;
  const loser = aWon ? battle.b : battle.a;
  const upset = (aWon ? battle.eloBeforeA : battle.eloBeforeB) + 50 < (aWon ? battle.eloBeforeB : battle.eloBeforeA);
  const rankedUp = (before: number, after: number) => after > before && rankFor(after, "spot").title !== rankFor(before, "spot").title;
  const taunt = TAUNTS[battle.id.charCodeAt(0) % TAUNTS.length];

  const side = (s: typeof battle.a, before: number, delta: number, won: boolean) => (
    <div className={`flex flex-col items-center text-center ${won ? "" : "opacity-80"}`}>
      <div className={won ? "animate-bob" : ""}>
        <SpotSpirit seed={s.id} size={won ? 170 : 130} crowned={won} dazed={!won} />
      </div>
      <p className={`mt-2 text-sm font-bold uppercase tracking-[0.2em] ${won ? "text-sauce" : "text-ink-soft"}`}>{won ? "👑 Victor" : "Defeated"}</p>
      <Link href={`/spots/${s.id}`} className="link font-display text-2xl font-semibold">
        {s.name}
      </Link>
      {s.neighborhood && <span className="text-sm text-ink-soft">{s.neighborhood}</span>}
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="tabular-nums text-ink-soft">{before}</span>→
        <span className="font-display text-xl font-semibold tabular-nums">{before + delta}</span>
        (<EloDelta delta={delta} />)
      </div>
      <div className="mt-2">
        <RankBadge elo={before + delta} kind="spot" />
      </div>
      {rankedUp(before, before + delta) && <p className="mt-2 text-sm font-bold text-moss">✨ Ranked up!</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {fresh && <LeafShower />}
      <div className="mb-6 text-center animate-rise">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-sauce">🏮 Spot showdown</p>
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
              {SPOT_ELEMENTS.map((e) => (
                <TapeRow key={e.key} label={`${e.icon} ${e.label}`} a={cardA[e.key]} b={cardB[e.key]} max={MAX_SCORE} />
              ))}
              <TapeRow label="Total" a={spotTotal(cardA)} b={spotTotal(cardB)} max={MAX_SCORE * SPOT_ELEMENTS.length} bold />
            </div>
            <div className="flex flex-col items-center">
              <Radar
                elements={SPOT_ELEMENTS}
                series={[
                  { scores: cardA, color: "var(--sauce)", label: battle.a.name },
                  { scores: cardB, color: "var(--moss)", label: battle.b.name },
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
        <Link href={`/battle?mode=spot&a=${battle.a.id}&b=${battle.b.id}`} className="btn btn-secondary">
          🔁 Rematch
        </Link>
        <Link href="/battle?mode=spot" className="btn btn-primary">
          ⚔️ New showdown
        </Link>
        <Link href="/leaderboard?board=spots" className="btn btn-secondary">
          🏆 Spot rankings
        </Link>
      </div>
    </div>
  );
}
