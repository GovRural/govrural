export type MapLayerKey =
  | "property"
  | "occurrence"
  | "service_request"
  | "machine_service";

export const MAP_LAYERS: MapLayerKey[] = [
  "property",
  "occurrence",
  "service_request",
  "machine_service",
];

export const LAYER_COLORS: Record<MapLayerKey, string> = {
  property: "#16a34a",
  occurrence: "#dc2626",
  service_request: "#2563eb",
  machine_service: "#ca8a04",
};

export const LAYER_LABELS: Record<MapLayerKey, string> = {
  property: "Propriedades",
  occurrence: "Ocorrencias",
  service_request: "Solicitacoes",
  machine_service: "Servicos de maquina",
};
