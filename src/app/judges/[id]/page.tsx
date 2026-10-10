import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { EmptyState, SectionTitle, StatPill } from "@/components/bits";
import { BattleCard, SpotBattleCard } from "@/components/cards";
import { WingSpirit } from "@/components/wing-spirit";
import { timeAgo } from "@/lib/format";
import { getJudge } from "@/lib/queries";
import { MAX_SPOT_TOTAL, MAX_TOTAL, spotTotal, total } from "@/lib/scoring";

export const metadata: Metadata = { title: "Judge" };

function judgeTitle(battles: number) {
  if (battles >= 50) return "Elder of the Fryer";
  if (battles >= 20) return "Sauce Sage";
  if (battles >= 8) return "Wandering Critic";
  if (battles >= 1) return "Apprentice Taster";
  return "Curious Newcomer";
}

export default async function JudgePage({ params }: PageProps<"/judges/[id]">) {
  await connection();
  const { id } = await params;
  const data = await getJudge(id);
  if (!data) notFound();
  const { judge, tastings, reviews, battleCount, spotBattleCount, tastedWingCount, battles, spotBattles } = data;
  const now = new Date();
  const favorite = [...tastings].sort((a, b) => total(b.tasting) - total(a.tasting))[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="card mb-10 flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
        <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-meadow/30 font-display text-5xl font-bold text-forest">
          {judge.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-sauce">📓 {judgeTitle(battleCount + spotBattleCount)}</p>
          <h1 className="text-4xl font-semibold">{judge.name}</h1>
          <p className="text-ink-soft">Wandering the wing lands since {judge.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill label="Wing battles" value={battleCount} />
            <StatPill label="Spot showdowns" value={spotBattleCount} />
            <StatPill label="Wings tried" value={tastedWingCount} />
            <StatPill label="Spot reviews" value={reviews.length} />
          </div>
        </div>
      </header>

      {favorite && (
        <Link href={`/wings/${favorite.tasting.wingId}`} className="card mb-10 flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
          <WingSpirit seed={favorite.tasting.wingId} size={64} crowned />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-sauce">💛 Highest-scored wing</p>
            <p className="font-display text-xl font-semibold">{favorite.wingName}</p>
            <p className="text-sm text-ink-soft">
              {favorite.spotName} · {total(favorite.tasting)}/{MAX_TOTAL}
            </p>
          </div>
        </Link>
      )}

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <SectionTitle>Recent battles</SectionTitle>
          {battles.length + spotBattles.length === 0 ? (
            <EmptyState title="No battles judged yet" action={{ href: "/battle", label: "Judge one" }} />
          ) : (
            <div className="grid gap-3">
              {battles.map((b) => (
                <BattleCard key={b.id} battle={b} now={now} />
              ))}
              {spotBattles.map((b) => (
                <SpotBattleCard key={b.id} battle={b} now={now} />
              ))}
            </div>
          )}
          {reviews.length > 0 && (
            <div className="mt-10">
              <SectionTitle>Spot reviews</SectionTitle>
              <ul className="grid gap-2">
                {reviews.map(({ review, spotName }) => (
                  <li key={review.id}>
                    <Link href={`/spots/${review.spotId}`} className="card flex items-center justify-between gap-3 px-4 py-3 transition hover:-translate-y-0.5">
                      <div className="min-w-0">
                        <div className="truncate font-bold">🏮 {spotName}</div>
                        <div className="truncate text-xs text-ink-soft">
                          {timeAgo(review.createdAt, now)}
                          {review.notes && <> · “{review.notes}”</>}
                        </div>
                      </div>
                      <div className="shrink-0 font-display text-xl font-semibold tabular-nums">
                        {spotTotal(review)}
                        <span className="text-xs text-ink-soft">/{MAX_SPOT_TOTAL}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
        <section>
          <SectionTitle>Tasting journal</SectionTitle>
          {tastings.length === 0 ? (
            <p className="text-ink-soft">The journal is empty, its pages waiting.</p>
          ) : (
            <ul className="grid gap-2">
              {tastings.map(({ tasting, wingName, spotName }) => (
                <li key={tasting.id}>
                  <Link href={`/wings/${tasting.wingId}`} className="card flex items-center justify-between gap-3 px-4 py-3 transition hover:-translate-y-0.5">
                    <div className="min-w-0">
                      <div className="truncate font-bold">{wingName}</div>
                      <div className="truncate text-xs text-ink-soft">
                        {spotName} · {timeAgo(tasting.createdAt, now)}
                        {tasting.notes && <> · “{tasting.notes}”</>}
                      </div>
                    </div>
                    <div className="shrink-0 font-display text-xl font-semibold tabular-nums">
                      {total(tasting)}
                      <span className="text-xs text-ink-soft">/{MAX_TOTAL}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
