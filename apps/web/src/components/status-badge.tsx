const TONES = {
  active: "bg-primary/10 text-primary",
  inactive: "bg-muted text-muted-foreground",
} as const;

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONES[STATUS_TONE[status] ?? "inactive"];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      {status === "ACTIVE" ? "Ativo" : status === "INACTIVE" ? "Inativo" : status}
    </span>
  );
}
