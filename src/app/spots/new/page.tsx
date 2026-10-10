import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHeader } from "@/components/bits";
import { requireUser } from "@/lib/session";
import { SpotForm } from "./spot-form";

export const metadata: Metadata = { title: "Add a spot" };

export default async function NewSpotPage() {
  await connection();
  await requireUser("/spots/new");
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <PageHeader eyebrow="🏮 New village" title="Add a wing spot">
        Somewhere that serves wings worth fighting over. You&apos;ll add its wings next.
      </PageHeader>
      <SpotForm />
    </div>
  );
}
