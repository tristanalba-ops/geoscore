"use client";

export function RiskBadge({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-geo-text2">{label}</span>
      {active ? (
        <span className="text-xs font-semibold bg-red-500/15 text-red-400 px-2.5 py-1 rounded-full">
          OUI
        </span>
      ) : (
        <span className="text-xs font-semibold bg-green-500/15 text-green-400 px-2.5 py-1 rounded-full">
          NON
        </span>
      )}
    </div>
  );
}
