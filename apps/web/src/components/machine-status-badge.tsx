import { MACHINE_STATUS_LABELS, type MachineStatus } from "@/lib/machine-types";

const STATUS_TONES: Record<MachineStatus, string> = {
  ACTIVE: "bg-primary/10 text-primary",
  INACTIVE: "bg-muted text-muted-foreground",
  MAINTENANCE: "bg-chart-4/15 text-chart-4",
};

export function MachineStatusBadge({ status }: { status: MachineStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONES[status]}`}
    >
      {MACHINE_STATUS_LABELS[status]}
    </span>
  );
}
