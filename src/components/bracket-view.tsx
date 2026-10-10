import type { Match } from "@/lib/bracket";
import { roundName } from "@/lib/bracket";

type Named = { id: string; name: string; spotName: string };

/** Renders a single-elimination bracket. Unplayed future matches show as "TBD". */
export function BracketView({
  size,
  matches,
  wings,
  current,
}: {
  size: number;
  matches: Match[];
  wings: Map<string, Named>;
  current?: Match | null;
}) {
  const rounds = Math.log2(size);
  const cols = Array.from({ length: rounds }, (_, r) => {
    const count = size / 2 ** (r + 1);
    return Array.from({ length: count }, (_, i) => matches.find((m) => m.round === r + 1 && m.index === i) ?? null);
  });

  const slot = (id: string | undefined, won: boolean, lost: boolean) => (
    <div
      className={`flex items-center gap-1 truncate px-2 py-1 text-xs ${won ? "bg-honey/30 font-bold" : ""} ${lost ? "text-ink-soft line-through decoration-1" : ""}`}
    >
      {won && <span aria-hidden>👑</span>}
      <span className="truncate">{id ? wings.get(id)?.name ?? "?" : "TBD"}</span>
    </div>
  );

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-max gap-4" style={{ gridTemplateColumns: `repeat(${rounds}, minmax(9.5rem, 1fr))` }}>
        {cols.map((col, r) => (
          <div key={r} className="flex flex-col">
            <div className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-sauce">{roundName(r + 1, rounds)}</div>
            <div className="flex flex-1 flex-col justify-around gap-3">
              {col.map((m, i) => {
                const isCurrent = !!current && m === current;
                return (
                  <div
                    key={i}
                    className={`overflow-hidden rounded-xl border-2 bg-card divide-y divide-line ${isCurrent ? "border-sauce shadow-lg" : "border-line"}`}
                  >
                    {slot(m?.a, !!m?.winner && m.winner === m.a, !!m?.winner && m.winner !== m.a)}
                    {slot(m?.b, !!m?.winner && m.winner === m.b, !!m?.winner && m.winner !== m.b)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
