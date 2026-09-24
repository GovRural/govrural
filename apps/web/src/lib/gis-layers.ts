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

// Cores via CSS custom property (nao hex cru) - resolvidas pelo browser a
// partir de globals.css, entao acompanham automaticamente o dark mode.
export const LAYER_COLORS: Record<MapLayerKey, string> = {
  property: "var(--chart-1)",
  occurrence: "var(--chart-4)",
  service_request: "var(--chart-3)",
  machine_service: "var(--chart-2)",
};

export const LAYER_LABELS: Record<MapLayerKey, string> = {
  property: "Propriedades",
  occurrence: "Ocorrencias",
  service_request: "Solicitacoes",
  machine_service: "Servicos de maquina",
};
