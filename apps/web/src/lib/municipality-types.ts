export type MunicipalityStatus = "ACTIVE" | "INACTIVE";

export interface Municipality {
  id: string;
  name: string;
  state: string;
  status: MunicipalityStatus;
  ibgeCode: string | null;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  timezone: string | null;
}
