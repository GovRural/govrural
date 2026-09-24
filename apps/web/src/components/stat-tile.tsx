import type { LucideIcon } from "lucide-react";

const STATUS_STYLES = {
  good: { dot: "#0ca30c", label: "Em dia" },
  warning: { dot: "#fab219", label: "Atencao" },
  serious: { dot: "#ec835a", label: "Requer acao" },
  critical: { dot: "#d03b3b", label: "Critico" },
} as const;

interface StatTileProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  status?: keyof typeof STATUS_STYLES;
}

export function StatTile({ label, value, icon: Icon, status }: StatTileProps) {
  const statusStyle = status ? STATUS_STYLES[status] : null;

  return (
    <div className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && (
          <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-4" />
          </div>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-card-foreground">
        {value}
      </p>
      {statusStyle && (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className="size-1.5 rounded-full"
            style={{ background: statusStyle.dot }}
          />
          <span className="text-xs text-muted-foreground">
            {statusStyle.label}
          </span>
        </div>
      )}
    </div>
  );
}
