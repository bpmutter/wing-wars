import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/bits";
import { SpotSpirit } from "@/components/spot-spirit";
import { WingSpirit } from "@/components/wing-spirit";
import { RANKS, SPOT_RANKS } from "@/lib/ranks";
import { ELEMENTS, HEAT_LABELS, MAX_TOTAL, SPOT_ELEMENTS } from "@/lib/scoring";
import { PRIOR_WEIGHT } from "@/lib/war-results";

export const metadata: Metadata = { title: "How it works" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader eyebrow="📜 The scroll of rules" title="How Wing Wars works">
        A small, cozy guide to a very serious campaign.
      </PageHeader>

      <div className="grid gap-6">
        <section className="card p-6">
          <h2 className="text-2xl font-semibold">🏯 Wars</h2>
          <p className="mt-2">
            A <b>war</b> is a long-running campaign across the restaurants in your town. Someone declares it, picks
            the <b>battlegrounds</b> (each restaurant is one battle in the war), optionally limits it to one wing type
            — a Buffalo War, say — and sets an end date. Anyone can join by opening the war&apos;s link. Members can add
            more battlegrounds while it rages.
          </p>
          <p className="mt-3">
            Over the following days or weeks, every judge visits as many battlegrounds as they can and files a
            scorecard for each wing they eat. You can update your scorecards until the war ends.
          </p>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold">🌫️ Fog of war</h2>
          <p className="mt-2">
            By default, each battle is shrouded until you&apos;ve judged it yourself. Once you file a scorecard at a
            battleground, its fog lifts for you: you see its score, every wing&apos;s average and what the other judges
            thought. You can&apos;t peek before you eat, so nobody copies the crowd. The overall standings and honors stay
            hidden from everyone until the war ends, then are revealed all at once. Scorecards from a fogged war
            also stay out of the Hall of Fame and everyone&apos;s journals until it ends. The host can turn the fog off
            for a fully live scoreboard instead. A war ends on its end date, or when the host ends it early.
          </p>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold">👑 How the champion is decided</h2>
          <ol className="mt-3 grid list-decimal gap-2 pl-5">
            <li>Each wing scorecard gets a total out of {MAX_TOTAL} (five elements × 10).</li>
            <li>
              At each battleground, a judge&apos;s scorecards are averaged into <b>one vote</b> — eating three flavors
              doesn&apos;t give you three votes.
            </li>
            <li>
              Each battleground&apos;s votes are averaged, then blended with {PRIOR_WEIGHT} imaginary average judges.
              A spot that only one person visited is pulled toward the middle; a spot five people loved mostly
              speaks for itself. This is what stops a single rave review from winning a war.
            </li>
            <li>The highest score wins the war.</li>
          </ol>
          <p className="mt-3 text-sm text-ink-soft">
            Honors are handed out too: <b>Wing of the War</b>, the best wing at each of the five elements, the{" "}
            <b>Best Hangout</b> (from the optional restaurant reviews), the <b>Most Devoted</b> judge, plus{" "}
            <b>The Oracle</b> (whose personal ranking matched the final result best) and <b>The Contrarian</b> (who
            matched it least).
          </p>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold">🍃 The five elements (wings)</h2>
          <ul className="mt-3 grid gap-2">
            {ELEMENTS.map((e) => (
              <li key={e.key}>
                <b>
                  {e.icon} {e.label}
                </b>{" "}
                — <span className="text-ink-soft">{e.hint}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-soft">
            Each is scored 1–10. Separately, every wing has an <i>advertised</i> heat level from 0 to 5 (
            {HEAT_LABELS.join(" → ")}). The Heat element is how <i>good</i> the heat is.
          </p>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold">🏮 The five virtues (restaurants)</h2>
          <p className="mt-2">
            You can also review a restaurant as a whole — in a war (where it decides the Best Hangout) or any time
            from its page:
          </p>
          <ul className="mt-3 grid gap-2">
            {SPOT_ELEMENTS.map((e) => (
              <li key={e.key}>
                <b>
                  {e.icon} {e.label}
                </b>{" "}
                — <span className="text-ink-soft">{e.hint}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold">🏆 Hall of Fame & solo reviews</h2>
          <p className="mt-2">
            Not every wing needs a war. You can review any wing or restaurant on its own page, any time. Every
            scorecard — war or solo — feeds the Hall of Fame, where wings, spots and wing types are ranked by their
            adjusted average. Averages earn titles:
          </p>
          <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
            <ol className="grid gap-1">
              {RANKS.map((r) => (
                <li key={r.title}>
                  <b>✦ {r.title}</b> <span className="text-ink-soft">({r.min}+)</span>
                </li>
              ))}
            </ol>
            <ol className="grid gap-1">
              {SPOT_RANKS.map((r) => (
                <li key={r.title}>
                  <b>🏮 {r.title}</b> <span className="text-ink-soft">({r.min}+)</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="card flex items-center gap-4 p-6">
          <WingSpirit seed="about-spirit" heat={3} size={72} className="animate-bob shrink-0" />
          <SpotSpirit seed="about-lantern" size={72} className="animate-bob shrink-0" />
          <p>
            Every wing gets its own little spirit and every restaurant its own lantern, generated from who they
            are. Hotter wings glow redder and grow flames; champions wear crowns of leaves.{" "}
            <Link className="link" href="/wars">
              Go find a war →
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
