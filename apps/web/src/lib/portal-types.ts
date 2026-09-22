export interface PortalMe {
  name: string;
  properties: number;
  openServiceRequests: number;
  completedServices: number;
  programBenefits: number;
}

export interface PortalProperty {
  id: string;
  name: string;
  locality: string | null;
  totalArea: string;
}

export interface PortalServiceRequest {
  id: string;
  protocol: string;
  description: string;
  status: string;
  requestedAt: string;
  serviceType: { name: string };
  department: { name: string };
}
