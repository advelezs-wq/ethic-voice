"use client";

export type DistributionRow = {
  label: string;
  count: number;
  color: string;
  hint?: string;
};

/**
 * Distribución en filas: nombre, cantidad y porcentaje en texto, barra fina
 * debajo. Más fácil de leer que un gráfico de dona para personas no técnicas.
 */
export function DistributionList({
  rows,
  unit = "denuncias",
  emptyText,
}: {
  rows: DistributionRow[];
  unit?: string;
  emptyText: string;
}) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  if (total === 0) {
    return <p className="py-6 text-center text-sm text-ev-mute">{emptyText}</p>;
  }
  const singular = unit.replace(/s$/, "");
  return (
    <ul className="space-y-4">
      {rows.map((r) => {
        const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
        return (
          <li key={r.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-ev-night">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.color }} aria-hidden />
                <span className="truncate">{r.label}</span>
              </span>
              <span className="shrink-0 text-ev-mute">
                <span className="ev-num font-medium text-ev-night">{r.count}</span>{" "}
                {r.count === 1 ? singular : unit} · {pct}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ev-bone">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: r.color }} />
            </div>
            {r.hint ? <p className="mt-1.5 text-xs text-ev-mute">{r.hint}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}
