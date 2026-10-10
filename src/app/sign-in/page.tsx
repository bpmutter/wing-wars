import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { WingSpirit } from "@/components/wing-spirit";
import { databaseUrl } from "@/db/client";
import { githubEnabled } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { AuthForm } from "./auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  await connection();
  const { next: raw } = await searchParams;
  // Only allow same-site relative redirects.
  const next = typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  if (await getCurrentUser()) redirect(next);

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <WingSpirit seed="gatekeeper" heat={1} size={110} className="animate-bob" />
        <h1 className="mt-2 text-4xl font-semibold">Welcome, traveler</h1>
        <p className="mt-2 text-ink-soft">Sign in to judge battles, log tastings and run tournaments.</p>
      </div>
      <AuthForm next={next} githubEnabled={githubEnabled} />
      {databaseUrl().startsWith("file:") && (
        <p className="mt-4 text-center text-xs text-ink-soft">
          Local mode tip: the demo judge is <b>demo@wingwars.local</b> / <b>wingwars</b>.
        </p>
      )}
    </div>
  );
}
