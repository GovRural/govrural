const STATUS_COLORS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

interface StatTileProps {
  label: string;
  value: string | number;
  status?: keyof typeof STATUS_COLORS;
}

export function StatTile({ label, value, status }: StatTileProps) {
  return (
    <div
      className="rounded-lg border bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      style={status ? { borderLeftColor: STATUS_COLORS[status], borderLeftWidth: 4 } : undefined}
    >
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
