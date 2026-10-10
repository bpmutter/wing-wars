import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { joinWar } from "@/app/actions";
import { EmptyState, LeafShower, SectionTitle, StatPill, WarStatus } from "@/components/bits";
import { SubmitButton } from "@/components/form-bits";
import { SpotSpirit } from "@/components/spot-spirit";
import { getBattleground, wingTypeOptions } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { ReviewForm } from "@/app/spots/[id]/review-form";
import { WingForm } from "@/app/spots/[id]/wing-form";
import { WingScorecard } from "./wing-scorecard";

export const metadata: Metadata = { title: "Battleground" };

export default async function BattlegroundPage({ params, searchParams }: PageProps<"/wars/[id]/spots/[spotId]">) {
  await connection();
  const { id, spotId } = await params;
  const sp = await searchParams;
  const viewer = await getCurrentUser();
  const data = await getBattleground(id, spotId, viewer?.id ?? null);
  if (!data) notFound();
  const { war, spot, ended, visible, isMember, wings } = data;
  const now = new Date();
  const canScore = isMember && !ended;
  const scoredIds = new Set(data.myCards.map((c) => c.wingId));
  const types = canScore ? await wingTypeOptions() : [];
  const justSaved = typeof sp.saved === "string" || typeof sp.reviewed === "string" || typeof sp.added === "string";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {justSaved && <LeafShower count={6} />}
      <nav className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link href={`/wars/${war.id}`} className="link">
          ← {war.name}
        </Link>
        <span className="flex gap-3">
          {data.prev && (
            <Link className="link" href={`/wars/${war.id}/spots/${data.prev.spotId}`}>
              ← {data.prev.name}
            </Link>
          )}
          {data.next && (
            <Link className="link" href={`/wars/${war.id}/spots/${data.next.spotId}`}>
              {data.next.name} →
            </Link>
          )}
        </span>
      </nav>

      <header className="card grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[auto_1fr]">
        <div className="flex justify-center">
          <SpotSpirit seed={spot.id} size={150} className="animate-bob" crowned={data.standing?.place === 1} />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-sauce">
            ⚔️ Battle {data.index + 1} of {data.total} · {war.name}
          </p>
          <h1 className="mt-1 text-4xl font-semibold sm:text-5xl">{spot.name}</h1>
          {spot.neighborhood && <p className="mt-1 text-lg text-ink-soft">{spot.neighborhood}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <WarStatus ended={ended} endsAt={war.endsAt} now={now} />
            {data.type && (
              <span className="chip">
                {data.type.emoji} {data.type.name} only
              </span>
            )}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <StatPill label="Judges here" value={`${data.judges}/${data.memberCount}`} />
            <StatPill label="You scored" value={`${scoredIds.size}/${wings.length}`} />
            <StatPill label="Standing" value={data.standing?.place ? `#${data.standing.place}` : visible ? "—" : "🌫️"} />
          </div>
          <p className="mt-4 text-sm">
            <Link className="link" href={`/spots/${spot.id}`}>
              About this spot
            </Link>
          </p>
        </div>
      </header>

      {!isMember && !ended && (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
          <p>You&apos;re watching from the hills. Join the war to file scorecards.</p>
          {viewer ? (
            <form action={joinWar.bind(null, war.id)}>
              <SubmitButton pendingText="Enlisting…">⚔️ Join this war</SubmitButton>
            </form>
          ) : (
            <Link href={`/sign-in?next=/wars/${war.id}/spots/${spot.id}`} className="btn btn-primary">
              Sign in to join
            </Link>
          )}
        </div>
      )}
      {ended && <p className="card mt-6 p-5 text-center">🏁 This war is over — the scorecards are sealed.</p>}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <SectionTitle>{data.type ? `The ${data.type.name} wings here` : "The wings here"}</SectionTitle>
          <p className="-mt-2 mb-4 text-sm text-ink-soft">
            Score every wing you eat. Your scorecards here are averaged into this battleground&apos;s score.
            {data.otherWingCount > 0 && ` (${data.otherWingCount} other wing${data.otherWingCount === 1 ? "" : "s"} here don't count in this war.)`}
          </p>
          {wings.length === 0 ? (
            <EmptyState title="No contenders yet">
              {data.type ? `Nobody's added this spot's ${data.type.name} wings yet.` : "Nobody's added this spot's wings yet."} Add the ones you ate below.
            </EmptyState>
          ) : (
            <div className="grid gap-4">
              {wings.map((w, i) => {
                const mine = data.myCards.find((c) => c.wingId === w.id) ?? null;
                return (
                  <WingScorecard
                    key={w.id}
                    warId={war.id}
                    wing={w}
                    mine={mine}
                    canScore={canScore}
                    openByDefault={sp.wing === w.id || (!mine && scoredIds.size === 0 && i === 0)}
                    warAverage={data.wingAverages?.get(w.id) ?? null}
                  />
                );
              })}
            </div>
          )}
          {canScore && (
            <details className="card mt-4 p-5" open={wings.length === 0}>
              <summary className="cursor-pointer font-bold">➕ Ate a wing that isn&apos;t listed?</summary>
              <div className="mt-4">
                <WingForm spotId={spot.id} types={types} warId={war.id} fixedType={data.type} />
              </div>
            </details>
          )}
        </section>

        <aside id="review" className="scroll-mt-24">
          <SectionTitle>The restaurant itself</SectionTitle>
          <p className="-mt-2 mb-4 text-sm text-ink-soft">
            Optional. Rate the whole visit: dips, vibe, service. It doesn&apos;t decide the war, but it crowns the war&apos;s
            Best Hangout.
          </p>
          <div className="card p-6">
            {canScore ? (
              <ReviewForm spotId={spot.id} spotName={spot.name} warId={war.id} initial={data.myReview} />
            ) : data.myReview ? (
              <p className="text-sm">You reviewed this spot during the war.</p>
            ) : (
              <p className="text-sm text-ink-soft">Members can review the restaurant here while the war rages.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
