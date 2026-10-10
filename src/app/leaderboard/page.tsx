import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState, PageHeader, SectionTitle } from "@/components/bits";
import { WingCard } from "@/components/cards";
import { WingSpirit } from "@/components/wing-spirit";
import { listWings, topJudges, type WingListItem } from "@/lib/queries";
import { RANKS } from "@/lib/ranks";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  await connection();
  const [wings, judges] = await Promise.all([listWings(), topJudges(5)]);
  const podium = wings.slice(0, 3);
  const rest = wings.slice(3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow="🏆 The great hill" title="Leaderboard">
        Ranked by Elo. Beat a stronger wing and you&apos;ll climb fast; lose to an underdog and you&apos;ll tumble.
      </PageHeader>

      {wings.length === 0 ? (
        <EmptyState title="No wings ranked yet" action={{ href: "/battle", label: "Start a battle" }} />
      ) : (
        <>
          <Podium wings={podium} />
          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_18rem]">
            <section>
              <SectionTitle>The rest of the field</SectionTitle>
              {rest.length === 0 ? (
                <p className="text-ink-soft">Only three contenders so far!</p>
              ) : (
                <div className="grid gap-3">
                  {rest.map((w, i) => (
                    <WingCard key={w.id} wing={w} place={i + 4} />
                  ))}
                </div>
              )}
            </section>
            <aside className="grid content-start gap-8">
              <div className="card p-5">
                <h3 className="mb-3 text-lg font-semibold">The ranks</h3>
                <ol className="grid gap-2 text-sm">
                  {[...RANKS].reverse().map((r) => (
                    <li key={r.title}>
                      <div className="flex justify-between font-bold">
                        <span>✦ {r.title}</span>
                        <span className="tabular-nums text-ink-soft">{Number.isFinite(r.min) ? `${r.min}+` : "<1100"}</span>
                      </div>
                      <div className="text-xs text-ink-soft">{r.blurb}</div>
                    </li>
                  ))}
                </ol>
              </div>
              {judges.length > 0 && (
                <div className="card p-5">
                  <h3 className="mb-3 text-lg font-semibold">Most devoted judges</h3>
                  <ol className="grid gap-2 text-sm">
                    {judges.map((j, i) => (
                      <li key={j.id} className="flex justify-between">
                        <Link href={`/judges/${j.id}`} className="link">
                          {["🥇", "🥈", "🥉"][i] ?? "🍃"} {j.name}
                        </Link>
                        <span className="tabular-nums text-ink-soft">{j.battles} battles</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function Podium({ wings }: { wings: WingListItem[] }) {
  // Display order: 2nd, 1st, 3rd — each standing on its own little hill.
  const slots = [
    { w: wings[1], place: 2, h: 110 },
    { w: wings[0], place: 1, h: 150 },
    { w: wings[2], place: 3, h: 88 },
  ];
  return (
    <div className="card relative overflow-hidden px-2 pt-8">
      <div className="absolute inset-0 bg-gradient-to-b from-sky-1/60 to-sky-2/30" aria-hidden />
      <div className="relative grid grid-cols-3 items-end gap-2">
        {slots.map(({ w, place, h }) =>
          w ? (
            <Link key={w.id} href={`/wings/${w.id}`} className="group flex flex-col items-center text-center">
              <WingSpirit seed={w.id} heat={w.heat} style={w.style} size={place === 1 ? 130 : 100} crowned={place === 1} className="animate-bob" />
              <div className="mt-1 max-w-full truncate px-1 font-display text-base font-semibold group-hover:underline sm:text-xl">{w.name}</div>
              <div className="max-w-full truncate px-1 text-xs text-ink-soft sm:text-sm">{w.spotName}</div>
              <div
                className="mt-2 flex w-full flex-col items-center justify-start rounded-t-[50%_40px] bg-gradient-to-b from-meadow to-moss pt-4 text-[#fffaf0]"
                style={{ height: h }}
              >
                <span className="font-display text-3xl font-bold">{place}</span>
                <span className="text-sm font-bold tabular-nums">{w.elo}</span>
              </div>
            </Link>
          ) : (
            <div key={place} />
          ),
        )}
      </div>
    </div>
  );
}
