import Link from "next/link";
import type { BattleListItem, SpotBattleListItem, SpotListItem, WingListItem } from "@/lib/queries";
import { timeAgo, winRate } from "@/lib/format";
import { MAX_SPOT_TOTAL, MAX_TOTAL } from "@/lib/scoring";
import { WingSpirit } from "./wing-spirit";
import { EloDelta, HeatPips, RankBadge, TypeChip } from "./bits";
import { SpotSpirit } from "./spot-spirit";

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
          <TypeChip type={wing} />
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

export function SpotCard({ spot, place }: { spot: SpotListItem; place?: number }) {
  const rate = winRate(spot.wins, spot.losses);
  return (
    <Link href={`/spots/${spot.id}`} className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5">
      {place !== undefined && <div className="w-8 text-center font-display text-2xl font-semibold text-ink-soft">{place}</div>}
      <SpotSpirit seed={spot.id} size={68} className="shrink-0 transition group-hover:animate-bob" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-lg font-semibold">{spot.name}</div>
        <div className="truncate text-sm text-ink-soft">{spot.neighborhood || "Somewhere in the hills"}</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <RankBadge elo={spot.elo} kind="spot" />
          <span className="chip">
            🍗 {spot.wingCount} wing{Number(spot.wingCount) === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-display text-2xl font-semibold tabular-nums">{spot.elo}</div>
        <div className="text-xs text-ink-soft tabular-nums">
          {spot.wins}W–{spot.losses}L{rate !== null && ` · ${rate}%`}
        </div>
        {spot.avgTotal != null && (
          <div className="text-xs text-ink-soft tabular-nums">
            ★ {Number(spot.avgTotal).toFixed(1)}/{MAX_SPOT_TOTAL}
          </div>
        )}
      </div>
    </Link>
  );
}

export function SpotBattleCard({ battle, now }: { battle: SpotBattleListItem; now: Date }) {
  const aWon = battle.winnerId === battle.a.id;
  const side = (s: typeof battle.a, won: boolean, delta: number) => (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${won ? "" : "opacity-70"}`}>
      <SpotSpirit seed={s.id} size={44} crowned={won} dazed={!won} className="shrink-0" />
      <div className="min-w-0">
        <div className="truncate text-sm font-bold">{s.name}</div>
        <div className="truncate text-xs text-ink-soft">
          {s.neighborhood && <>{s.neighborhood} · </>}
          <EloDelta delta={delta} />
        </div>
      </div>
    </div>
  );
  return (
    <Link href={`/spot-battles/${battle.id}`} className="card flex flex-col gap-2 p-3 transition hover:-translate-y-0.5">
      <div className="flex items-center gap-2">
        {side(battle.a, aWon, battle.eloDeltaA)}
        <span className="shrink-0 font-display text-sm font-bold text-sauce">vs</span>
        {side(battle.b, !aWon, battle.eloDeltaB)}
      </div>
      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span>
          🏮 Spot showdown judged by <b>{battle.userName}</b>
        </span>
        <span>{timeAgo(battle.createdAt, now)}</span>
      </div>
    </Link>
  );
}
