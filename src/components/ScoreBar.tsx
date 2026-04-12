"use client";

export function ScoreBar({ label, value }: { label: string; value: number }) {
  const width = Math.min(100, Math.max(0, value));
  const color =
    value >= 80
      ? "#34d399"
      : value >= 50
        ? "#fbbf24"
        : value >= 20
          ? "#fb923c"
          : "#f87171";

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-geo-text2 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-geo-surface2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-semibold w-12 text-right">
        {value > 0 ? `${value}` : "—"}
      </span>
    </div>
  );
}
