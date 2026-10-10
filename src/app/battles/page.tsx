import type { Metadata } from "next";
import { connection } from "next/server";
import { EmptyState, PageHeader } from "@/components/bits";
import { BattleCard } from "@/components/cards";
import { recentBattles } from "@/lib/queries";

export const metadata: Metadata = { title: "Battles" };

export default async function BattlesPage() {
  await connection();
  const now = new Date();
  const battles = await recentBattles({ limit: 60 });
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader eyebrow="📜 The chronicle" title="Every battle, recorded">
        The most recent clashes from across the land.
      </PageHeader>
      {battles.length === 0 ? (
        <EmptyState title="No battles yet" action={{ href: "/battle", label: "Start the first" }} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {battles.map((b) => (
            <BattleCard key={b.id} battle={b} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}
