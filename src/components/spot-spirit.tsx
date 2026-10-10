import { seeded } from "@/lib/hash";

const LANTERNS = [
  ["#f07a5a", "#c8432a"], // vermilion
  ["#f6c35b", "#d18f1f"], // festival gold
  ["#7cc3b5", "#3f8f80"], // jade
  ["#e98fa6", "#b85671"], // plum blossom
  ["#9db8e8", "#5b78b8"], // dusk blue
];

type Props = {
  seed: string;
  size?: number;
  className?: string;
  crowned?: boolean;
  dazed?: boolean;
  title?: string;
};

/**
 * A spot spirit: every restaurant is a little paper lantern with a face,
 * generated deterministically from its id.
 */
export function SpotSpirit({ seed, size = 96, className, crowned, dazed, title }: Props) {
  const rand = seeded(seed);
  const [light, dark] = LANTERNS[Math.floor(rand() * LANTERNS.length)];
  const gid = `ss-${seed}`;
  const w = 26 + rand() * 6;
  const sleepy = !dazed && rand() < 0.25;
  const mouth = Math.floor(rand() * 3);
  const sign = Math.floor(rand() * 3); // the character painted on the lantern belly

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={title ?? "spot spirit"}>
      <defs>
        <radialGradient id={gid} cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#fff6dc" />
          <stop offset="35%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
      </defs>

      <ellipse cx="50" cy="94" rx="24" ry="3.5" fill="rgb(0 0 0 / 0.12)" />
      {/* hanging cord */}
      <line x1="50" y1="2" x2="50" y2="14" stroke="#6b4f3a" strokeWidth="2" />

      {/* caps */}
      <rect x={50 - 14} y="13" width="28" height="7" rx="2" fill="#4a3528" />
      <rect x={50 - 14} y="80" width="28" height="7" rx="2" fill="#4a3528" />
      {/* tassel */}
      <path d="M46 87 h8 l-1 6 h-6 z" fill={dark} />

      {/* body */}
      <ellipse cx="50" cy="50" rx={w} ry="32" fill={`url(#${gid})`} stroke={dark} strokeWidth="1.5" />
      {/* ribs */}
      <g stroke={dark} strokeWidth="1" opacity="0.35" fill="none">
        <path d={`M50 18 C ${50 - w * 0.55} 30, ${50 - w * 0.55} 70, 50 82`} />
        <path d={`M50 18 C ${50 + w * 0.55} 30, ${50 + w * 0.55} 70, 50 82`} />
        <path d="M24 38 Q 50 34 76 38" />
        <path d="M24 64 Q 50 68 76 64" />
      </g>

      {/* face */}
      {dazed ? (
        [41, 59].map((x) => <path key={x} d={`M${x - 3.5} 42.5 l7 7 M${x + 3.5} 42.5 l-7 7`} stroke="#2c3a3a" strokeWidth="2" strokeLinecap="round" />)
      ) : sleepy ? (
        [41, 59].map((x) => <path key={x} d={`M${x - 4} 46 q 4 4 8 0`} stroke="#2c3a3a" strokeWidth="2.2" fill="none" strokeLinecap="round" />)
      ) : (
        [41, 59].map((x) => (
          <g key={x}>
            <circle cx={x} cy="46" r="5" fill="#fffdf6" />
            <circle cx={x + 0.6} cy="46.6" r="3.2" fill="#2c3a3a" />
            <circle cx={x + 1.7} cy="45" r="1.1" fill="#fff" />
          </g>
        ))
      )}
      <ellipse cx="35" cy="54" rx="3.6" ry="2.2" fill="#f28b82" opacity="0.6" />
      <ellipse cx="65" cy="54" rx="3.6" ry="2.2" fill="#f28b82" opacity="0.6" />
      {dazed ? (
        <path d="M45 58 q 2.5 -3 5 0 q 2.5 3 5 0" stroke="#2c3a3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      ) : mouth === 0 ? (
        <path d="M45.5 55 q 4.5 5 9 0" stroke="#2c3a3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      ) : mouth === 1 ? (
        <ellipse cx="50" cy="57" rx="2.4" ry="3" fill="#7a2d22" />
      ) : (
        <path d="M45 56 q 2.5 2.5 5 0 q 2.5 2.5 5 0" stroke="#2c3a3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      )}

      {/* painted sign */}
      <g stroke="#2c3a3a" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55">
        {sign === 0 && <path d="M45 67 h10 M50 64 v9 M46 72 h8" />}
        {sign === 1 && <path d="M46 65 q 4 4 8 0 M47 70 h6 M50 67 v7" />}
        {sign === 2 && <circle cx="50" cy="69" r="3.5" />}
      </g>

      {crowned && (
        <g transform="translate(50 12)">
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
