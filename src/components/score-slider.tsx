"use client";

import { MAX_SCORE } from "@/lib/scoring";

export function ScoreSlider({
  name,
  value,
  onChange,
  label,
  align = "left",
}: {
  name: string;
  value: number;
  onChange: (v: number) => void;
  label: string;
  align?: "left" | "right";
}) {
  const fill = ((value - 1) / (MAX_SCORE - 1)) * 100;
  return (
    <div className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <input
        type="range"
        name={name}
        min={1}
        max={MAX_SCORE}
        step={1}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`score-slider ${align === "right" ? "rotate-180" : ""}`}
        style={{ ["--fill" as string]: `${fill}%` }}
      />
      <output className="w-8 shrink-0 text-center font-display text-xl font-semibold tabular-nums">{value}</output>
    </div>
  );
}
