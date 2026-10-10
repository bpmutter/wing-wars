import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState, HeatPips, LeafShower, RankBadge, SectionTitle, StatPill, TypeChip } from "@/components/bits";
import { Radar } from "@/components/radar";
import { WingSpirit } from "@/components/wing-spirit";
import { timeAgo } from "@/lib/format";
import { getWing, wingTypeOptions } from "@/lib/queries";
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
  const { wing, spot, type, tastings, averages, place, typePlace, avgTotal } = data;
  const now = new Date();
  const rank = avgTotal !== null ? rankFor(avgTotal) : null;
  const nextRank = avgTotal !== null ? nextRankFor(avgTotal) : null;
  const warCount = new Set(tastings.filter((t) => t.tasting.warId).map((t) => t.tasting.warId)).size;
  const judgeCount = new Set(tastings.map((t) => t.tasting.userId)).size;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {(sp.added || sp.tasted) && <LeafShower count={8} />}
      <section className="card grid items-center gap-8 p-6 sm:p-10 md:grid-cols-[auto_1fr]">
        <div className="flex justify-center">
          <WingSpirit seed={wing.id} heat={wing.heat} style={wing.style} size={190} className="animate-bob" crowned={place === 1} title={wing.name} />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-sauce">
            {place ? <>#{place} in the land</> : "Not yet ranked"}
            {type && typePlace && <> · #{typePlace} {type.name}</>} · {wing.style}
          </p>
          <h1 className="mt-1 text-4xl font-semibold sm:text-5xl">{wing.name}</h1>
          <p className="mt-1 text-lg text-ink-soft">
            from <Link href={`/spots/${spot.id}`} className="link">{spot.name}</Link>
            {spot.neighborhood && <> · {spot.neighborhood}</>}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <RankBadge score={avgTotal} />
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
          {rank && (
            <p className="mt-3 text-sm italic text-ink-soft">
              “{rank.blurb}”{nextRank && avgTotal !== null && <> — {(nextRank.min - avgTotal).toFixed(1)} points from {nextRank.title}.</>}
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill label="Avg score" value={avgTotal !== null ? `${avgTotal.toFixed(1)}/${MAX_TOTAL}` : "—"} />
            <StatPill label="Scorecards" value={tastings.length} />
            <StatPill label="Judges" value={judgeCount} />
            <StatPill label="Wars fought" value={warCount} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="#taste" className="btn btn-primary">📓 Review this wing</a>
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
            <SectionTitle>Review this wing</SectionTitle>
            <p className="-mt-2 mb-4 text-sm text-ink-soft">A solo review, outside any war. It counts toward this wing&apos;s average and the Hall of Fame.</p>
            <div className="card p-6">
              <Suspense fallback={<div className="h-64 animate-pulse" />}>
                <TastingGate wingId={wing.id} wingName={wing.name} />
              </Suspense>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle>Scorecards</SectionTitle>
          {tastings.length === 0 ? (
            <EmptyState title="Untasted" action={{ href: "/wars", label: "Bring it into a war" }}>
              Nobody has scored this wing yet. Review it below, or add its spot to a war.
            </EmptyState>
          ) : (
            <ul className="grid gap-3">
              {tastings.slice(0, 20).map(({ tasting, userName, warName }) => (
                <li key={tasting.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/judges/${tasting.userId}`} className="link font-bold">
                        {userName}
                      </Link>
                      <div className="text-xs text-ink-soft">
                        {warName && tasting.warId ? (
                          <>
                            in{" "}
                            <Link href={`/wars/${tasting.warId}`} className="link">
                              {warName}
                            </Link>{" "}
                            ·{" "}
                          </>
                        ) : (
                          "solo review · "
                        )}
                        {timeAgo(tasting.createdAt, now)}
                      </div>
                    </div>
                    <div className="shrink-0 font-display text-xl font-semibold tabular-nums">
                      {total(tasting)}
                      <span className="text-xs text-ink-soft">/{MAX_TOTAL}</span>
                    </div>
                  </div>
                  {tasting.notes && <p className="mt-2 italic">“{tasting.notes}”</p>}
                </li>
              ))}
            </ul>
          )}
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
