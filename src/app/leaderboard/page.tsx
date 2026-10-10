import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState, PageHeader, SectionTitle, Tabs } from "@/components/bits";
import { SpotCard, WarCard, WingCard } from "@/components/cards";
import { Podium } from "@/components/podium";
import { SpotSpirit } from "@/components/spot-spirit";
import { WingSpirit } from "@/components/wing-spirit";
import { listSpots, listWars, listWings, listWingTypes, topJudges } from "@/lib/queries";
import { ranksFor, type RankKind } from "@/lib/ranks";
import { MAX_TOTAL } from "@/lib/scoring";
import { PRIOR_WEIGHT } from "@/lib/war-results";

export const metadata: Metadata = { title: "Hall of Fame" };

type Board = "wings" | "spots" | "types" | "champions";
const BOARDS: Board[] = ["wings", "spots", "types", "champions"];

export default async function HallOfFamePage({ searchParams }: PageProps<"/leaderboard">) {
  await connection();
  const { board: raw } = await searchParams;
  const board: Board = BOARDS.find((b) => b === raw) ?? "wings";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow="🏆 The great hill" title="Hall of Fame">
        Every scorecard ever filed — in wars and out — adds up here. Rankings use averages adjusted for how many
        people have weighed in, so one rave review can&apos;t top the hill.
      </PageHeader>
      <Tabs
        active={board}
        tabs={[
          { key: "wings", label: "🍗 Wings", href: "/leaderboard" },
          { key: "spots", label: "🏮 Spots", href: "/leaderboard?board=spots" },
          { key: "types", label: "🍃 Wing types", href: "/leaderboard?board=types" },
          { key: "champions", label: "👑 War champions", href: "/leaderboard?board=champions" },
        ]}
      />
      {board === "wings" && <WingBoard />}
      {board === "spots" && <SpotBoard />}
      {board === "types" && <TypeBoard />}
      {board === "champions" && <ChampionBoard />}
    </div>
  );
}

