export type OwnershipType =
  | "OWNED"
  | "LEASED"
  | "LOAN"
  | "PARTNERSHIP"
  | "POSSESSION"
  | "OTHER";

export type PropertyStatus = "ACTIVE" | "INACTIVE";

export interface RuralProperty {
  id: string;
  name: string;
  registrationNumber: string | null;
  locality: string | null;
  totalArea: string;
  latitude: number | null;
  longitude: number | null;
  ownershipType: OwnershipType;
  status: PropertyStatus;
  producerLinks?: { producer: { id: string; name: string } }[];
}

export interface ProducerPropertyLink {
  id: string;
  producer: { id: string; name: string };
  isPrimary: boolean;
  relationshipType: string | null;
}

export const OWNERSHIP_TYPE_LABELS: Record<OwnershipType, string> = {
  OWNED: "Propria",
  LEASED: "Arrendada",
  LOAN: "Comodato",
  PARTNERSHIP: "Parceria",
  POSSESSION: "Posse",
  OTHER: "Outra",
};
