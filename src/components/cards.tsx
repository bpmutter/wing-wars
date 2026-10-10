import Link from "next/link";
import type { SpotListItem, WarSummary, WingListItem } from "@/lib/queries";
import { MAX_SPOT_TOTAL, MAX_TOTAL } from "@/lib/scoring";
import { HeatPips, Progress, RankBadge, TypeChip, WarStatus } from "./bits";
import { SpotSpirit } from "./spot-spirit";
import { WingSpirit } from "./wing-spirit";

export function WingCard({ wing, place }: { wing: WingListItem; place?: number }) {
  return (
    <Link href={`/wings/${wing.id}`} className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5">
      {place !== undefined && <div className="w-8 text-center font-display text-2xl font-semibold text-ink-soft">{place}</div>}
      <WingSpirit seed={wing.id} heat={wing.heat} style={wing.style} size={68} className="shrink-0 transition group-hover:animate-bob" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-lg font-semibold">{wing.name}</div>
        <div className="truncate text-sm text-ink-soft">{wing.spotName}</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <RankBadge score={wing.avgTotal} />
          <TypeChip type={wing} />
          <HeatPips heat={wing.heat} />
        </div>
      </div>
      <div className="shrink-0 text-right">
        {wing.avgTotal !== null ? (
          <>
            <div className="font-display text-2xl font-semibold tabular-nums">
              {wing.avgTotal.toFixed(1)}
              <span className="text-sm text-ink-soft">/{MAX_TOTAL}</span>
            </div>
            <div className="text-xs text-ink-soft tabular-nums">
              {wing.tastingCount} scorecard{wing.tastingCount === 1 ? "" : "s"}
            </div>
          </>
        ) : (
          <div className="text-sm text-ink-soft">Not yet tasted</div>
        )}
      </div>
    </Link>
  );
}

export function SpotCard({ spot, place }: { spot: SpotListItem; place?: number }) {
  return (
    <Link href={`/spots/${spot.id}`} className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5">
      {place !== undefined && <div className="w-8 text-center font-display text-2xl font-semibold text-ink-soft">{place}</div>}
      <SpotSpirit seed={spot.id} size={68} crowned={spot.warsWon > 0} className="shrink-0 transition group-hover:animate-bob" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-lg font-semibold">{spot.name}</div>
        <div className="truncate text-sm text-ink-soft">{spot.neighborhood || "Somewhere in the hills"}</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <RankBadge score={spot.avgReview} kind="spot" />
          {spot.warsWon > 0 && (
            <span className="chip bg-honey/25! border-honey/60! text-ink!">
              👑 {spot.warsWon} war{spot.warsWon === 1 ? "" : "s"} won
            </span>
          )}
          <span className="chip">
            🍗 {spot.wingCount} wing{spot.wingCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        {spot.avgReview !== null ? (
          <>
            <div className="font-display text-2xl font-semibold tabular-nums">
              {spot.avgReview.toFixed(1)}
              <span className="text-sm text-ink-soft">/{MAX_SPOT_TOTAL}</span>
            </div>
            <div className="text-xs text-ink-soft tabular-nums">
              {spot.reviewCount} review{spot.reviewCount === 1 ? "" : "s"}
            </div>
          </>
        ) : (
          <div className="text-sm text-ink-soft">No reviews yet</div>
        )}
        {spot.avgWing !== null && <div className="text-xs text-ink-soft tabular-nums">wings avg {spot.avgWing.toFixed(1)}</div>}
      </div>
    </Link>
  );
}

export function WarCard({ war, now, viewerId }: { war: WarSummary; now: Date; viewerId?: string | null }) {
  const joined = !!viewerId && war.memberIds.includes(viewerId);
  return (
    <Link href={`/wars/${war.id}`} className="card group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold group-hover:underline">{war.name}</h3>
          <p className="text-sm text-ink-soft">
            hosted by {war.hostName}
            {war.type && (
              <>
                {" "}
                · {war.type.emoji} {war.type.name} only
              </>
            )}
          </p>
        </div>
        {war.champion ? (
          <SpotSpirit seed={war.champion.spotId} size={52} crowned className="shrink-0" />
        ) : (
          <span className="shrink-0 text-3xl" aria-hidden>
            {war.ended ? "🏁" : war.fogOfWar ? "🌫️" : "⚔️"}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <WarStatus ended={war.ended} endsAt={war.endsAt} now={now} />
        <span className="chip">🏮 {war.battlegroundCount} battlegrounds</span>
        <span className="chip">
          🧑‍🌾 {war.memberCount} judge{war.memberCount === 1 ? "" : "s"}
        </span>
        {joined && <span className="chip bg-meadow/20! border-meadow/50! text-forest!">✓ You&apos;re in</span>}
      </div>
      {war.champion ? (
        <p className="text-sm">
          👑 <b>{war.champion.name}</b> {war.ended ? "won the war" : "leads the field"}
        </p>
      ) : war.ended ? (
        <p className="text-sm text-ink-soft">Ended without a single scorecard. The spirits are puzzled.</p>
      ) : (
        <div className="grid gap-1">
          <Progress value={war.completion} label="War progress" />
          <p className="text-xs text-ink-soft">
            {Math.round(war.completion * 100)}% of battlegrounds judged{war.fogOfWar && " · standings hidden by fog of war"}
          </p>
        </div>
      )}
    </Link>
  );
}
