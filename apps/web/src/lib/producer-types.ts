export type ProducerType =
  | "INDIVIDUAL"
  | "COMPANY"
  | "ASSOCIATION"
  | "COOPERATIVE"
  | "OTHER";

export type ProducerStatus = "ACTIVE" | "INACTIVE";

export interface Producer {
  id: string;
  name: string;
  cpfCnpj: string;
  producerType: ProducerType;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  ruralRegistration: string | null;
  stateRegistration: string | null;
  carNumber: string | null;
  cafNumber: string | null;
  association: string | null;
  cooperative: string | null;
  status: ProducerStatus;
  notes: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const PRODUCER_TYPE_LABELS: Record<ProducerType, string> = {
  INDIVIDUAL: "Pessoa fisica",
  COMPANY: "Empresa",
  ASSOCIATION: "Associacao",
  COOPERATIVE: "Cooperativa",
  OTHER: "Outro",
};
