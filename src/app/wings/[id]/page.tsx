import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState, HeatPips, LeafShower, RankBadge, SectionTitle, StatPill, TypeChip } from "@/components/bits";
import { BattleCard } from "@/components/cards";
import { Radar } from "@/components/radar";
import { WingSpirit } from "@/components/wing-spirit";
import { timeAgo, winRate } from "@/lib/format";
import { getWing, recentBattles, wingTypeOptions } from "@/lib/queries";
import { nextRank as nextRankFor, rankFor } from "@/lib/ranks";
import { ELEMENTS, MAX_TOTAL, total } from "@/lib/scoring";
import { getCurrentUser } from "@/lib/session";
import { AssignTypeForm } from "./assign-type-form";
import { TastingForm } from "./tasting-form";

export const metadata: Metadata = { title: "Wing" };

export default async function WingPage({ params, searchParams }: PageProps<"/wings/[id]">) {
  await connection();
  const { id } = await params;
  const sp = await searchParams;
  const data = await getWing(id);
  if (!data) notFound();
  const { wing, spot, type, tastings, averages, place, typePlace } = data;
  const battles = await recentBattles({ wingId: id, limit: 10 });
  const now = new Date();
  const rank = rankFor(wing.elo);
  const nextRank = nextRankFor(wing.elo);
  const rate = winRate(wing.wins, wing.losses);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {(sp.added || sp.tasted) && <LeafShower count={8} />}
      <section className="card grid items-center gap-8 p-6 sm:p-10 md:grid-cols-[auto_1fr]">
        <div className="flex justify-center">
          <WingSpirit seed={wing.id} heat={wing.heat} style={wing.style} size={190} className="animate-bob" crowned={place === 1} title={wing.name} />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-sauce">
            #{place} in the land{type && typePlace && <> · #{typePlace} {type.name}</>} · {wing.style}
          </p>
          <h1 className="mt-1 text-4xl font-semibold sm:text-5xl">{wing.name}</h1>
          <p className="mt-1 text-lg text-ink-soft">
            from <Link href={`/spots/${spot.id}`} className="link">{spot.name}</Link>
            {spot.neighborhood && <> · {spot.neighborhood}</>}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <RankBadge elo={wing.elo} />
            {type ? (
              <Link href={`/types/${type.id}`}>
                <TypeChip type={{ typeId: type.id, typeName: type.name, typeEmoji: type.emoji }} />
              </Link>
            ) : (
              <TypeChip type={{ typeId: null, typeName: null }} />
            )}
            <HeatPips heat={wing.heat} />
          </div>
          {!type && (
            <Suspense>
              <AssignTypeGate wingId={wing.id} />
            </Suspense>
          )}
          {wing.description && <p className="mt-4 max-w-xl">{wing.description}</p>}
          <p className="mt-3 text-sm italic text-ink-soft">
            “{rank.blurb}”{nextRank && <> — {nextRank.min - wing.elo} points from {nextRank.title}.</>}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill label="Rating" value={wing.elo} />
            <StatPill label="Record" value={`${wing.wins}–${wing.losses}`} />
            <StatPill label="Win rate" value={rate === null ? "—" : `${rate}%`} />
            <StatPill label="Avg score" value={averages ? `${total(averages).toFixed(1)}` : "—"} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/battle?a=${wing.id}`} className="btn btn-primary">
              ⚔️ Challenge this wing
            </Link>
            <a href="#taste" className="btn btn-secondary">📓 Log a tasting</a>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <SectionTitle>Flavor profile</SectionTitle>
          {averages ? (
            <div className="card flex flex-col items-center p-6">
              <Radar series={[{ scores: averages, color: "var(--sauce)", label: wing.name }]} size={280} />
              <div className="mt-2 grid w-full grid-cols-5 gap-1 text-center text-sm">
                {ELEMENTS.map((e) => (
                  <div key={e.key}>
                    <div className="text-ink-soft">{e.label}</div>
                    <div className="font-display text-lg font-semibold">{averages[e.key].toFixed(1)}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink-soft">
                Averaged over {tastings.length} scorecard{tastings.length === 1 ? "" : "s"} · {total(averages).toFixed(1)}/{MAX_TOTAL}
              </p>
            </div>
          ) : (
            <EmptyState title="No scorecards yet">Battle this wing or log a tasting to reveal its flavor profile.</EmptyState>
          )}

          <div id="taste" className="mt-10 scroll-mt-24">
            <SectionTitle>Log a tasting</SectionTitle>
            <div className="card p-6">
              <Suspense fallback={<div className="h-64 animate-pulse" />}>
                <TastingGate wingId={wing.id} wingName={wing.name} />
              </Suspense>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle>Battle history</SectionTitle>
          {battles.length === 0 ? (
            <EmptyState title="Untested in battle" action={{ href: `/battle?a=${wing.id}`, label: "Send it to battle" }} />
          ) : (
            <div className="grid gap-3">
              {battles.map((b) => (
                <BattleCard key={b.id} battle={b} now={now} />
              ))}
            </div>
          )}

          <div className="mt-10">
            <SectionTitle>Tasting notes</SectionTitle>
            {tastings.filter((t) => t.tasting.notes).length === 0 ? (
              <p className="text-ink-soft">No notes yet — the journal pages are blank.</p>
            ) : (
              <ul className="grid gap-3">
                {tastings
                  .filter((t) => t.tasting.notes)
                  .slice(0, 12)
                  .map(({ tasting, userName }) => (
                    <li key={tasting.id} className="card p-4">
                      <p className="italic">“{tasting.notes}”</p>
                      <p className="mt-2 text-xs text-ink-soft">
                        <Link href={`/judges/${tasting.userId}`} className="link">{userName}</Link> · {total(tasting)}/{MAX_TOTAL} ·{" "}
                        {timeAgo(tasting.createdAt, now)}
                      </p>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

async function TastingGate({ wingId, wingName }: { wingId: string; wingName: string }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <p className="text-center text-ink-soft">
        <Link className="link font-bold text-ink" href={`/sign-in?next=/wings/${wingId}`}>Sign in</Link> to add your scorecard.
      </p>
    );
  }
  return <TastingForm wingId={wingId} wingName={wingName} />;
}

async function AssignTypeGate({ wingId }: { wingId: string }) {
  const user = await getCurrentUser();
  if (!user) return null;
  return <AssignTypeForm wingId={wingId} types={await wingTypeOptions()} />;
}
