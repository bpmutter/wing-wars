import { seeded } from "@/lib/hash";

const HEAT_COLORS = [
  ["#f8e3a3", "#e9c46a"], // no heat — buttery
  ["#f6cf7a", "#e3a548"], // gentle — honey
  ["#f2ae5b", "#d9822f"], // warm — amber
  ["#ea8a4a", "#c9582a"], // bonfire — buffalo
  ["#d9583a", "#a8331f"], // fire demon
  ["#b83a2e", "#7a1f1c"], // volcanic
];

type Props = {
  seed: string;
  heat?: number;
  style?: "bone-in" | "boneless";
  size?: number;
  className?: string;
  /** Winners get a little crown of leaves. */
  crowned?: boolean;
  /** Losers look a bit dazed. */
  dazed?: boolean;
  title?: string;
};

/**
 * A wing spirit: every wing in Wing Wars gets its own little forest-creature
 * face, generated deterministically from its id.
 */
export function WingSpirit({ seed, heat = 2, style = "bone-in", size = 96, className, crowned, dazed, title }: Props) {
  const rand = seeded(seed);
  const [light, dark] = HEAT_COLORS[Math.max(0, Math.min(5, heat))];
  const gid = `ws-${seed}-${heat}`;
  const boneless = style === "boneless";

  const rx = 30 + rand() * 6;
  const ry = 25 + rand() * 5;
  const cx = boneless ? 50 : 44;
  const cy = boneless ? 54 : 46;
  const tilt = boneless ? rand() * 10 - 5 : -32 + rand() * 8;

  const eyeStyle = dazed ? "dazed" : rand() < 0.22 ? "sleepy" : "round";
  const mouth = Math.floor(rand() * 3);
  const crumbs = Array.from({ length: 5 }, () => ({
    x: cx - rx * 0.7 + rand() * rx * 1.4,
    y: cy - ry * 0.6 + rand() * ry * 1.3,
    r: 1.2 + rand() * 1.6,
  }));
  const topper = heat >= 4 ? "flame" : rand() < 0.75 ? "leaf" : "none";
  const ex = cx - 8, ey = cy - 3, gap = 15;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? "wing spirit"}
    >
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
      </defs>

      {/* soft ground shadow */}
      <ellipse cx="50" cy="93" rx="30" ry="4" fill="rgb(0 0 0 / 0.12)" />

      {!boneless && (
        <g>
          <line x1="58" y1="60" x2="80" y2="82" stroke="#d8cdb2" strokeWidth="11" strokeLinecap="round" />
          <line x1="58" y1="60" x2="80" y2="82" stroke="#fbf5e4" strokeWidth="8" strokeLinecap="round" />
          <circle cx="84" cy="79" r="6.5" fill="#fbf5e4" stroke="#d8cdb2" strokeWidth="1.5" />
          <circle cx="77" cy="86" r="6.5" fill="#fbf5e4" stroke="#d8cdb2" strokeWidth="1.5" />
        </g>
      )}

      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${gid})`} transform={`rotate(${tilt} ${cx} ${cy})`} stroke={dark} strokeWidth="1.5" />

      {/* sauce drips */}
      {heat > 0 && (
        <g fill={dark} opacity="0.85">
          <path d={`M${cx - 10} ${cy + ry - 4} q 2 9 4 0 z`} />
          <path d={`M${cx + 6} ${cy + ry - 3} q 2.5 11 5 0 z`} />
        </g>
      )}

      {/* crispy bits */}
      <g fill={dark} opacity="0.35">
        {crumbs.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={c.r} />
        ))}
      </g>

      {/* face */}
      <g>
        {eyeStyle === "round" && (
          <>
            {[0, gap].map((dx) => (
              <g key={dx}>
                <circle cx={ex + dx} cy={ey} r="5.6" fill="#fffdf6" />
                <circle cx={ex + dx + 0.6} cy={ey + 0.6} r="3.6" fill="#2c3a3a" />
                <circle cx={ex + dx + 1.8} cy={ey - 0.9} r="1.3" fill="#fff" />
              </g>
            ))}
          </>
        )}
        {eyeStyle === "sleepy" &&
          [0, gap].map((dx) => (
            <path key={dx} d={`M${ex + dx - 4} ${ey} q 4 4 8 0`} stroke="#2c3a3a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          ))}
        {eyeStyle === "dazed" &&
          [0, gap].map((dx) => (
            <path key={dx} d={`M${ex + dx - 3.5} ${ey - 3.5} l7 7 M${ex + dx + 3.5} ${ey - 3.5} l-7 7`} stroke="#2c3a3a" strokeWidth="2" strokeLinecap="round" />
          ))}

        <ellipse cx={ex - 4} cy={ey + 8} rx="4" ry="2.4" fill="#f28b82" opacity="0.6" />
        <ellipse cx={ex + gap + 4} cy={ey + 8} rx="4" ry="2.4" fill="#f28b82" opacity="0.6" />

        {dazed ? (
          <path d={`M${ex + 3} ${ey + 11} q 2 -3 4 0 q 2 3 4 0`} stroke="#2c3a3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        ) : mouth === 0 ? (
          <path d={`M${ex + 3.5} ${ey + 8} q 4 5 8 0`} stroke="#2c3a3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        ) : mouth === 1 ? (
          <ellipse cx={ex + gap / 2} cy={ey + 10} rx="2.4" ry="3" fill="#7a2d22" />
        ) : (
          <path d={`M${ex + 3} ${ey + 9} q 2.2 2.5 4.5 0 q 2.2 2.5 4.5 0`} stroke="#2c3a3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        )}
      </g>

      {/* head topper */}
      {topper === "leaf" && !crowned && (
        <g transform={`translate(${cx - 2} ${cy - ry - 4}) rotate(-20)`}>
          <path d="M0 6 C -2 -4, 8 -10, 14 -8 C 12 0, 6 6, 0 6 Z" fill="#7fb069" stroke="#4a7c59" strokeWidth="1.2" />
          <path d="M0 6 L 10 -5" stroke="#4a7c59" strokeWidth="1" />
        </g>
      )}
      {topper === "flame" && !crowned && (
        <path
          transform={`translate(${cx - 4} ${cy - ry - 12})`}
          d="M6 16 C -2 12, 2 4, 6 0 C 6 6, 12 6, 10 12 C 12 10, 13 8, 13 6 C 16 10, 14 16, 6 16 Z"
          fill="#f2b84b"
          stroke="#d65a31"
          strokeWidth="1.4"
        />
      )}
      {crowned && (
        <g transform={`translate(${cx} ${cy - ry - 2})`}>
          {[-14, -5, 5, 14].map((dx, i) => (
            <path
              key={i}
              transform={`translate(${dx} 0) rotate(${dx * 2.2})`}
              d="M0 2 C -4 -4, -2 -10, 0 -13 C 2 -10, 4 -4, 0 2 Z"
              fill={i % 2 ? "#f2b84b" : "#7fb069"}
              stroke={i % 2 ? "#c48a1c" : "#4a7c59"}
              strokeWidth="1"
            />
          ))}
        </g>
      )}
    </svg>
  );
}
