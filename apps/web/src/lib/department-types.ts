export type DepartmentStatus = "ACTIVE" | "INACTIVE";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  status: DepartmentStatus;
}
