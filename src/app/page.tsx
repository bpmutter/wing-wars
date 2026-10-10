import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState, SectionTitle, StatPill } from "@/components/bits";
import { SpotCard, WarCard, WingCard } from "@/components/cards";
import { Scenery } from "@/components/scenery";
import { SpotSpirit } from "@/components/spot-spirit";
import { listSpots, listWars, listWings, worldStats } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

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
            Declare war.
            <br />
            <span className="text-sauce">Eat everywhere.</span> Crown a champion.
          </h1>
          <p className="mt-5 max-w-xl rounded-2xl bg-card/75 p-4 text-lg text-ink backdrop-blur animate-rise">
            A wing war is a campaign across the restaurants in your town. Rally your friends, visit every
            battleground, score each wing on the five elements — <b>crisp, sauce, juiciness, heat &amp; value</b> —
            and when the war ends, the champion rises from the mist.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 animate-rise">
            <Link href="/wars/new" className="btn btn-primary text-lg">
              🏯 Start a war
            </Link>
            <Link href="/wars" className="btn btn-secondary text-lg">
              ⚔️ Join a war
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <Suspense fallback={<HomeSkeleton />}>
          <HomeData />
        </Suspense>

        <section className="mt-20">
          <SectionTitle>How a war is waged</SectionTitle>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { t: "Declare a war", d: "Pick the restaurants (each one is a battle), choose which wings count — maybe Buffalo only — and set an end date. Share the link to recruit judges.", e: "🏯" },
              { t: "Eat across the land", d: "Visit every battleground and score each wing you eat. The fog of war keeps the standings hidden, so nobody follows the crowd.", e: "🍗" },
              { t: "The grand reveal", d: "When the war ends, the scores are tallied, the champion is crowned, and honors go to the best wing, the crispiest, the saucy-est and more.", e: "👑" },
            ].map((s) => (
              <div key={s.t} className="card p-6">
                <div className="mb-3 text-3xl" aria-hidden>
                  {s.e}
                </div>
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
  const [{ active, ended }, topWings, topSpots, stats, user] = await Promise.all([
    listWars(),
    listWings({ limit: 5 }),
    listSpots({ limit: 3 }),
    worldStats(),
    getCurrentUser(),
  ]);
  const latest = ended.find((w) => w.champion);

  return (
    <>
      {latest?.champion ? (
        <section className="relative -mt-24 card overflow-hidden p-6 sm:p-8">
          <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
            <div className="flex justify-center">
              <SpotSpirit seed={latest.champion.spotId} size={150} crowned className="animate-bob" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-sauce">👑 Latest war champion</p>
              <h2 className="mt-1 text-3xl font-semibold sm:text-4xl">
                <Link href={`/spots/${latest.champion.spotId}`} className="link">
                  {latest.champion.name}
                </Link>
              </h2>
              <p className="text-ink-soft">
                won{" "}
                <Link className="link" href={`/wars/${latest.id}`}>
                  {latest.name}
                </Link>{" "}
                against {latest.battlegroundCount - 1} other spot{latest.battlegroundCount === 2 ? "" : "s"}, judged by {latest.memberCount}.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatPill label="Wars" value={stats.wars} />
                <StatPill label="Spots" value={stats.spots} />
                <StatPill label="Wings" value={stats.wings} />
                <StatPill label="Scorecards" value={stats.scorecards} />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="relative -mt-16" />
      )}

      <section className="mt-14">
        <SectionTitle action={{ href: "/wars", label: "All wars" }}>Wars raging now</SectionTitle>
        {active.length === 0 ? (
          <EmptyState title="All is quiet on the wing front" action={{ href: "/wars/new", label: "Start a war" }}>
            No wars are underway right now.
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {active.slice(0, 4).map((w) => (
              <WarCard key={w.id} war={w} now={now} viewerId={user?.id} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <section>
          <SectionTitle action={{ href: "/leaderboard", label: "Hall of Fame" }}>Most beloved wings</SectionTitle>
          {topWings.length === 0 ? (
            <EmptyState title="No wings yet" action={{ href: "/spots/new", label: "Add a spot" }} />
          ) : (
            <div className="grid gap-3">
              {topWings.map((w, i) => (
                <WingCard key={w.id} wing={w} place={i + 1} />
              ))}
            </div>
          )}
        </section>
        <section>
          <SectionTitle action={{ href: "/leaderboard?board=spots", label: "All spots" }}>Most beloved spots</SectionTitle>
          <div className="grid gap-3">
            {topSpots.map((s, i) => (
              <SpotCard key={s.id} spot={s} place={i + 1} />
            ))}
          </div>
          {ended.length > 0 && (
            <div className="mt-8">
              <SectionTitle action={{ href: "/leaderboard?board=champions", label: "All champions" }}>Recently concluded</SectionTitle>
              <div className="grid gap-3">
                {ended.slice(0, 3).map((w) => (
                  <WarCard key={w.id} war={w} now={now} viewerId={user?.id} />
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
