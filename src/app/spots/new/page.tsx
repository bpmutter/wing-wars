import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/bits";
import { db } from "@/db";
import { wars } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { SpotForm } from "./spot-form";

export const metadata: Metadata = { title: "Add a spot" };

export default async function NewSpotPage({ searchParams }: PageProps<"/spots/new">) {
  await connection();
  const { war: warParam } = await searchParams;
  await requireUser(typeof warParam === "string" ? `/spots/new?war=${warParam}` : "/spots/new");
  const [war] = typeof warParam === "string" ? await db.select({ id: wars.id, name: wars.name }).from(wars).where(eq(wars.id, warParam)) : [];

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <PageHeader eyebrow="🏮 New village" title="Add a wing spot">
        {war ? (
          <>
            It&apos;ll join <Link href={`/wars/${war.id}`} className="link">{war.name}</Link> as a new battleground.
          </>
        ) : (
          <>Somewhere that serves wings worth fighting over. You&apos;ll add its wings next.</>
        )}
      </PageHeader>
      <SpotForm warId={war?.id} />
    </div>
  );
}
