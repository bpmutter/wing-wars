import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { EmptyState, PageHeader, StatPill } from "@/components/bits";
import { WingCard } from "@/components/cards";
import { winRate } from "@/lib/format";
import { getWingType } from "@/lib/queries";

export const metadata: Metadata = { title: "Wing type" };

export default async function WingTypePage({ params }: PageProps<"/types/[id]">) {
  await connection();
  const { id } = await params;
  const data = await getWingType(id);
  if (!data) notFound();
  const { type, wings, record } = data;
  const rate = winRate(record.wins, record.losses);
  const spots = new Set(wings.map((w) => w.spotId)).size;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader eyebrow={`${type.emoji} Wing type`} title={`The best ${type.name} in the land`}>
        {type.description}
      </PageHeader>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill label="Wings" value={wings.length} />
        <StatPill label="Spots" value={spots} />
        <StatPill label="vs other types" value={`${record.wins}–${record.losses}`} />
        <StatPill label="Win rate" value={rate === null ? "—" : `${rate}%`} />
      </div>
      {wings.length >= 2 && (
        <div className="mb-6">
          <Link href={`/battle?a=${wings[0].id}&b=${wings[1].id}`} className="btn btn-primary">
            ⚔️ {type.name} vs {type.name}: battle the top two
          </Link>
        </div>
      )}
      {wings.length === 0 ? (
        <EmptyState title={`No ${type.name} wings yet`} action={{ href: "/spots", label: "Add one from a spot" }} />
      ) : (
        <div className="grid gap-3">
          {wings.map((w, i) => (
            <WingCard key={w.id} wing={w} place={i + 1} />
          ))}
        </div>
      )}
      <p className="mt-8 text-sm">
        <Link href="/types" className="link">← All wing types</Link>
      </p>
    </div>
  );
}
