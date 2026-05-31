"use client";

import { cn } from "@/lib/utils";

interface ScoreCardProps {
  label: string;
  abbreviation: string;
  score: number;
  max: number;
  color?: string;
}

export function ScoreCard({ label, abbreviation, score, max, color = "primary" }: ScoreCardProps) {
  const percentage = max > 0 ? (score / max) * 100 : 0;

  const colorMap: Record<string, { bg: string; bar: string; text: string }> = {
    primary: { bg: "bg-primary/10", bar: "bg-primary", text: "text-primary" },
    blue: { bg: "bg-blue-500/10", bar: "bg-blue-500", text: "text-blue-600" },
    emerald: { bg: "bg-emerald-500/10", bar: "bg-emerald-500", text: "text-emerald-600" },
    amber: { bg: "bg-amber-500/10", bar: "bg-amber-500", text: "text-amber-600" },
    violet: { bg: "bg-violet-500/10", bar: "bg-violet-500", text: "text-violet-600" },
    rose: { bg: "bg-rose-500/10", bar: "bg-rose-500", text: "text-rose-600" },
    cyan: { bg: "bg-cyan-500/10", bar: "bg-cyan-500", text: "text-cyan-600" },
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          <div className={cn("inline-flex items-center gap-1.5 mt-1 rounded-md px-2 py-0.5 text-xs font-bold", colors.bg, colors.text)}>
            {abbreviation}
          </div>
        </div>
        <div className="text-right">
          <span className={cn("text-2xl font-extrabold", colors.text)}>
            {score.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground font-medium">/{max}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", colors.bar)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">{percentage.toFixed(0)}% achieved</p>
    </div>
  );
}