async function WingBoard() {
  const [wings, judges] = await Promise.all([listWings(), topJudges(5)]);
  const ranked = wings.filter((w) => w.score !== null);
  if (ranked.length === 0) return <EmptyState title="No wings have been tasted yet" action={{ href: "/wars", label: "Join a war" }} />;
  return (
    <>
      <Podium
        items={ranked.slice(0, 3).map((w) => ({
          id: w.id,
          href: `/wings/${w.id}`,
          name: w.name,
          sub: w.spotName,
          value: `${w.avgTotal!.toFixed(1)}/${MAX_TOTAL}`,
          avatar: (size, crowned) => <WingSpirit seed={w.id} heat={w.heat} style={w.style} size={size} crowned={crowned} className="animate-bob" />,
        }))}
      />
      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_18rem]">
        <section>
          <SectionTitle>The rest of the field</SectionTitle>
          <div className="grid gap-3">
            {ranked.slice(3).map((w, i) => (
              <WingCard key={w.id} wing={w} place={i + 4} />
            ))}
          </div>
          {wings.length > ranked.length && (
            <p className="mt-4 text-sm text-ink-soft">
              {wings.length - ranked.length} wing{wings.length - ranked.length === 1 ? " hasn't" : "s haven't"} been tasted yet.{" "}
              <Link href="/wings?sort=new" className="link">
                See them all
              </Link>
            </p>
          )}
        </section>
        <aside className="grid content-start gap-8">
          <RankLadder kind="wing" />
          {judges.length > 0 && (
            <div className="card p-5">
              <h3 className="mb-3 text-lg font-semibold">Most devoted judges</h3>
              <ol className="grid gap-2 text-sm">
                {judges.map((j, i) => (
                  <li key={j.id} className="flex justify-between">
                    <Link href={`/judges/${j.id}`} className="link">
                      {["🥇", "🥈", "🥉"][i] ?? "🍃"} {j.name}
                    </Link>
                    <span className="tabular-nums text-ink-soft">{j.scorecards} scorecards</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

async function SpotBoard() {
  const spots = await listSpots();
  if (spots.length === 0) return <EmptyState title="No spots yet" action={{ href: "/spots/new", label: "Add a spot" }} />;
  return (
    <>
      <p className="mb-4 text-ink-soft">
        Spots are ranked by wars won first, then by their restaurant reviews (dips, vibe, service and all).
      </p>
      <Podium
        items={spots.slice(0, 3).map((s) => ({
          id: s.id,
          href: `/spots/${s.id}`,
          name: s.name,
          sub: s.neighborhood,
          value: s.warsWon ? `👑 ×${s.warsWon}` : s.avgReview !== null ? s.avgReview.toFixed(1) : "—",
          avatar: (size, crowned) => <SpotSpirit seed={s.id} size={size} crowned={crowned} className="animate-bob" />,
        }))}
      />
      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_18rem]">
        <section>
          <SectionTitle>The rest of the villages</SectionTitle>
          <div className="grid gap-3">
            {spots.slice(3).map((s, i) => (
              <SpotCard key={s.id} spot={s} place={i + 4} />
            ))}
          </div>
        </section>
        <aside>
          <RankLadder kind="spot" />
        </aside>
      </div>
    </>
  );
}

async function TypeBoard() {
  const types = (await listWingTypes()).filter((t) => t.wingCount > 0);
  if (types.length === 0) return <EmptyState title="No wing types in play yet" />;
  return (
    <section>
      <p className="mb-4 text-ink-soft">The eternal question — Buffalo or Lemon Pepper? — settled by the average of every scorecard.</p>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-ink-soft">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">Type</th>
              <th className="p-4">Avg score</th>
              <th className="p-4">Scorecards</th>
              <th className="p-4">Best in type</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t, i) => (
              <tr key={t.id} className="border-b border-line/60 last:border-0">
                <td className="p-4 font-display text-xl font-semibold text-ink-soft">{t.avgTotal !== null ? i + 1 : "—"}</td>
                <td className="p-4">
                  <Link href={`/types/${t.id}`} className="link font-bold">
                    {t.emoji} {t.name}
                  </Link>
                  <div className="text-xs text-ink-soft">
                    {t.wingCount} wing{t.wingCount === 1 ? "" : "s"} at {t.spotCount} spot{t.spotCount === 1 ? "" : "s"}
                  </div>
                </td>
                <td className="p-4 font-bold tabular-nums">{t.avgTotal?.toFixed(1) ?? "—"}</td>
                <td className="p-4 tabular-nums">{t.tastingCount}</td>
                <td className="p-4">
                  {t.top && (
                    <Link href={`/wings/${t.top.id}`} className="link">
                      {t.top.name} <span className="text-ink-soft">· {t.top.spotName}</span>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

async function ChampionBoard() {
  const { ended } = await listWars();
  const now = new Date();
  if (ended.length === 0) return <EmptyState title="No war has ended yet" action={{ href: "/wars", label: "See the wars" }} />;
  return (
    <section>
      <p className="mb-4 text-ink-soft">Every concluded war and the spot that won it.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {ended.map((w) => (
          <WarCard key={w.id} war={w} now={now} />
        ))}
      </div>
    </section>
  );
}

function RankLadder({ kind }: { kind: RankKind }) {
  return (
    <div className="card p-5">
      <h3 className="mb-1 text-lg font-semibold">{kind === "spot" ? "Spot titles" : "Wing titles"}</h3>
      <p className="mb-3 text-xs text-ink-soft">Earned from the average score out of {MAX_TOTAL}.</p>
      <ol className="grid gap-2 text-sm">
        {[...ranksFor(kind)].reverse().map((r) => (
          <li key={r.title}>
            <div className="flex justify-between font-bold">
              <span>
                {kind === "spot" ? "🏮" : "✦"} {r.title}
              </span>
              <span className="tabular-nums text-ink-soft">{r.min}+</span>
            </div>
            <div className="text-xs text-ink-soft">{r.blurb}</div>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-ink-soft">Rankings blend each average with {PRIOR_WEIGHT} imaginary average scorecards.</p>
    </div>
  );
}
