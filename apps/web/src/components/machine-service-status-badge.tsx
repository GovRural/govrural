import {
  MACHINE_SERVICE_STATUS_LABELS,
  type MachineServiceStatus,
} from "@/lib/machine-service-types";

const STATUS_TONES: Record<MachineServiceStatus, string> = {
  SCHEDULED: "bg-chart-5/15 text-chart-5",
  IN_PROGRESS: "bg-chart-2/20 text-chart-2",
  COMPLETED: "bg-primary/10 text-primary",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function MachineServiceStatusBadge({
  status,
}: {
  status: MachineServiceStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONES[status]}`}
    >
      {MACHINE_SERVICE_STATUS_LABELS[status]}
    </span>
  );
}
