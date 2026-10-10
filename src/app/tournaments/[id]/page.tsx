import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { LeafShower, SectionTitle } from "@/components/bits";
import { BracketView } from "@/components/bracket-view";
import { BattleCard } from "@/components/cards";
import { WingSpirit } from "@/components/wing-spirit";
import type { Match } from "@/lib/bracket";
import { timeAgo } from "@/lib/format";
import { getTournament } from "@/lib/queries";

export const metadata: Metadata = { title: "Tournament" };

export default async function TournamentResultPage({ params, searchParams }: PageProps<"/tournaments/[id]">) {
  await connection();
  const { id } = await params;
  const { fresh } = await searchParams;
  const data = await getTournament(id);
  if (!data) notFound();
  const { tournament, userName, matches } = data;
  const now = new Date();

  const names = new Map<string, { id: string; name: string; spotName: string; heat: number; style: "bone-in" | "boneless" }>();
  for (const m of matches) {
    names.set(m.a.id, m.a);
    names.set(m.b.id, m.b);
  }
  // Reconstruct each match's slot index within its round from play order.
  const perRound = new Map<number, number>();
  const bracket: Match[] = matches.map((m) => {
    const round = m.round ?? 1;
    const index = perRound.get(round) ?? 0;
    perRound.set(round, index + 1);
    return { round, index, a: m.a.id, b: m.b.id, winner: m.winnerId };
  });
  const champ = tournament.championId ? names.get(tournament.championId) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {fresh && <LeafShower />}
      <section className="card p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-sauce">🏯 Tournament · {tournament.size} wings</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{tournament.name}</h1>
        <p className="mt-2 text-ink-soft">
          Hosted by <Link className="link" href={`/judges/${tournament.userId}`}>{userName}</Link> · {timeAgo(tournament.createdAt, now)}
        </p>
        {champ && (
          <div className="mt-6 flex flex-col items-center">
            <div className="animate-bob">
              <WingSpirit seed={champ.id} heat={champ.heat} style={champ.style} size={160} crowned />
            </div>
            <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-sauce">👑 Champion</p>
            <Link href={`/wings/${champ.id}`} className="link font-display text-3xl font-semibold">{champ.name}</Link>
            <p className="text-ink-soft">{champ.spotName}</p>
          </div>
        )}
      </section>

      <section className="card mt-8 p-6">
        <h2 className="mb-4 text-xl font-semibold">The bracket</h2>
        <BracketView size={tournament.size} matches={bracket} wings={names} />
      </section>

      <section className="mt-10">
        <SectionTitle>Every match</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {matches.map((m) => (
            <BattleCard key={m.id} battle={m} now={now} />
          ))}
        </div>
      </section>
    </div>
  );
}
