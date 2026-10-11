import Link from "next/link";
import type { ReactNode } from "react";
import { rankFor, type RankKind } from "@/lib/ranks";
import { timeLeft } from "@/lib/wars";
import { HEAT_LABELS } from "@/lib/scoring";

export function RankBadge({ score, kind = "wing", className = "" }: { score: number | null; kind?: RankKind; className?: string }) {
  if (score === null) return <span className={`chip ${className}`}>{kind === "spot" ? "🏮 Unreviewed" : "✦ Untasted"}</span>;
  const rank = rankFor(score, kind);
  return (
    <span className={`chip bg-honey/25! border-honey/60! text-ink! ${className}`} title={rank.blurb}>
      {kind === "spot" ? "🏮" : "✦"} {rank.title}
    </span>
  );
}

export function HeatPips({ heat }: { heat: number }) {
  return (
    <span className="chip" title={HEAT_LABELS[heat]}>
      <span aria-hidden>{heat === 0 ? "🌿" : "🔥".repeat(heat)}</span>
      <span className="sr-only">{HEAT_LABELS[heat]}</span>
    </span>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-8 animate-rise">
      {eyebrow && <p className="mb-1 text-sm font-bold uppercase tracking-[0.18em] text-sauce">{eyebrow}</p>}
      <h1 className="text-4xl font-semibold sm:text-5xl">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-lg text-ink-soft">{children}</div>}
    </header>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <svg width="90" height="60" viewBox="0 0 120 80" aria-hidden>
        <path d="M15 70 C 0 70, 0 50, 16 49 C 16 30, 36 22, 46 36 C 52 18, 80 16, 84 38 C 98 30, 116 42, 106 56 C 120 58, 118 70, 104 70 Z" fill="var(--paper-2)" stroke="var(--line)" strokeWidth="2" />
        <circle cx="48" cy="52" r="3" fill="var(--ink-soft)" />
        <circle cx="70" cy="52" r="3" fill="var(--ink-soft)" />
        <path d="M54 61 q 5 4 10 0" stroke="var(--ink-soft)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      <h3 className="text-xl font-semibold">{title}</h3>
      {children && <p className="max-w-md text-ink-soft">{children}</p>}
      {action && (
        <Link href={action.href} className="btn btn-primary mt-2">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-semibold">{children}</h2>
      {action && (
        <Link href={action.href} className="link text-sm font-bold text-ink-soft">
          {action.label} →
        </Link>
      )}
    </div>
  );
}

export function StatPill({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-paper px-4 py-3">
      <div className="text-xs font-bold uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="font-display text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

/** A gentle shower of falling leaves, for victories. */
export function LeafShower({ count = 14 }: { count?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const left = (i * 73) % 100;
        const delay = (i * 0.37) % 4;
        const dur = 6 + ((i * 1.3) % 5);
        const sway = ((i % 2 ? 1 : -1) * (30 + ((i * 17) % 60))).toString() + "px";
        return (
          <span
            key={i}
            className="leaf absolute top-0 text-2xl"
            style={{ left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${dur}s`, ["--sway" as string]: sway, animationIterationCount: 2 }}
          >
            {i % 3 === 0 ? "🍃" : i % 3 === 1 ? "🍂" : "✨"}
          </span>
        );
      })}
    </div>
  );
}

export function TypeChip({ type }: { type: { typeId: string | null; typeName: string | null; typeEmoji?: string | null } }) {
  if (!type.typeId) return <span className="chip">Uncategorized</span>;
  return (
    <span className="chip bg-meadow/15! border-meadow/40! text-forest!">
      <span aria-hidden>{type.typeEmoji ?? "🍗"}</span> {type.typeName}
    </span>
  );
}

/** Pill-style tab links. */
export function Tabs({ tabs, active }: { tabs: { key: string; label: string; href: string }[]; active: string }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2" role="tablist">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} role="tab" aria-selected={t.key === active} className={`btn text-sm ${t.key === active ? "btn-primary" : "btn-secondary"}`}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}

/** A soft progress bar, like a path through the hills. */
export function Progress({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div>
      <div className="h-3 overflow-hidden rounded-full border border-line bg-paper-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-gradient-to-r from-meadow to-moss transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function WarStatus({ ended, endsAt, now }: { ended: boolean; endsAt: Date | null; now: Date }) {
  if (ended) return <span className="chip bg-ink/10! text-ink!">🏁 Concluded</span>;
  return (
    <span className="chip bg-sauce/15! border-sauce/40! text-ink!">
      ⚔️ Raging{endsAt && <> · {timeLeft(endsAt, now)}</>}
    </span>
  );
}

/** Marks a filed war scorecard as locked, with a tooltip explaining why. */
export function FinalBadge({ what = "score" }: { what?: string }) {
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        className="chip cursor-help bg-forest/10! border-forest/40! text-forest! focus-visible:outline-2 focus-visible:outline-honey"
        aria-label={`Final: this ${what} can't be edited or deleted`}
      >
        🔒 Final
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 bottom-full z-20 mb-2 w-56 rounded-xl bg-ink px-3 py-2 text-left text-xs font-normal leading-snug text-paper opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100"
      >
        All scores are final. Once filed, a {what} can&apos;t be edited or deleted, so judge it before you submit.
      </span>
    </span>
  );
}

/** A heads-up shown before submitting a war scorecard or review. */
export function FinalNotice({ what = "scorecard" }: { what?: string }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-honey/60 bg-honey/15 px-3 py-2 text-sm">
      <span aria-hidden>🔒</span>
      <span>
        <b>All scores are final.</b> Once you file this {what}, you can&apos;t edit or delete it.
      </span>
    </p>
  );
}
