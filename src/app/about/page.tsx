import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/bits";
import { WingSpirit } from "@/components/wing-spirit";
import { K_FACTOR, STARTING_ELO } from "@/lib/elo";
import { RANKS, SPOT_RANKS } from "@/lib/ranks";
import { ELEMENTS, HEAT_LABELS, SPOT_ELEMENTS } from "@/lib/scoring";

export const metadata: Metadata = { title: "How it works" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader eyebrow="📜 The scroll of rules" title="How Wing Wars works">
        A small, cozy guide to a very serious competition.
      </PageHeader>

      <div className="grid gap-6">
        <section className="card p-6">
          <h2 className="text-2xl font-semibold">⚔️ Wing battles</h2>
          <p className="mt-2">
            A battle is two wings, eaten side by side, judged by one person. You score each wing on the five elements
            and declare a victor. Usually that&apos;s the one with the higher score — but you can overrule your own
            scorecard if your heart says otherwise.
          </p>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold">🍃 The five elements</h2>
          <ul className="mt-3 grid gap-2">
            {ELEMENTS.map((e) => (
              <li key={e.key}>
                <b>{e.icon} {e.label}</b> — <span className="text-ink-soft">{e.hint}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-soft">
            Each is scored 1–10. Separately, every wing has an <i>advertised</i> heat level from 0 to 5 (
            {HEAT_LABELS.join(" → ")}), which is how spicy the spot claims it is. The Heat element is how <i>good</i>{" "}
            the heat is.
          </p>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold">🍃 Wing types</h2>
          <p className="mt-2">
            Every wing belongs to a <b>type</b>: Buffalo, Lemon Pepper, Garlic Parmesan, Asian Glaze and so on (you can
            add new ones). Each type has its own leaderboard, so you can find the best Buffalo in town, and you can
            run same-type showdowns. Types are also ranked against each other by their record in battles between
            <i> different</i> types — the eternal Buffalo vs. Lemon Pepper question, settled by data.
          </p>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold">🏮 Judging spots</h2>
          <p className="mt-2">
            Restaurants are judged too, separately from their wings. A <b>spot showdown</b> pits two spots against each
            other on the whole visit, and you can leave a solo <b>review</b> on any spot&apos;s page. Spots are scored on
            the five virtues:
          </p>
          <ul className="mt-3 grid gap-2">
            {SPOT_ELEMENTS.map((e) => (
              <li key={e.key}>
                <b>{e.icon} {e.label}</b> — <span className="text-ink-soft">{e.hint}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-soft">
            Spots have their own rating and ranks, from {SPOT_RANKS[0].title} to {SPOT_RANKS[SPOT_RANKS.length - 1].title}. A
            spot can serve the best wing in town and still lose a showdown if the service is grim.
          </p>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold">📈 Ratings</h2>
          <p className="mt-2">
            Every wing starts at <b>{STARTING_ELO}</b> and moves using the Elo system (K = {K_FACTOR}), the same idea
            chess uses — wings and spots each have their own. Beating a stronger rival earns a lot; beating a weaker one earns a little. Ratings are shared
            by everyone, so the leaderboard is the collective wisdom of every judge.
          </p>
          <ol className="mt-4 grid gap-1 text-sm">
            {RANKS.map((r) => (
              <li key={r.title}>
                <b>✦ {r.title}</b> <span className="text-ink-soft">({Number.isFinite(r.min) ? `${r.min}+` : `below ${RANKS[1].min}`}) — {r.blurb}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="card p-6">
          <h2 className="text-2xl font-semibold">🏯 Tournaments</h2>
          <p className="mt-2">
            Got a wing night planned? Pick 4, 8 or 16 wings, seed them by rating or draw randomly, then tap the
            winner of each match. When you save it, every match counts as a battle.
          </p>
        </section>

        <section className="card flex items-center gap-4 p-6">
          <WingSpirit seed="about-spirit" heat={3} size={80} className="animate-bob shrink-0" />
          <p>
            Every wing gets its own little spirit, generated from its identity — crispy bits, sauce drips and all.
            Hotter wings glow redder and grow flames. Champions wear a crown of leaves.{" "}
            <Link className="link" href="/battle">Go start a battle →</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
