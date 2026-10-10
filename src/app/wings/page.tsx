import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState, PageHeader } from "@/components/bits";
import { WingCard } from "@/components/cards";
import { listWings, wingTypeOptions } from "@/lib/queries";

export const metadata: Metadata = { title: "All wings" };

const SORTS = [
  { key: "top", label: "Top rated" },
  { key: "tasted", label: "Most tasted" },
  { key: "new", label: "Newest" },
] as const;

export default async function WingsPage({ searchParams }: PageProps<"/wings">) {
  await connection();
  const { sort: raw, type: rawType } = await searchParams;
  const sort = SORTS.find((s) => s.key === raw)?.key ?? "top";
  const types = await wingTypeOptions();
  const type = types.find((t) => t.id === rawType);
  const wings = await listWings({ sort, typeId: type?.id });
  const href = (q: { sort?: string; type?: string }) => {
    const p = new URLSearchParams();
    if ((q.sort ?? sort) !== "top") p.set("sort", q.sort ?? sort);
    const t = "type" in q ? q.type : type?.id;
    if (t) p.set("type", t);
    const s = p.toString();
    return s ? `/wings?${s}` : "/wings";
  };
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader eyebrow="🍗 The roster" title={type ? `Every ${type.name} wing` : "Every wing in the land"} />
      <div className="mb-3 flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <Link key={s.key} href={href({ sort: s.key })} className={`btn text-sm ${sort === s.key ? "btn-primary" : "btn-secondary"}`}>
            {s.label}
          </Link>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-1.5">
        <Link href={href({ type: undefined })} className={`chip ${type ? "" : "bg-sauce/15! border-sauce/50! text-ink!"}`}>
          All types
        </Link>
        {types.map((t) => (
          <Link key={t.id} href={href({ type: t.id })} className={`chip ${type?.id === t.id ? "bg-sauce/15! border-sauce/50! text-ink!" : ""}`}>
            {t.emoji} {t.name}
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
