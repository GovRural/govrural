"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Banknote,
  Clock,
  Tractor,
  Users,
} from "lucide-react";
import { StatTile } from "@/components/stat-tile";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTenantId } from "@/hooks/use-tenant-id";
import { apiFetch } from "@/lib/api-client";
import type { DashboardSummary } from "@/lib/dashboard-types";
import { useAuthStore } from "@/stores/auth-store";

const numberFormat = new Intl.NumberFormat("pt-BR", { notation: "compact" });
const currencyFormat = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
});

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-card-foreground">
        {value}
      </span>
    </div>
  );
}

export default function IndicadoresPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const municipalityId = useTenantId();

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary", municipalityId],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<DashboardSummary>("/dashboard/summary", {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const data = summaryQuery.data;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Indicadores</h1>
        <p className="text-sm text-muted-foreground">
          Visao geral do municipio
        </p>
      </div>

      {!municipalityId && (
        <p className="text-muted-foreground">
          Selecione um municipio no topo da tela para ver os indicadores.
        </p>
      )}
      {summaryQuery.isLoading && (
        <p className="text-muted-foreground">Carregando indicadores...</p>
      )}
      {summaryQuery.isError && (
        <p className="text-destructive">Erro ao carregar indicadores.</p>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile
              icon={Users}
              label="Produtores"
              value={numberFormat.format(data.producers)}
            />
            <StatTile
              icon={Clock}
              label="Solicitacoes pendentes"
              value={numberFormat.format(data.serviceRequests.pending)}
              status={data.serviceRequests.pending > 0 ? "warning" : "good"}
            />
            <StatTile
              icon={AlertTriangle}
              label="Ocorrencias abertas"
              value={numberFormat.format(data.occurrences.open)}
              status={data.occurrences.open > 0 ? "critical" : "good"}
            />
            <StatTile
              icon={Tractor}
              label="Servicos de maquina concluidos"
              value={numberFormat.format(data.machineServicesCompleted)}
            />
            <StatTile
              icon={Banknote}
              label="Custo realizado"
              value={currencyFormat.format(Number(data.machineCost.actual))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Atendimento</CardTitle>
              </CardHeader>
              <CardContent>
                <MetricRow
                  label="Propriedades"
                  value={numberFormat.format(data.properties)}
                />
                <MetricRow
                  label="Solicitacoes (total)"
                  value={numberFormat.format(data.serviceRequests.total)}
                />
                <MetricRow
                  label="Ocorrencias (total)"
                  value={numberFormat.format(data.occurrences.total)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Patrulha mecanizada</CardTitle>
              </CardHeader>
              <CardContent>
                <MetricRow
                  label="Horas de maquina"
                  value={numberFormat.format(Number(data.machineHours))}
                />
                <MetricRow
                  label="Custo estimado"
                  value={currencyFormat.format(Number(data.machineCost.estimated))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Programas</CardTitle>
              </CardHeader>
              <CardContent>
                <MetricRow
                  label="Programas ativos"
                  value={numberFormat.format(data.programs)}
                />
                <MetricRow
                  label="Beneficiarios"
                  value={numberFormat.format(data.beneficiaries)}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
