import {
  STATUS_LABELS,
  type ServiceRequestStatus,
} from "@/lib/service-request-types";

const STATUS_TONES: Record<ServiceRequestStatus, string> = {
  RECEIVED: "bg-muted text-muted-foreground",
  UNDER_ANALYSIS: "bg-chart-3/15 text-chart-3",
  APPROVED: "bg-primary/10 text-primary",
  SCHEDULED: "bg-chart-5/15 text-chart-5",
  IN_PROGRESS: "bg-chart-2/20 text-chart-2",
  COMPLETED: "bg-primary/10 text-primary",
  REJECTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
  WAITING_DOCUMENT: "bg-chart-4/15 text-chart-4",
};

export function RequestStatusBadge({ status }: { status: ServiceRequestStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
