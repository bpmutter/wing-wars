import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState, LeafShower, RankBadge, SectionTitle, StatPill } from "@/components/bits";
import { WingCard } from "@/components/cards";
import { Radar } from "@/components/radar";
import { SpotSpirit } from "@/components/spot-spirit";
import { timeAgo } from "@/lib/format";
import { getSpot, wingTypeOptions } from "@/lib/queries";
import { nextRank, rankFor } from "@/lib/ranks";
import { MAX_SPOT_TOTAL, MAX_TOTAL, SPOT_ELEMENTS, spotTotal } from "@/lib/scoring";
import { getCurrentUser } from "@/lib/session";
import { ReviewForm } from "./review-form";
import { WingForm } from "./wing-form";

export const metadata: Metadata = { title: "Spot" };

export default async function SpotPage({ params, searchParams }: PageProps<"/spots/[id]">) {
  await connection();
  const { id } = await params;
  const { added, reviewed } = await searchParams;
  const data = await getSpot(id);
  if (!data) notFound();
  const { spot, wings, reviews, averages, place, avgReview, avgWing, warsWon } = data;
  const now = new Date();
  const rank = avgReview !== null ? rankFor(avgReview, "spot") : null;
  const next = avgReview !== null ? nextRank(avgReview, "spot") : null;
  const bestWing = wings.find((w) => w.score !== null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {(added || reviewed) && <LeafShower count={8} />}
      <header className="card mb-10 grid items-center gap-8 p-6 sm:p-10 md:grid-cols-[auto_1fr]">
        <div className="flex justify-center">
          <SpotSpirit seed={spot.id} size={180} className="animate-bob" crowned={warsWon > 0} title={spot.name} />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-sauce">🏮 {place ? `#${place} spot in the land` : "Wing spot"}</p>
          <h1 className="mt-1 text-4xl font-semibold sm:text-5xl">{spot.name}</h1>
          {spot.neighborhood && <p className="mt-1 text-lg text-ink-soft">{spot.neighborhood}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <RankBadge score={avgReview} kind="spot" />
            {warsWon > 0 && (
              <span className="chip bg-honey/25! border-honey/60! text-ink!">
                👑 Won {warsWon} war{warsWon === 1 ? "" : "s"}
              </span>
            )}
          </div>
          {spot.description && <p className="mt-4 max-w-2xl">{spot.description}</p>}
          {rank && (
            <p className="mt-3 text-sm italic text-ink-soft">
              “{rank.blurb}”{next && avgReview !== null && <> — {(next.min - avgReview).toFixed(1)} points from {next.title}.</>}
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill label="Avg review" value={avgReview !== null ? `${avgReview.toFixed(1)}/${MAX_SPOT_TOTAL}` : "—"} />
            <StatPill label="Wings avg" value={avgWing !== null ? `${avgWing.toFixed(1)}/${MAX_TOTAL}` : "—"} />
            <StatPill label="Wars fought" value={data.wars.length} />
            <StatPill label="Wars won" value={warsWon} />
          </div>
          {added && <p className="mt-4 rounded-xl bg-meadow/20 p-3 font-bold text-forest">🌱 Spot added! Now add the wings they serve.</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="#review" className="btn btn-primary">🏮 Review it</a>
            <a href="#add-wing" className="btn btn-secondary">🍗 Add a wing</a>
          </div>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div className="grid content-start gap-10">
          <section>
            <SectionTitle>Their wings</SectionTitle>
            {wings.length === 0 ? (
              <EmptyState title="No wings yet">Add the first wing from this spot using the form.</EmptyState>
            ) : (
              <>
                {bestWing && (
                  <p className="mb-3 text-sm text-ink-soft">
                    Signature wing: <Link className="link font-bold text-ink" href={`/wings/${bestWing.id}`}>{bestWing.name}</Link> ({bestWing.avgTotal!.toFixed(1)}/{MAX_TOTAL})
                  </p>
                )}
                <div className="grid gap-3">
                  {wings.map((w) => (
                    <WingCard key={w.id} wing={w} />
                  ))}
                </div>
              </>
            )}
          </section>

          <section>
            <SectionTitle>Wars</SectionTitle>
            {data.wars.length === 0 ? (
              <EmptyState title="Untested in war" action={{ href: "/wars/new", label: "Start a war" }}>
                This spot hasn&apos;t been a battleground yet.
              </EmptyState>
            ) : (
              <ul className="grid gap-3">
                {data.wars.map((w) => (
                  <li key={w.id}>
                    <Link href={`/wars/${w.id}/spots/${spot.id}`} className="card flex items-center justify-between gap-3 p-4 transition hover:-translate-y-0.5">
                      <div className="min-w-0">
                        <div className="truncate font-bold">🏯 {w.name}</div>
                        <div className="text-xs text-ink-soft">
                          {w.ended ? "Concluded" : "Raging"} · {w.battlegroundCount} battlegrounds · {w.memberCount} judges
                        </div>
                      </div>
                      <div className="shrink-0 text-right font-display text-xl font-semibold">
                        {w.champion?.spotId === spot.id ? "👑 Won" : w.place ? `#${w.place}` : w.visible ? "—" : "🌫️"}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <SectionTitle>Guestbook</SectionTitle>
            {reviews.filter((r) => r.review.notes).length === 0 ? (
              <p className="text-ink-soft">No reviews with notes yet.</p>
            ) : (
              <ul className="grid gap-3">
                {reviews
                  .filter((r) => r.review.notes)
                  .slice(0, 12)
                  .map(({ review, userName }) => (
                    <li key={review.id} className="card p-4">
                      <p className="italic">“{review.notes}”</p>
                      <p className="mt-2 text-xs text-ink-soft">
                        <Link href={`/judges/${review.userId}`} className="link">{userName}</Link> · {spotTotal(review)}/{MAX_SPOT_TOTAL} ·{" "}
                        {timeAgo(review.createdAt, now)}
                      </p>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="grid content-start gap-10">
          <section>
            <SectionTitle>The five virtues</SectionTitle>
            {averages ? (
              <div className="card flex flex-col items-center p-6">
                <Radar elements={SPOT_ELEMENTS} series={[{ scores: averages, color: "var(--moss)", label: spot.name }]} size={280} />
                <div className="mt-2 grid w-full grid-cols-5 gap-1 text-center text-xs">
                  {SPOT_ELEMENTS.map((e) => (
                    <div key={e.key}>
                      <div className="text-ink-soft">{e.label}</div>
                      <div className="font-display text-lg font-semibold">{averages[e.key].toFixed(1)}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-ink-soft">
                  Averaged over {reviews.length} review{reviews.length === 1 ? "" : "s"} · {spotTotal(averages).toFixed(1)}/{MAX_SPOT_TOTAL}
                </p>
              </div>
            ) : (
              <EmptyState title="No reviews yet">Review this spot or challenge it to a showdown.</EmptyState>
            )}
          </section>

          <section id="review" className="scroll-mt-24">
            <SectionTitle>Review this spot</SectionTitle>
            <div className="card p-6">
              <Suspense fallback={<div className="h-64 animate-pulse" />}>
                <Gate spotId={spot.id} what="review this spot">
                  <ReviewForm spotId={spot.id} spotName={spot.name} />
                </Gate>
              </Suspense>
            </div>
          </section>

          <section id="add-wing" className="scroll-mt-24">
            <SectionTitle>Add a wing</SectionTitle>
            <div className="card p-6">
              <Suspense fallback={<div className="h-64 animate-pulse" />}>
                <Gate spotId={spot.id} what="add wings">
                  <WingForm spotId={spot.id} types={await wingTypeOptions()} />
                </Gate>
              </Suspense>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

async function Gate({ spotId, what, children }: { spotId: string; what: string; children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <p className="text-center text-ink-soft">
        <Link className="link font-bold text-ink" href={`/sign-in?next=/spots/${spotId}`}>Sign in</Link> to {what}.
      </p>
    );
  }
  return <>{children}</>;
}
