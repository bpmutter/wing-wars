import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState, LeafShower, SectionTitle } from "@/components/bits";
import { WingCard } from "@/components/cards";
import { getSpot } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { WingForm } from "./wing-form";

export const metadata: Metadata = { title: "Spot" };

export default async function SpotPage({ params, searchParams }: PageProps<"/spots/[id]">) {
  await connection();
  const { id } = await params;
  const { added } = await searchParams;
  const data = await getSpot(id);
  if (!data) notFound();
  const { spot, wings } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {added && <LeafShower count={8} />}
      <header className="card mb-10 p-6 sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-sauce">🏮 Wing spot</p>
        <h1 className="mt-1 text-4xl font-semibold sm:text-5xl">{spot.name}</h1>
        {spot.neighborhood && <p className="mt-1 text-lg text-ink-soft">{spot.neighborhood}</p>}
        {spot.description && <p className="mt-4 max-w-2xl">{spot.description}</p>}
        {added && <p className="mt-4 rounded-xl bg-meadow/20 p-3 font-bold text-forest">🌱 Spot added! Now add the wings they serve.</p>}
      </header>

      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <SectionTitle>Their wings</SectionTitle>
          {wings.length === 0 ? (
            <EmptyState title="No wings yet">Add the first wing from this spot using the form.</EmptyState>
          ) : (
            <div className="grid gap-3">
              {wings.map((w) => (
                <WingCard key={w.id} wing={w} />
              ))}
            </div>
          )}
        </section>
        <section>
          <SectionTitle>Add a wing</SectionTitle>
          <div className="card p-6">
            <Suspense fallback={<div className="h-64 animate-pulse" />}>
              <WingGate spotId={spot.id} />
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  );
}

async function WingGate({ spotId }: { spotId: string }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <p className="text-center text-ink-soft">
        <Link className="link font-bold text-ink" href={`/sign-in?next=/spots/${spotId}`}>Sign in</Link> to add wings.
      </p>
    );
  }
  return <WingForm spotId={spotId} />;
}
