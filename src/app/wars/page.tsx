import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState, PageHeader, SectionTitle } from "@/components/bits";
import { WarCard } from "@/components/cards";
import { listWars } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Wars" };

export default async function WarsPage() {
  await connection();
  const now = new Date();
  const [{ active, ended }, user] = await Promise.all([listWars(), getCurrentUser()]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader eyebrow="⚔️ The wars" title="Wing wars">
        A war is a long campaign across many restaurants. Join one, eat your way through every battleground, score
        what you find — and when the war ends, a champion is crowned.
      </PageHeader>
      <div className="mb-10">
        <Link href="/wars/new" className="btn btn-primary text-lg">
          🏯 Start a war
        </Link>
      </div>

      <section>
        <SectionTitle>Raging now</SectionTitle>
        {active.length === 0 ? (
          <EmptyState title="All is quiet on the wing front" action={{ href: "/wars/new", label: "Start the first war" }}>
            No wars are underway. Gather some friends and declare one.
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((w) => (
              <WarCard key={w.id} war={w} now={now} viewerId={user?.id} />
            ))}
          </div>
        )}
      </section>

      {ended.length > 0 && (
        <section className="mt-14">
          <SectionTitle>The chronicle of concluded wars</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            {ended.map((w) => (
              <WarCard key={w.id} war={w} now={now} viewerId={user?.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
