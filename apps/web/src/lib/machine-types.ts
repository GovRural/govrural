export type MachineStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export interface Machine {
  id: string;
  name: string;
  type: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  plate: string | null;
  serialNumber: string | null;
  hourlyCost: string;
  fuelType: string | null;
  status: MachineStatus;
  currentHourMeter: string;
}

export const MACHINE_STATUS_LABELS: Record<MachineStatus, string> = {
  ACTIVE: "Ativa",
  INACTIVE: "Inativa",
  MAINTENANCE: "Em manutencao",
};
