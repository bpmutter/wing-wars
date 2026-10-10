import Link from "next/link";
import type { BattleListItem, WingListItem } from "@/lib/queries";
import { timeAgo, winRate } from "@/lib/format";
import { MAX_TOTAL } from "@/lib/scoring";
import { WingSpirit } from "./wing-spirit";
import { EloDelta, HeatPips, RankBadge } from "./bits";

export function WingCard({ wing, place }: { wing: WingListItem; place?: number }) {
  const rate = winRate(wing.wins, wing.losses);
  return (
    <Link href={`/wings/${wing.id}`} className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5">
      {place !== undefined && <div className="w-8 text-center font-display text-2xl font-semibold text-ink-soft">{place}</div>}
      <WingSpirit seed={wing.id} heat={wing.heat} style={wing.style} size={68} className="shrink-0 transition group-hover:animate-bob" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-lg font-semibold">{wing.name}</div>
        <div className="truncate text-sm text-ink-soft">{wing.spotName}</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <RankBadge elo={wing.elo} />
          <HeatPips heat={wing.heat} />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-display text-2xl font-semibold tabular-nums">{wing.elo}</div>
        <div className="text-xs text-ink-soft tabular-nums">
          {wing.wins}W–{wing.losses}L{rate !== null && ` · ${rate}%`}
        </div>
        {wing.avgTotal != null && (
          <div className="text-xs text-ink-soft tabular-nums">
            ★ {Number(wing.avgTotal).toFixed(1)}/{MAX_TOTAL}
          </div>
        )}
      </div>
    </Link>
  );
}

export function BattleCard({ battle, now }: { battle: BattleListItem; now: Date }) {
  const aWon = battle.winnerId === battle.a.id;
  const side = (w: typeof battle.a, won: boolean, delta: number) => (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${won ? "" : "opacity-70"}`}>
      <WingSpirit seed={w.id} heat={w.heat} style={w.style} size={44} crowned={won} dazed={!won} className="shrink-0" />
      <div className="min-w-0">
        <div className="truncate text-sm font-bold">{w.name}</div>
        <div className="truncate text-xs text-ink-soft">
          {w.spotName} · <EloDelta delta={delta} />
        </div>
      </div>
    </div>
  );
  return (
    <Link href={`/battles/${battle.id}`} className="card flex flex-col gap-2 p-3 transition hover:-translate-y-0.5">
      <div className="flex items-center gap-2">
        {side(battle.a, aWon, battle.eloDeltaA)}
        <span className="shrink-0 font-display text-sm font-bold text-sauce">vs</span>
        {side(battle.b, !aWon, battle.eloDeltaB)}
      </div>
      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span>
          {battle.kind === "tournament" ? "🏯 Tournament match" : "⚔️ Duel"} judged by <b>{battle.userName}</b>
        </span>
        <span>{timeAgo(battle.createdAt, now)}</span>
      </div>
    </Link>
  );
}
