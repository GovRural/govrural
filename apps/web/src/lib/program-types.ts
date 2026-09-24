export type ProgramStatus = "ACTIVE" | "INACTIVE";

export interface Program {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: string | null;
  eligibilityRules: string | null;
  status: ProgramStatus;
}

export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
};
