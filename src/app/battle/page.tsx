import type { Metadata } from "next";
import { connection } from "next/server";
import { EmptyState, PageHeader } from "@/components/bits";
import { wingOptions } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { BattleForm } from "./battle-form";

export const metadata: Metadata = { title: "Battle" };

export default async function BattlePage({ searchParams }: PageProps<"/battle">) {
  await connection();
  await requireUser("/battle");
  const sp = await searchParams;
  const wings = await wingOptions();
  const pick = (v: string | string[] | undefined) => (typeof v === "string" && wings.some((w) => w.id === v) ? v : undefined);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader eyebrow="⚔️ To battle" title="Choose your contenders">
        Eat two wings (ideally side by side, ideally with napkins), score them on the five elements, and let the
        ratings fall where they may.
      </PageHeader>
      {wings.length < 2 ? (
        <EmptyState title="Not enough contenders" action={{ href: "/spots/new", label: "Add a spot" }}>
          A battle needs at least two wings. Add a spot and a couple of its wings first.
        </EmptyState>
      ) : (
        <BattleForm wings={wings} initialA={pick(sp.a)} initialB={pick(sp.b)} />
      )}
    </div>
  );
}
