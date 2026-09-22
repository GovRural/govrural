export interface GeoJsonFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: Record<string, unknown>;
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export interface PropertyDetail {
  property: { id: string; name: string };
  producers: { id: string; name: string }[];
  areas: { id: string; name: string; areaHectares: string }[];
  serviceRequests: { id: string; protocol: string; status: string }[];
  machineServices: { id: string; serviceType: string; status: string }[];
  programBenefits: {
    id: string;
    benefitType: string;
    status: string;
    program: { name: string };
  }[];
}
