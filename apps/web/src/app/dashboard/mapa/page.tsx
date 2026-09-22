"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapView } from "@/components/map-view";
import { apiFetch } from "@/lib/api-client";
import type { GeoJsonFeatureCollection, PropertyDetail } from "@/lib/gis-types";
import { useAuthStore } from "@/stores/auth-store";

export default function MapaPage() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const [municipalityId, setMunicipalityId] = useState(
    user?.municipalityId ?? "",
  );
  const [selected, setSelected] = useState<Record<string, unknown> | null>(
    null,
  );

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  const mapQuery = useQuery({
    queryKey: ["gis-map", municipalityId],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<GeoJsonFeatureCollection>("/gis/map", {
        accessToken: accessToken!,
        municipalityId,
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
        municipalityId,
      }),
  });

  if (!user) return null;

  return (
    <div className="flex flex-1 flex-col">
      {!user.municipalityId && (
        <div className="flex items-end gap-2 border-b bg-zinc-50 p-3 dark:bg-black">
          <div className="flex flex-col gap-1">
            <Label htmlFor="municipality">ID do municipio (SUPER_ADMIN)</Label>
            <Input
              id="municipality"
              value={municipalityId}
              onChange={(e) => setMunicipalityId(e.target.value)}
              className="w-96"
              placeholder="UUID do municipio"
            />
          </div>
        </div>
      )}

      <div className="relative flex-1">
        {mapQuery.data ? (
          <MapView
            data={mapQuery.data}
            onFeatureClick={(properties) => setSelected(properties)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            {mapQuery.isLoading
              ? "Carregando mapa..."
              : mapQuery.isError
                ? "Erro ao carregar o mapa."
                : "Informe o municipio para carregar o mapa."}
          </div>
        )}

        {selected && (
          <div className="absolute right-4 top-4 w-80 rounded-lg border bg-white p-4 shadow-lg dark:bg-zinc-900">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">
                {String(selected.label ?? "Detalhe")}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Fechar
              </Button>
            </div>

            {selected.layer === "property" && detailQuery.data ? (
              <div className="flex flex-col gap-2 text-sm">
                <p>
                  <span className="text-zinc-500">Produtores: </span>
                  {detailQuery.data.producers.map((p) => p.name).join(", ") ||
                    "nenhum"}
                </p>
                <p>
                  <span className="text-zinc-500">Talhoes: </span>
                  {detailQuery.data.areas.length}
                </p>
                <p>
                  <span className="text-zinc-500">Solicitacoes: </span>
                  {detailQuery.data.serviceRequests.length}
                </p>
                <p>
                  <span className="text-zinc-500">Servicos de maquina: </span>
                  {detailQuery.data.machineServices.length}
                </p>
                <p>
                  <span className="text-zinc-500">Beneficios recebidos: </span>
                  {detailQuery.data.programBenefits.length}
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Status: {String(selected.status ?? "-")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
