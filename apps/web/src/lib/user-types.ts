export type UserRole =
  | "SUPER_ADMIN"
  | "MUNICIPAL_ADMIN"
  | "SECRETARY"
  | "TECHNICIAN"
  | "MACHINE_OPERATOR"
  | "PRODUCER";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  municipalityId: string | null;
  departmentId: string | null;
  producerId: string | null;
  phone: string | null;
  avatarUrl: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin GovRural",
  MUNICIPAL_ADMIN: "Administrador Municipal",
  SECRETARY: "Secretario",
  TECHNICIAN: "Tecnico",
  MACHINE_OPERATOR: "Operador de Maquina",
  PRODUCER: "Produtor (portal)",
};

export const MUNICIPAL_ADMIN_CREATABLE_ROLES: UserRole[] = [
  "MUNICIPAL_ADMIN",
  "SECRETARY",
  "TECHNICIAN",
  "MACHINE_OPERATOR",
  "PRODUCER",
];
