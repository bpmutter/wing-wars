import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState, PageHeader } from "@/components/bits";
import { WingSpirit } from "@/components/wing-spirit";
import { listWingTypes } from "@/lib/queries";
import { MAX_TOTAL } from "@/lib/scoring";

export const metadata: Metadata = { title: "Wing types" };

export default async function TypesPage() {
  await connection();
  const types = await listWingTypes();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader eyebrow="🍃 The great families" title="Wing types">
        Buffalo, lemon pepper, garlic parm and friends. Each type has its own leaderboard of the best versions in
        the land — and makes a fine theme for a war.
      </PageHeader>
      {types.length === 0 ? (
        <EmptyState title="No wing types yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {types.map((t, i) => (
            <Link
              key={t.id}
              href={`/types/${t.id}`}
              className={`card flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 ${t.wingCount ? "" : "opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-semibold">
                    <span aria-hidden>{t.emoji}</span> {t.name}
                  </h2>
                  {t.description && <p className="line-clamp-2 text-sm text-ink-soft">{t.description}</p>}
                </div>
                {t.avgTotal !== null && <span className="font-display text-2xl font-semibold text-ink-soft">#{i + 1}</span>}
              </div>
              {t.top ? (
                <div className="flex items-center gap-3 rounded-2xl bg-paper-2 p-2">
                  <WingSpirit seed={t.top.id} heat={t.top.heat} style={t.top.style} size={44} crowned />
                  <div className="min-w-0 text-sm">
                    <div className="text-xs font-bold uppercase tracking-wider text-sauce">Best in type</div>
                    <div className="truncate font-bold">
                      {t.top.name} <span className="font-normal text-ink-soft">· {t.top.spotName}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-soft">{t.wingCount ? "None of these have been tasted yet." : "No wings of this type yet."}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <span className="chip">
                  🍗 {t.wingCount} wing{t.wingCount === 1 ? "" : "s"} at {t.spotCount} spot{t.spotCount === 1 ? "" : "s"}
                </span>
                {t.avgTotal !== null && (
                  <span className="chip">
                    avg {t.avgTotal.toFixed(1)}/{MAX_TOTAL} over {t.tastingCount} scorecards
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
