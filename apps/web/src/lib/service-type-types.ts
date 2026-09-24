export type ServiceTypeStatus = "ACTIVE" | "INACTIVE";

export interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  departmentId: string | null;
  status: ServiceTypeStatus;
}
