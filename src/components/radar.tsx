import { ELEMENTS, MAX_SCORE, type Scores } from "@/lib/scoring";

type Series = { scores: Scores; color: string; label: string };

/** A five-point "flavor star" chart. Pass one or two series. */
export function Radar({ series, size = 240 }: { series: Series[]; size?: number }) {
  const c = 100;
  const r = 70;
  const n = ELEMENTS.length;
  const point = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const d = (v / MAX_SCORE) * r;
    return [c + Math.cos(a) * d, c + Math.sin(a) * d] as const;
  };
  const ring = (v: number) => ELEMENTS.map((_, i) => point(i, v).join(",")).join(" ");

  return (
    <svg viewBox="-24 -4 248 208" width={size} height={size * (208 / 248)} role="img" aria-label={`Flavor chart: ${series.map((s) => s.label).join(" vs ")}`}>
      {[2.5, 5, 7.5, 10].map((v) => (
        <polygon key={v} points={ring(v)} fill={v === 10 ? "var(--paper-2)" : "none"} stroke="var(--line)" strokeWidth="1" />
      ))}
      {ELEMENTS.map((_, i) => {
        const [x, y] = point(i, MAX_SCORE);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" />;
      })}
      {series.map((s) => (
        <polygon
          key={s.label}
          points={ELEMENTS.map((e, i) => point(i, s.scores[e.key]).join(",")).join(" ")}
          fill={s.color}
          fillOpacity="0.28"
          stroke={s.color}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      ))}
      {ELEMENTS.map((e, i) => {
        const [x, y] = point(i, MAX_SCORE + 2.6);
        return (
          <text key={e.key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="700" fill="var(--ink-soft)">
            {e.icon} {e.label}
          </text>
        );
      })}
    </svg>
  );
}
