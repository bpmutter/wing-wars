import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { EmptyState, PageHeader, SectionTitle, Tabs } from "@/components/bits";
import { SpotCard, WingCard } from "@/components/cards";
import { SpotSpirit } from "@/components/spot-spirit";
import { WingSpirit } from "@/components/wing-spirit";
import { winRate } from "@/lib/format";
import { listSpots, listWings, listWingTypes, topJudges } from "@/lib/queries";
import { ranksFor, type RankKind } from "@/lib/ranks";

export const metadata: Metadata = { title: "Leaderboard" };

type Board = "wings" | "spots" | "types";

export default async function LeaderboardPage({ searchParams }: PageProps<"/leaderboard">) {
  await connection();
  const { board: raw } = await searchParams;
  const board: Board = raw === "spots" || raw === "types" ? raw : "wings";
  const judges = await topJudges(5);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow="🏆 The great hill" title="Leaderboard">
        Ranked by Elo. Beat a stronger rival and you&apos;ll climb fast; lose to an underdog and you&apos;ll tumble.
      </PageHeader>
      <Tabs
        active={board}
        tabs={[
          { key: "wings", label: "🍗 Wings", href: "/leaderboard" },
          { key: "spots", label: "🏮 Spots", href: "/leaderboard?board=spots" },
          { key: "types", label: "🍃 Wing types", href: "/leaderboard?board=types" },
        ]}
      />
      {board === "wings" && <WingBoard judges={judges} />}
      {board === "spots" && <SpotBoard judges={judges} />}
      {board === "types" && <TypeBoard />}
    </div>
  );
}

type Judges = Awaited<ReturnType<typeof topJudges>>;

async function WingBoard({ judges }: { judges: Judges }) {
  const wings = await listWings();
  if (wings.length === 0) return <EmptyState title="No wings ranked yet" action={{ href: "/battle", label: "Start a battle" }} />;
  return (
    <>
      <Podium
        items={wings.slice(0, 3).map((w) => ({
          id: w.id,
          href: `/wings/${w.id}`,
          name: w.name,
          sub: w.spotName,
          elo: w.elo,
          avatar: (size, crowned) => <WingSpirit seed={w.id} heat={w.heat} style={w.style} size={size} crowned={crowned} className="animate-bob" />,
        }))}
      />
      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_18rem]">
        <section>
          <SectionTitle>The rest of the field</SectionTitle>
          {wings.length <= 3 ? (
            <p className="text-ink-soft">Only three contenders so far!</p>
          ) : (
            <div className="grid gap-3">
              {wings.slice(3).map((w, i) => (
                <WingCard key={w.id} wing={w} place={i + 4} />
              ))}
            </div>
          )}
        </section>
        <Sidebar kind="wing" judges={judges} />
      </div>
    </>
  );
}

async function SpotBoard({ judges }: { judges: Judges }) {
  const spots = await listSpots();
  if (spots.length === 0) return <EmptyState title="No spots ranked yet" action={{ href: "/spots/new", label: "Add a spot" }} />;
  return (
    <>
      <Podium
        items={spots.slice(0, 3).map((s) => ({
          id: s.id,
          href: `/spots/${s.id}`,
          name: s.name,
          sub: s.neighborhood,
          elo: s.elo,
          avatar: (size, crowned) => <SpotSpirit seed={s.id} size={size} crowned={crowned} className="animate-bob" />,
        }))}
      />
      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_18rem]">
        <section>
          <SectionTitle>The rest of the villages</SectionTitle>
          {spots.length <= 3 ? (
            <p className="text-ink-soft">Only three spots so far!</p>
          ) : (
            <div className="grid gap-3">
              {spots.slice(3).map((s, i) => (
                <SpotCard key={s.id} spot={s} place={i + 4} />
              ))}
            </div>
          )}
        </section>
        <Sidebar kind="spot" judges={judges} />
      </div>
    </>
  );
}

async function TypeBoard() {
  const types = (await listWingTypes()).filter((t) => t.wingCount > 0);
  if (types.length === 0) return <EmptyState title="No wing types in play yet" />;
  return (
    <section>
      <p className="mb-4 text-ink-soft">
        Wing types are ranked by their record in battles <i>against other types</i>. Buffalo-vs-Buffalo battles
        crown the best Buffalo, but don&apos;t count here.
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">Type</th>
              <th className="p-4">vs other types</th>
              <th className="p-4">Avg rating</th>
              <th className="p-4">Best in type</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t, i) => {
              const rate = winRate(t.wins, t.losses);
              return (
                <tr key={t.id} className="border-b border-line/60 last:border-0">
                  <td className="p-4 font-display text-xl font-semibold text-ink-soft">{i + 1}</td>
                  <td className="p-4">
                    <Link href={`/types/${t.id}`} className="link font-bold">
                      {t.emoji} {t.name}
                    </Link>
                    <div className="text-xs text-ink-soft">
                      {t.wingCount} wing{t.wingCount === 1 ? "" : "s"}
                    </div>
                  </td>
                  <td className="p-4 tabular-nums">
                    {t.wins}W–{t.losses}L {rate !== null && <span className="text-ink-soft">({rate}%)</span>}
                  </td>
                  <td className="p-4 tabular-nums">{t.avgElo != null ? Math.round(Number(t.avgElo)) : "—"}</td>
                  <td className="p-4">
                    {t.top && (
                      <Link href={`/wings/${t.top.id}`} className="link">
                        {t.top.name} <span className="text-ink-soft">· {t.top.spotName}</span>
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Sidebar({ kind, judges }: { kind: RankKind; judges: Judges }) {
  return (
    <aside className="grid content-start gap-8">
      <div className="card p-5">
        <h3 className="mb-3 text-lg font-semibold">{kind === "spot" ? "Spot ranks" : "Wing ranks"}</h3>
        <ol className="grid gap-2 text-sm">
          {[...ranksFor(kind)].reverse().map((r) => (
            <li key={r.title}>
              <div className="flex justify-between font-bold">
                <span>
                  {kind === "spot" ? "🏮" : "✦"} {r.title}
                </span>
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
  );
}

type PodiumItem = { id: string; href: string; name: string; sub: string; elo: number; avatar: (size: number, crowned: boolean) => ReactNode };

function Podium({ items }: { items: PodiumItem[] }) {
  // Display order: 2nd, 1st, 3rd — each standing on its own little hill.
  const slots = [
    { it: items[1], place: 2, h: 110 },
    { it: items[0], place: 1, h: 150 },
    { it: items[2], place: 3, h: 88 },
  ];
  return (
    <div className="card relative overflow-hidden px-2 pt-8">
      <div className="absolute inset-0 bg-gradient-to-b from-sky-1/60 to-sky-2/30" aria-hidden />
      <div className="relative grid grid-cols-3 items-end gap-2">
        {slots.map(({ it, place, h }) =>
          it ? (
            <Link key={it.id} href={it.href} className="group flex flex-col items-center text-center">
              {it.avatar(place === 1 ? 130 : 100, place === 1)}
              <div className="mt-1 max-w-full truncate px-1 font-display text-base font-semibold group-hover:underline sm:text-xl">{it.name}</div>
              <div className="max-w-full truncate px-1 text-xs text-ink-soft sm:text-sm">{it.sub || " "}</div>
              <div
                className="mt-2 flex w-full flex-col items-center justify-start rounded-t-[50%_40px] bg-gradient-to-b from-meadow to-moss pt-4 text-[#fffaf0]"
                style={{ height: h }}
              >
                <span className="font-display text-3xl font-bold">{place}</span>
                <span className="text-sm font-bold tabular-nums">{it.elo}</span>
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
