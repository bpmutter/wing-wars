export function timeAgo(date: Date, now = new Date()) {
  const s = Math.round((now.getTime() - date.getTime()) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function signed(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

export function winRate(wins: number, losses: number) {
  const n = wins + losses;
  return n === 0 ? null : Math.round((wins / n) * 100);
}
