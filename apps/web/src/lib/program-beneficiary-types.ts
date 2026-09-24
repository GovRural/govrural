export type ProgramBeneficiaryStatus =
  | "PENDING"
  | "APPROVED"
  | "DELIVERED"
  | "REJECTED"
  | "CANCELLED";

export interface ProgramBeneficiary {
  id: string;
  programId: string;
  producerId: string;
  propertyId: string | null;
  benefitType: string;
  quantity: string | null;
  unit: string | null;
  value: string | null;
  status: ProgramBeneficiaryStatus;
  approvalDate: string | null;
  deliveryDate: string | null;
  producer?: { id: string; name: string };
  property?: { id: string; name: string } | null;
}

export const PROGRAM_BENEFICIARY_STATUS_LABELS: Record<ProgramBeneficiaryStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  DELIVERED: "Entregue",
  REJECTED: "Rejeitado",
  CANCELLED: "Cancelado",
};

export const PROGRAM_BENEFICIARY_STATUS_ORDER: ProgramBeneficiaryStatus[] = [
  "PENDING",
  "APPROVED",
  "DELIVERED",
  "REJECTED",
  "CANCELLED",
];

export const PROGRAM_BENEFICIARY_MANAGE_ROLES = [
  "SUPER_ADMIN",
  "MUNICIPAL_ADMIN",
  "SECRETARY",
  "TECHNICIAN",
];
