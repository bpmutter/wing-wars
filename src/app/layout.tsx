import type { Metadata } from "next";
import { Fraunces, Zen_Maru_Gothic } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { UserMenu } from "@/components/user-menu";
import { CloudPuff } from "@/components/scenery";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const zen = Zen_Maru_Gothic({
  variable: "--font-zen",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: { default: "Wing Wars", template: "%s · Wing Wars" },
  description: "Pit chicken wings from different spots against each other, judge them on the five elements, and crown a Great Sauce Spirit.",
};

const NAV = [
  { href: "/battle", label: "Battle!", emoji: "⚔️" },
  { href: "/leaderboard", label: "Leaderboard", emoji: "🏆" },
  { href: "/spots", label: "Spots", emoji: "🏮" },
  { href: "/types", label: "Wing Types", emoji: "🍃" },
  { href: "/tournament", label: "Tournament", emoji: "🏯" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${zen.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <Link href="/" className="group flex items-center gap-2">
              <span className="relative inline-block">
                <CloudPuff width={44} />
                <span className="absolute inset-0 grid place-items-center pt-1 text-base transition group-hover:animate-bob">🍗</span>
              </span>
              <span className="font-display text-2xl font-semibold tracking-tight">
                Wing <span className="text-sauce">Wars</span>
              </span>
            </Link>
            <nav className="hidden flex-1 items-center gap-1 md:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="btn btn-ghost px-3! py-2! text-sm">
                  <span aria-hidden>{n.emoji}</span> {n.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto md:ml-0">
              <Suspense fallback={<div className="h-9 w-24 animate-pulse rounded-full bg-paper-2" />}>
                <UserMenu />
              </Suspense>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="btn btn-secondary shrink-0 px-3! py-1.5! text-sm">
                <span aria-hidden>{n.emoji}</span> {n.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-20 border-t border-line/70">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-ink-soft sm:flex-row">
            <p>
              🍃 Wing Wars — <i>may your sauce be ever sticky.</i>
            </p>
            <p className="flex gap-4">
              <Link className="link" href="/about">How it works</Link>
              <Link className="link" href="/wings">All wings</Link>
              <Link className="link" href="/spots/new">Add a spot</Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
