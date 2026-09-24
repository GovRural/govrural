import {
  OCCURRENCE_STATUS_LABELS,
  type OccurrenceStatus,
} from "@/lib/occurrence-types";

const STATUS_TONES: Record<OccurrenceStatus, string> = {
  OPEN: "bg-chart-4/15 text-chart-4",
  IN_PROGRESS: "bg-chart-2/20 text-chart-2",
  RESOLVED: "bg-primary/10 text-primary",
  CLOSED: "bg-muted text-muted-foreground",
};

export function OccurrenceStatusBadge({ status }: { status: OccurrenceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONES[status]}`}
    >
      {OCCURRENCE_STATUS_LABELS[status]}
    </span>
  );
}
