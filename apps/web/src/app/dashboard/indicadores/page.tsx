"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatTile } from "@/components/stat-tile";
import { apiFetch } from "@/lib/api-client";
import type { DashboardSummary } from "@/lib/dashboard-types";
import { useAuthStore } from "@/stores/auth-store";

const numberFormat = new Intl.NumberFormat("pt-BR", { notation: "compact" });
const currencyFormat = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
});

export default function IndicadoresPage() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const [municipalityId, setMunicipalityId] = useState(
    user?.municipalityId ?? "",
  );

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary", municipalityId],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<DashboardSummary>("/dashboard/summary", {
        accessToken: accessToken!,
        municipalityId,
      }),
  });

  if (!user) return null;

  const data = summaryQuery.data;

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6 dark:bg-black">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          GovRural
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Indicadores gerais do municipio
        </p>
      </div>

      {!user.municipalityId && (
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
      )}

      {summaryQuery.isLoading && (
        <p className="text-zinc-500">Carregando indicadores...</p>
      )}
      {summaryQuery.isError && (
        <p className="text-red-600">Erro ao carregar indicadores.</p>
      )}

      {data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatTile label="Produtores" value={numberFormat.format(data.producers)} />
          <StatTile label="Propriedades" value={numberFormat.format(data.properties)} />
          <StatTile
            label="Solicitacoes"
            value={numberFormat.format(data.serviceRequests.total)}
          />
          <StatTile
            label="Solicitacoes pendentes"
            value={numberFormat.format(data.serviceRequests.pending)}
            status={data.serviceRequests.pending > 0 ? "warning" : "good"}
          />
          <StatTile
            label="Servicos de maquina concluidos"
            value={numberFormat.format(data.machineServicesCompleted)}
          />
          <StatTile
            label="Horas de maquina"
            value={numberFormat.format(Number(data.machineHours))}
          />
          <StatTile
            label="Custo estimado"
            value={currencyFormat.format(Number(data.machineCost.estimated))}
          />
          <StatTile
            label="Custo realizado"
            value={currencyFormat.format(Number(data.machineCost.actual))}
          />
          <StatTile label="Programas" value={numberFormat.format(data.programs)} />
          <StatTile
            label="Beneficiarios"
            value={numberFormat.format(data.beneficiaries)}
          />
          <StatTile
            label="Ocorrencias"
            value={numberFormat.format(data.occurrences.total)}
          />
          <StatTile
            label="Ocorrencias abertas"
            value={numberFormat.format(data.occurrences.open)}
            status={data.occurrences.open > 0 ? "critical" : "good"}
          />
        </div>
      )}
    </div>
  );
}
