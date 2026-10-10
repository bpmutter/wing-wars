import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState, PageHeader, RankBadge } from "@/components/bits";
import { listSpots } from "@/lib/queries";
import { winRate } from "@/lib/format";

export const metadata: Metadata = { title: "Spots" };

export default async function SpotsPage() {
  await connection();
  const spots = await listSpots();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader eyebrow="🏮 The villages" title="Wing spots">
        Every tavern, shack and hidden kitchen that has sent a wing into battle.
      </PageHeader>
      <div className="mb-6">
        <Link href="/spots/new" className="btn btn-primary">+ Add a spot</Link>
      </div>
      {spots.length === 0 ? (
        <EmptyState title="No spots yet" action={{ href: "/spots/new", label: "Add the first" }} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {spots.map((s) => {
            const rate = winRate(Number(s.wins), Number(s.losses));
            return (
              <Link key={s.id} href={`/spots/${s.id}`} className="card flex flex-col gap-2 p-5 transition hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-semibold">🏮 {s.name}</h2>
                    {s.neighborhood && <p className="text-sm text-ink-soft">{s.neighborhood}</p>}
                  </div>
                  {s.bestElo != null && <RankBadge elo={Number(s.bestElo)} />}
                </div>
                {s.description && <p className="line-clamp-2 text-sm text-ink-soft">{s.description}</p>}
                <div className="mt-auto flex gap-2 pt-2">
                  <span className="chip">{s.wingCount} wing{Number(s.wingCount) === 1 ? "" : "s"}</span>
                  <span className="chip">{s.wins}W – {s.losses}L</span>
                  {rate !== null && <span className="chip">{rate}% wins</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
