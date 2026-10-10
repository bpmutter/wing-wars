import Link from "next/link";
import type { ReactNode } from "react";
import { rankFor, type RankKind } from "@/lib/ranks";
import { HEAT_LABELS } from "@/lib/scoring";
import { signed } from "@/lib/format";

export function RankBadge({ elo, kind = "wing", className = "" }: { elo: number; kind?: RankKind; className?: string }) {
  const rank = rankFor(elo, kind);
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

export function EloDelta({ delta }: { delta: number }) {
  const tone = delta > 0 ? "text-moss" : delta < 0 ? "text-ember" : "text-ink-soft";
  return <span className={`font-bold tabular-nums ${tone}`}>{signed(delta)}</span>;
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

/** One row of a side-by-side score comparison. */
export function TapeRow({ label, a, b, max, bold }: { label: string; a: number; b: number; max: number; bold?: boolean }) {
  return (
    <div className={`grid grid-cols-[2.5rem_1fr_6.5rem_1fr_2.5rem] items-center gap-2 ${bold ? "border-t border-line pt-4" : ""}`}>
      <span className={`text-right tabular-nums ${a > b ? "font-bold text-sauce" : ""} ${bold ? "font-display text-xl" : ""}`}>{a}</span>
      <div className="flex h-3 justify-end overflow-hidden rounded-full bg-paper-2">
        <div className="rounded-full bg-sauce" style={{ width: `${(a / max) * 100}%` }} />
      </div>
      <span className={`text-center text-sm ${bold ? "font-bold uppercase tracking-wider" : "font-bold"}`}>{label}</span>
      <div className="flex h-3 overflow-hidden rounded-full bg-paper-2">
        <div className="rounded-full bg-moss" style={{ width: `${(b / max) * 100}%` }} />
      </div>
      <span className={`tabular-nums ${b > a ? "font-bold text-moss" : ""} ${bold ? "font-display text-xl" : ""}`}>{b}</span>
    </div>
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
