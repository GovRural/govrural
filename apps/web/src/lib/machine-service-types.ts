export type MachineServiceStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface MachineService {
  id: string;
  machineId: string;
  operatorId: string | null;
  producerId: string;
  propertyId: string | null;
  serviceRequestId: string | null;
  serviceType: string;
  status: MachineServiceStatus;
  scheduledDate: string | null;
  startTime: string | null;
  endTime: string | null;
  initialHourMeter: string | null;
  finalHourMeter: string | null;
  totalHours: string | null;
  fuelConsumption: string | null;
  estimatedCost: string | null;
  actualCost: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  machine?: { id: string; name: string };
  producer?: { id: string; name: string };
  operator?: { id: string; name: string } | null;
}

export const MACHINE_SERVICE_STATUS_LABELS: Record<MachineServiceStatus, string> = {
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluido",
  CANCELLED: "Cancelado",
};

export const MACHINE_SERVICE_STATUS_ORDER: MachineServiceStatus[] = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export const MACHINE_SERVICE_SCHEDULE_ROLES = [
  "SUPER_ADMIN",
  "MUNICIPAL_ADMIN",
  "SECRETARY",
  "TECHNICIAN",
];

export const MACHINE_SERVICE_EXECUTE_ROLES = [
  "SUPER_ADMIN",
  "MUNICIPAL_ADMIN",
  "TECHNICIAN",
  "MACHINE_OPERATOR",
];
