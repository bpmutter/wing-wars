import type { Metadata } from "next";
import { connection } from "next/server";
import { EmptyState, PageHeader, Tabs } from "@/components/bits";
import { spotOptions, wingOptions, wingTypeOptions } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { BattleForm, type Contender } from "./battle-form";

export const metadata: Metadata = { title: "Battle" };

export default async function BattlePage({ searchParams }: PageProps<"/battle">) {
  await connection();
  const sp = await searchParams;
  const mode = sp.mode === "spot" ? "spot" : "wing";
  await requireUser(mode === "spot" ? "/battle?mode=spot" : "/battle");

  let contenders: Contender[];
  let types: Awaited<ReturnType<typeof wingTypeOptions>> = [];
  if (mode === "wing") {
    const [wings, t] = await Promise.all([wingOptions(), wingTypeOptions()]);
    types = t;
    contenders = wings.map((w) => ({ ...w, subtitle: w.spotName, group: w.spotName }));
  } else {
    const spots = await spotOptions();
    contenders = spots.map((s) => ({ ...s, subtitle: s.neighborhood, group: s.neighborhood || "Elsewhere" }));
  }
  const pick = (v: string | string[] | undefined) => (typeof v === "string" && contenders.some((c) => c.id === v) ? v : undefined);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader eyebrow="⚔️ To battle" title={mode === "wing" ? "Choose your contenders" : "Spot showdown"}>
        {mode === "wing" ? (
          <>Eat two wings (ideally side by side, ideally with napkins), score them on the five elements, and let the ratings fall where they may.</>
        ) : (
          <>Pit two restaurants against each other on the whole experience — the wing menu, the dips, the vibe, the service and the bill.</>
        )}
      </PageHeader>
      <Tabs
        active={mode}
        tabs={[
          { key: "wing", label: "🍗 Wing vs Wing", href: "/battle" },
          { key: "spot", label: "🏮 Spot vs Spot", href: "/battle?mode=spot" },
        ]}
      />
      {contenders.length < 2 ? (
        <EmptyState title="Not enough contenders" action={{ href: "/spots/new", label: "Add a spot" }}>
          A battle needs at least two {mode === "wing" ? "wings" : "spots"}.{" "}
          {mode === "wing" ? "Add a spot and a couple of its wings first." : "Add another spot first."}
        </EmptyState>
      ) : (
        <BattleForm key={mode} mode={mode} contenders={contenders} types={types} initialA={pick(sp.a)} initialB={pick(sp.b)} />
      )}
    </div>
  );
}
