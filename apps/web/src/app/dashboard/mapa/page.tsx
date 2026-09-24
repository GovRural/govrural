"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MachineServiceStatusBadge } from "@/components/machine-service-status-badge";
import { MapView } from "@/components/map-view";
import { MapLegend } from "@/components/map-legend";
import { OccurrenceStatusBadge } from "@/components/occurrence-status-badge";
import { RequestStatusBadge } from "@/components/request-status-badge";
import { useTenantId } from "@/hooks/use-tenant-id";
import { apiFetch } from "@/lib/api-client";
import { MAP_LAYERS, type MapLayerKey } from "@/lib/gis-layers";
import type { GeoJsonFeatureCollection, PropertyDetail } from "@/lib/gis-types";
import type { MachineServiceStatus } from "@/lib/machine-service-types";
import type { OccurrenceStatus } from "@/lib/occurrence-types";
import type { ServiceRequestStatus } from "@/lib/service-request-types";
import { useAuthStore } from "@/stores/auth-store";

function SelectedFeatureStatus({ selected }: { selected: Record<string, unknown> }) {
  const status = String(selected.status ?? "");
  switch (selected.layer) {
    case "occurrence":
      return <OccurrenceStatusBadge status={status as OccurrenceStatus} />;
    case "service_request":
      return <RequestStatusBadge status={status as ServiceRequestStatus} />;
    case "machine_service":
      return <MachineServiceStatusBadge status={status as MachineServiceStatus} />;
    default:
      return <span className="text-sm text-muted-foreground">Status: {status || "-"}</span>;
  }
}

export default function MapaPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const municipalityId = useTenantId();
  const [selected, setSelected] = useState<Record<string, unknown> | null>(
    null,
  );
  const [activeLayers, setActiveLayers] = useState<Set<MapLayerKey>>(
    () => new Set(MAP_LAYERS),
  );

  const mapQuery = useQuery({
    queryKey: ["gis-map", municipalityId],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<GeoJsonFeatureCollection>("/gis/map", {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const detailQuery = useQuery({
    queryKey: ["gis-property", selected?.id],
    enabled: Boolean(
      accessToken && municipalityId && selected?.layer === "property",
    ),
    queryFn: () =>
      apiFetch<PropertyDetail>(`/gis/properties/${selected?.id}`, {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const counts = useMemo(() => {
    const result = Object.fromEntries(MAP_LAYERS.map((l) => [l, 0])) as Record<
      MapLayerKey,
      number
    >;
    for (const feature of mapQuery.data?.features ?? []) {
      const layer = String(feature.properties.layer ?? "property") as MapLayerKey;
      if (layer in result) result[layer] += 1;
    }
    return result;
  }, [mapQuery.data]);

  const filteredData = useMemo(() => {
    if (!mapQuery.data) return mapQuery.data;
    return {
      ...mapQuery.data,
      features: mapQuery.data.features.filter((feature) =>
        activeLayers.has(String(feature.properties.layer ?? "property") as MapLayerKey),
      ),
    };
  }, [mapQuery.data, activeLayers]);

  function toggleLayer(layer: MapLayerKey) {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative flex-1">
        {filteredData ? (
          <>
            <MapView
              data={filteredData}
              onFeatureClick={(properties) => setSelected(properties)}
            />
            <MapLegend counts={counts} active={activeLayers} onToggle={toggleLayer} />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            {!municipalityId
              ? "Selecione um municipio no topo da tela."
              : mapQuery.isLoading
                ? "Carregando mapa..."
                : mapQuery.isError
                  ? "Erro ao carregar o mapa."
                  : "Sem dados para exibir."}
          </div>
        )}

        {selected && (
          <div className="absolute right-4 top-4 w-80 rounded-xl border border-border bg-card p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold text-card-foreground">
                {String(selected.label ?? "Detalhe")}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Fechar
              </Button>
            </div>

            {selected.layer === "property" && detailQuery.data ? (
              <div className="flex flex-col gap-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Produtores: </span>
                  {detailQuery.data.producers.map((p) => p.name).join(", ") ||
                    "nenhum"}
                </p>
                <p>
                  <span className="text-muted-foreground">Talhoes: </span>
                  {detailQuery.data.areas.length}
                </p>
                <p>
                  <span className="text-muted-foreground">Solicitacoes: </span>
                  {detailQuery.data.serviceRequests.length}
                </p>
                <p>
                  <span className="text-muted-foreground">Servicos de maquina: </span>
                  {detailQuery.data.machineServices.length}
                </p>
                <p>
                  <span className="text-muted-foreground">Beneficios recebidos: </span>
                  {detailQuery.data.programBenefits.length}
                </p>
              </div>
            ) : (
              <SelectedFeatureStatus selected={selected} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
