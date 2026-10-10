import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { EmptyState, PageHeader, SectionTitle, StatPill } from "@/components/bits";
import { WarCard, WingCard } from "@/components/cards";
import { getWingType } from "@/lib/queries";
import { MAX_TOTAL } from "@/lib/scoring";

export const metadata: Metadata = { title: "Wing type" };

export default async function WingTypePage({ params }: PageProps<"/types/[id]">) {
  await connection();
  const { id } = await params;
  const data = await getWingType(id);
  if (!data) notFound();
  const { type, wings, wars } = data;
  const now = new Date();
  const tasted = wings.filter((w) => w.avgTotal !== null);
  const n = tasted.reduce((s, w) => s + w.tastingCount, 0);
  const avg = n ? tasted.reduce((s, w) => s + w.avgTotal! * w.tastingCount, 0) / n : null;
  const spots = new Set(wings.map((w) => w.spotId)).size;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader eyebrow={`${type.emoji} Wing type`} title={`The best ${type.name} in the land`}>
        {type.description}
      </PageHeader>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill label="Wings" value={wings.length} />
        <StatPill label="Spots" value={spots} />
        <StatPill label="Scorecards" value={n} />
        <StatPill label="Avg score" value={avg !== null ? `${avg.toFixed(1)}/${MAX_TOTAL}` : "—"} />
      </div>
      {spots >= 2 && (
        <div className="mb-8">
          <Link href="/wars/new" className="btn btn-primary">
            🏯 Start a {type.name} war
          </Link>
        </div>
      )}
      {wings.length === 0 ? (
        <EmptyState title={`No ${type.name} wings yet`} action={{ href: "/spots", label: "Add one from a spot" }} />
      ) : (
        <div className="grid gap-3">
          {wings.map((w, i) => (
            <WingCard key={w.id} wing={w} place={w.score !== null ? i + 1 : undefined} />
          ))}
        </div>
      )}
      {wars.length > 0 && (
        <section className="mt-12">
          <SectionTitle>{type.name} wars</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            {wars.map((w) => (
              <WarCard key={w.id} war={w} now={now} />
            ))}
          </div>
        </section>
      )}
      <p className="mt-8 text-sm">
        <Link href="/types" className="link">
          ← All wing types
        </Link>
      </p>
    </div>
  );
}
