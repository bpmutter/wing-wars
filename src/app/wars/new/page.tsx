import type { Metadata } from "next";
import { connection } from "next/server";
import { EmptyState, PageHeader } from "@/components/bits";
import { spotOptions, wingTypeOptions } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { defaultEndDate } from "@/lib/wars";
import { WarForm } from "./war-form";

export const metadata: Metadata = { title: "Start a war" };

export default async function NewWarPage() {
  await connection();
  await requireUser("/wars/new");
  const [spots, types] = await Promise.all([spotOptions(), wingTypeOptions()]);
  const twoWeeks = defaultEndDate();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader eyebrow="🏯 A new campaign" title="Declare a wing war">
        Pick the battlegrounds, choose which wings count, and set a deadline. You&apos;ll be the host — you can
        invite people by sharing the war&apos;s link.
      </PageHeader>
      {spots.length < 2 ? (
        <EmptyState title="You need at least two spots" action={{ href: "/spots/new", label: "Add a spot" }}>
          A war needs battlegrounds. Add a couple of restaurants first.
        </EmptyState>
      ) : (
        <WarForm spots={spots} types={types} defaultEndsOn={twoWeeks} />
      )}
    </div>
  );
}
