import type { Metadata } from "next";
import { connection } from "next/server";
import { EmptyState, PageHeader } from "@/components/bits";
import { wingOptions } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { TournamentRunner } from "./tournament-runner";

export const metadata: Metadata = { title: "Tournament" };

export default async function TournamentPage() {
  await connection();
  await requireUser("/tournament");
  const wings = await wingOptions();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader eyebrow="🏯 The grand festival" title="Run a tournament">
        Line up 4, 8 or 16 wings in a single-elimination bracket. Perfect for a wing night with friends: eat each
        pair, tap the winner, and crown a champion.
      </PageHeader>
      {wings.length < 4 ? (
        <EmptyState title="You need at least four wings" action={{ href: "/spots/new", label: "Add more wings" }} />
      ) : (
        <TournamentRunner wings={wings} />
      )}
    </div>
  );
}
