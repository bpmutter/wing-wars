import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState, PageHeader } from "@/components/bits";
import { WingCard } from "@/components/cards";
import { listWings } from "@/lib/queries";

export const metadata: Metadata = { title: "All wings" };

const SORTS = [
  { key: "elo", label: "Top rated" },
  { key: "tasted", label: "Most tasted" },
  { key: "new", label: "Newest" },
] as const;

export default async function WingsPage({ searchParams }: PageProps<"/wings">) {
  await connection();
  const { sort: raw } = await searchParams;
  const sort = SORTS.find((s) => s.key === raw)?.key ?? "elo";
  const wings = await listWings({ sort });
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader eyebrow="🍗 The roster" title="Every wing in the land" />
      <div className="mb-6 flex gap-2">
        {SORTS.map((s) => (
          <Link key={s.key} href={`/wings?sort=${s.key}`} className={`btn text-sm ${sort === s.key ? "btn-primary" : "btn-secondary"}`}>
            {s.label}
          </Link>
        ))}
      </div>
      {wings.length === 0 ? (
        <EmptyState title="No wings yet" action={{ href: "/spots/new", label: "Add a spot" }} />
      ) : (
        <div className="grid gap-3">
          {wings.map((w) => (
            <WingCard key={w.id} wing={w} />
          ))}
        </div>
      )}
    </div>
  );
}
