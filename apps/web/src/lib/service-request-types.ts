export type ServiceRequestStatus =
  | "RECEIVED"
  | "UNDER_ANALYSIS"
  | "APPROVED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "WAITING_DOCUMENT";

export type ServiceRequestPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface ServiceRequest {
  id: string;
  protocol: string;
  description: string;
  status: ServiceRequestStatus;
  priority: ServiceRequestPriority;
  requestedAt: string;
  producerId: string;
  propertyId: string | null;
  departmentId: string;
  serviceTypeId: string;
  producer?: { name: string };
  serviceType?: { name: string };
  department?: { name: string };
}

export interface ServiceRequestHistoryEntry {
  id: string;
  previousStatus: ServiceRequestStatus | null;
  newStatus: ServiceRequestStatus;
  comment: string | null;
  createdAt: string;
  user: { name: string } | null;
}

export const STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  RECEIVED: "Recebida",
  UNDER_ANALYSIS: "Em analise",
  APPROVED: "Aprovada",
  SCHEDULED: "Agendada",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluida",
  REJECTED: "Rejeitada",
  CANCELLED: "Cancelada",
  WAITING_DOCUMENT: "Aguardando documento",
};

export const PRIORITY_LABELS: Record<ServiceRequestPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const FINAL_STATUSES: ServiceRequestStatus[] = [
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

export const STATUS_ORDER: ServiceRequestStatus[] = [
  "RECEIVED",
  "UNDER_ANALYSIS",
  "APPROVED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
  "WAITING_DOCUMENT",
];
