export interface DashboardSummary {
  producers: number;
  properties: number;
  serviceRequests: { total: number; pending: number };
  machineServicesCompleted: number;
  machineHours: string | number;
  machineCost: { estimated: string | number; actual: string | number };
  programs: number;
  beneficiaries: number;
  occurrences: { total: number; open: number };
}
