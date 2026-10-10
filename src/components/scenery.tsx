/**
 * Hand-drawn-ish landscape: big summer clouds, rolling hills, a red-roofed
 * cottage, and (at night) a moon, stars and fireflies.
 */
export function Scenery({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 520" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sky-1)" />
            <stop offset="100%" stopColor="var(--sky-2)" />
          </linearGradient>
          <linearGradient id="hill-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--meadow)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--moss)" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="hill-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--meadow)" />
            <stop offset="100%" stopColor="var(--moss)" />
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff6d6" />
            <stop offset="60%" stopColor="#ffe9a8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffe9a8" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1440" height="520" fill="url(#sky)" />

        <g className="day-only">
          <circle cx="1180" cy="110" r="120" fill="url(#sun)" />
        </g>
        <g className="night-only">
          <circle cx="1180" cy="100" r="38" fill="#fdf3c8" />
          <circle cx="1196" cy="90" r="34" fill="var(--sky-1)" />
          {STARS.map(([x, y, r, d], i) => (
            <circle key={i} className="star" cx={x} cy={y} r={r} fill="#fdf3c8" style={{ animationDelay: `${d}s` }} />
          ))}
        </g>

        {/* towering cumulus */}
        <g fill="var(--cloud)" opacity="0.95">
          <path d="M120 300 C 80 300, 70 250, 115 240 C 105 190, 170 170, 200 205 C 215 150, 300 145, 320 200 C 360 180, 410 215, 390 255 C 430 260, 430 305, 390 305 Z" />
          <path d="M880 250 C 840 250, 835 210, 870 200 C 870 150, 940 130, 970 170 C 990 110, 1090 110, 1100 175 C 1150 160, 1190 200, 1165 235 C 1200 245, 1190 285, 1150 285 L 900 285 Z" opacity="0.85" />
        </g>

        <path d="M0 380 C 200 300, 380 330, 560 350 C 760 372, 900 290, 1120 310 C 1280 325, 1380 300, 1440 290 L1440 520 L0 520 Z" fill="url(#hill-back)" />

        {/* cottage on the hill */}
        <g transform="translate(1040 288)">
          <rect x="0" y="18" width="46" height="34" fill="#f7ecd2" stroke="#8a6a4a" strokeWidth="2" />
          <path d="M-8 22 L23 -4 L54 22 Z" fill="#c8553d" stroke="#8a3a2a" strokeWidth="2" />
          <rect x="18" y="32" width="11" height="20" fill="#8a6a4a" />
          <rect x="5" y="27" width="9" height="9" fill="#ffe6a3" className="night-only" />
          <rect x="5" y="27" width="9" height="9" fill="#a9d6e5" className="day-only" />
          <rect x="34" y="2" width="7" height="14" fill="#8a6a4a" />
        </g>

        {/* tree friends */}
        <g>
          <rect x="268" y="330" width="9" height="40" fill="#6b4f3a" />
          <circle cx="272" cy="316" r="30" fill="var(--moss)" />
          <circle cx="252" cy="330" r="18" fill="var(--moss)" />
          <circle cx="292" cy="328" r="20" fill="var(--moss)" />
        </g>

        <path d="M0 450 C 240 380, 520 420, 760 430 C 1000 440, 1200 390, 1440 410 L1440 520 L0 520 Z" fill="url(#hill-mid)" />
        <path d="M0 500 C 300 470, 640 490, 900 485 C 1140 480, 1300 470, 1440 480 L1440 520 L0 520 Z" fill="var(--paper)" />

        {/* fireflies */}
        <g className="night-only">
          {FIREFLIES.map(([x, y, d], i) => (
            <circle key={i} className="star" cx={x} cy={y} r="2.6" fill="#f7e27a" style={{ animationDelay: `${d}s` }} />
          ))}
        </g>
      </svg>

      {/* little drifting clouds */}
      <div className="cloud-drift absolute top-[12%] left-0 opacity-70" style={{ animationDuration: "90s" }}>
        <CloudPuff width={160} />
      </div>
      <div className="cloud-drift absolute top-[28%] left-0 opacity-50" style={{ animationDuration: "140s", animationDelay: "-60s" }}>
        <CloudPuff width={110} />
      </div>
    </div>
  );
}

export function CloudPuff({ width = 120, className = "" }: { width?: number; className?: string }) {
  return (
    <svg width={width} viewBox="0 0 120 50" className={className} aria-hidden>
      <path d="M15 45 C 0 45, 0 28, 16 27 C 16 12, 36 6, 46 18 C 52 4, 78 2, 82 20 C 96 14, 112 24, 104 36 C 118 38, 116 46, 104 46 Z" fill="var(--cloud)" />
    </svg>
  );
}

const STARS: [number, number, number, number][] = [
  [80, 40, 1.6, 0], [210, 90, 1.2, 1.2], [340, 30, 1.8, 0.4], [470, 120, 1.1, 2],
  [600, 60, 1.5, 0.8], [720, 140, 1.2, 1.6], [820, 40, 1.9, 0.2], [960, 100, 1.1, 2.4],
  [1320, 60, 1.6, 1.1], [1400, 150, 1.2, 0.6], [1260, 190, 1.3, 1.9], [540, 200, 1, 0.3],
];

const FIREFLIES: [number, number, number][] = [
  [180, 420, 0], [420, 400, 1.3], [640, 445, 0.6], [880, 415, 2.1], [1110, 430, 0.9], [1330, 425, 1.7],
];
