import {
  PROGRAM_BENEFICIARY_STATUS_LABELS,
  type ProgramBeneficiaryStatus,
} from "@/lib/program-beneficiary-types";

const STATUS_TONES: Record<ProgramBeneficiaryStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  APPROVED: "bg-chart-3/15 text-chart-3",
  DELIVERED: "bg-primary/10 text-primary",
  REJECTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function ProgramBeneficiaryStatusBadge({
  status,
}: {
  status: ProgramBeneficiaryStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONES[status]}`}
    >
      {PROGRAM_BENEFICIARY_STATUS_LABELS[status]}
    </span>
  );
}
