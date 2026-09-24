export type OccurrenceType =
  | "ROAD"
  | "BRIDGE"
  | "FIRE"
  | "WATER"
  | "ENERGY"
  | "ILLEGAL_DUMPING"
  | "ANIMALS"
  | "MACHINERY"
  | "AGRICULTURE"
  | "HEALTH"
  | "SECURITY"
  | "ENVIRONMENT"
  | "OTHER";

export type OccurrencePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type OccurrenceStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface RuralOccurrence {
  id: string;
  type: OccurrenceType;
  title: string;
  description: string;
  priority: OccurrencePriority;
  status: OccurrenceStatus;
  departmentId: string | null;
  latitude: number | null;
  longitude: number | null;
  resolvedAt: string | null;
  createdAt: string;
  reporterUser?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
}

export const OCCURRENCE_TYPE_LABELS: Record<OccurrenceType, string> = {
  ROAD: "Estrada",
  BRIDGE: "Ponte",
  FIRE: "Incendio",
  WATER: "Agua",
  ENERGY: "Energia",
  ILLEGAL_DUMPING: "Descarte irregular",
  ANIMALS: "Animais",
  MACHINERY: "Maquinario",
  AGRICULTURE: "Agricultura",
  HEALTH: "Saude",
  SECURITY: "Seguranca",
  ENVIRONMENT: "Meio ambiente",
  OTHER: "Outro",
};

export const OCCURRENCE_PRIORITY_LABELS: Record<OccurrencePriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Critica",
};

export const OCCURRENCE_STATUS_LABELS: Record<OccurrenceStatus, string> = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  RESOLVED: "Resolvida",
  CLOSED: "Encerrada",
};

export const OCCURRENCE_STATUS_ORDER: OccurrenceStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

export const OCCURRENCE_MANAGE_ROLES = [
  "SUPER_ADMIN",
  "MUNICIPAL_ADMIN",
  "SECRETARY",
  "TECHNICIAN",
];

export const OCCURRENCE_REPORT_ROLES = [...OCCURRENCE_MANAGE_ROLES, "MACHINE_OPERATOR"];
