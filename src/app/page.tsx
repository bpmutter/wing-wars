import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BattleCard, WingCard } from "@/components/cards";
import { EmptyState, HeatPips, RankBadge, SectionTitle, StatPill } from "@/components/bits";
import { Radar } from "@/components/radar";
import { Scenery } from "@/components/scenery";
import { WingSpirit } from "@/components/wing-spirit";
import { listWings, recentBattles, recentTournaments, worldStats, getWing } from "@/lib/queries";

export default function Home() {
  return (
    <>
      <section className="relative isolate min-h-[520px] overflow-hidden">
        <Scenery />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start px-4 pt-16 pb-40 sm:pt-24">
          <p className="mb-3 rounded-full bg-card/80 px-3 py-1 text-sm font-bold text-sauce shadow-sm backdrop-blur animate-rise">
            🍃 A gentle tale of crispy skin and fierce rivalry
          </p>
          <h1 className="max-w-3xl text-5xl leading-[1.02] font-semibold text-ink drop-shadow-[0_2px_0_var(--paper)] sm:text-7xl animate-rise">
            Two wings enter.
            <br />
            <span className="text-sauce">One wing</span> is crowned.
          </h1>
          <p className="mt-5 max-w-xl rounded-2xl bg-card/75 p-4 text-lg text-ink backdrop-blur animate-rise">
            Wing Wars is where you pit chicken wings from different spots against each other, judge them on the
            five elements — <b>crisp, sauce, juiciness, heat &amp; value</b> — and watch the rankings shift like
            clouds over the hills.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 animate-rise">
            <Link href="/battle" className="btn btn-primary text-lg">
              ⚔️ Start a battle
            </Link>
            <Link href="/leaderboard" className="btn btn-secondary text-lg">
              🏆 The leaderboard
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <Suspense fallback={<HomeSkeleton />}>
          <HomeData />
        </Suspense>

        <section className="mt-20">
          <SectionTitle>How the wars are waged</SectionTitle>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { n: "1", t: "Gather your contenders", d: "Add the spots you love (or love to hate) and the wings they serve. Every wing gets its own little spirit.", e: "🏮" },
              { n: "2", t: "Battle head-to-head", d: "Eat two wings, score each on the five elements, and declare a victor. Ratings move by Elo — upsets earn more.", e: "⚔️" },
              { n: "3", t: "Crown a champion", d: "Climb from Lost Crumb to Great Sauce Spirit, or run an 8-wing tournament bracket with your friends.", e: "👑" },
            ].map((s) => (
              <div key={s.n} className="card p-6">
                <div className="mb-3 text-3xl" aria-hidden>{s.e}</div>
                <h3 className="text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-ink-soft">{s.d}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

async function HomeData() {
  await connection();
  const now = new Date();
  const [top, battles, stats, tourneys] = await Promise.all([
    listWings({ limit: 6 }),
    recentBattles({ limit: 6 }),
    worldStats(),
    recentTournaments(3),
  ]);

  if (top.length === 0) {
    return (
      <div className="-mt-16 relative">
        <EmptyState title="The meadow is quiet…" action={{ href: "/spots/new", label: "Add the first spot" }}>
          No wings have entered the arena yet. Add a spot and its wings, then start a battle.
        </EmptyState>
      </div>
    );
  }

  const champ = await getWing(top[0].id);

  return (
    <>
      {champ && (
        <section className="relative -mt-24 card overflow-hidden p-6 sm:p-8">
          <div className="grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
            <div className="flex flex-col items-center">
              <WingSpirit seed={champ.wing.id} heat={champ.wing.heat} style={champ.wing.style} size={150} crowned className="animate-bob" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-sauce">👑 Reigning champion</p>
              <h2 className="mt-1 text-3xl font-semibold sm:text-4xl">
                <Link href={`/wings/${champ.wing.id}`} className="link">{champ.wing.name}</Link>
              </h2>
              <p className="text-ink-soft">
                from <Link className="link" href={`/spots/${champ.spot.id}`}>{champ.spot.name}</Link>
                {champ.spot.neighborhood && <> · {champ.spot.neighborhood}</>}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <RankBadge elo={champ.wing.elo} />
                <HeatPips heat={champ.wing.heat} />
                <span className="chip">{champ.wing.wins}W – {champ.wing.losses}L</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatPill label="Wings" value={stats.wings} />
                <StatPill label="Spots" value={stats.spots} />
                <StatPill label="Battles" value={stats.battles} />
                <StatPill label="Scorecards" value={stats.tastings} />
              </div>
            </div>
            {champ.averages && (
              <div className="hidden justify-center lg:flex">
                <Radar series={[{ scores: champ.averages, color: "var(--sauce)", label: champ.wing.name }]} size={230} />
              </div>
            )}
          </div>
        </section>
      )}

      <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <section>
          <SectionTitle action={{ href: "/battles", label: "All battles" }}>Fresh from the battlefield</SectionTitle>
          {battles.length === 0 ? (
            <EmptyState title="No battles yet" action={{ href: "/battle", label: "Start one" }} />
          ) : (
            <div className="grid gap-3">
              {battles.map((b) => (
                <BattleCard key={b.id} battle={b} now={now} />
              ))}
            </div>
          )}
        </section>
        <section>
          <SectionTitle action={{ href: "/leaderboard", label: "Full leaderboard" }}>Top of the hill</SectionTitle>
          <div className="grid gap-3">
            {top.map((w, i) => (
              <WingCard key={w.id} wing={w} place={i + 1} />
            ))}
          </div>
          {tourneys.length > 0 && (
            <div className="mt-8">
              <SectionTitle action={{ href: "/tournament", label: "Run one" }}>Recent tournaments</SectionTitle>
              <div className="grid gap-2">
                {tourneys.map((t) => (
                  <Link key={t.id} href={`/tournaments/${t.id}`} className="card flex items-center justify-between gap-3 px-4 py-3 hover:-translate-y-0.5 transition">
                    <div className="min-w-0">
                      <div className="truncate font-bold">🏯 {t.name}</div>
                      <div className="truncate text-sm text-ink-soft">
                        {t.size} wings · hosted by {t.userName}
                      </div>
                    </div>
                    {t.championName && (
                      <div className="shrink-0 text-right text-sm">
                        <div className="text-ink-soft">Champion</div>
                        <div className="font-bold">👑 {t.championName}</div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function HomeSkeleton() {
  return (
    <div className="relative -mt-24 grid gap-6">
      <div className="card h-64 animate-pulse" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card h-96 animate-pulse" />
        <div className="card h-96 animate-pulse" />
      </div>
    </div>
  );
}
