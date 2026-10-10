import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState, PageHeader } from "@/components/bits";
import { SpotCard } from "@/components/cards";
import { listSpots } from "@/lib/queries";

export const metadata: Metadata = { title: "Spots" };

export default async function SpotsPage() {
  await connection();
  const spots = await listSpots();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader eyebrow="🏮 The villages" title="Wing spots">
        Every tavern, shack and hidden kitchen in the land — ranked by wars won, then by what people think of the place itself.
      </PageHeader>
      <div className="mb-6 flex flex-wrap gap-3">
        <Link href="/spots/new" className="btn btn-primary">+ Add a spot</Link>
        <Link href="/wars/new" className="btn btn-secondary">🏯 Start a war</Link>
      </div>
      {spots.length === 0 ? (
        <EmptyState title="No spots yet" action={{ href: "/spots/new", label: "Add the first" }} />
      ) : (
        <div className="grid gap-3">
          {spots.map((s, i) => (
            <SpotCard key={s.id} spot={s} place={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
