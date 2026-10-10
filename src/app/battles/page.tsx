import type { Metadata } from "next";
import { connection } from "next/server";
import { EmptyState, PageHeader, Tabs } from "@/components/bits";
import { BattleCard, SpotBattleCard } from "@/components/cards";
import { recentBattles, recentSpotBattles } from "@/lib/queries";

export const metadata: Metadata = { title: "Battles" };

export default async function BattlesPage({ searchParams }: PageProps<"/battles">) {
  await connection();
  const { kind } = await searchParams;
  const spots = kind === "spots";
  const now = new Date();
  const [battles, spotBattles] = await Promise.all([spots ? [] : recentBattles({ limit: 60 }), spots ? recentSpotBattles({ limit: 60 }) : []]);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader eyebrow="📜 The chronicle" title="Every battle, recorded">
        The most recent clashes from across the land.
      </PageHeader>
      <Tabs
        active={spots ? "spots" : "wings"}
        tabs={[
          { key: "wings", label: "🍗 Wing battles", href: "/battles" },
          { key: "spots", label: "🏮 Spot showdowns", href: "/battles?kind=spots" },
        ]}
      />
      {spots ? (
        spotBattles.length === 0 ? (
          <EmptyState title="No showdowns yet" action={{ href: "/battle?mode=spot", label: "Start the first" }} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {spotBattles.map((b) => (
              <SpotBattleCard key={b.id} battle={b} now={now} />
            ))}
          </div>
        )
      ) : battles.length === 0 ? (
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
