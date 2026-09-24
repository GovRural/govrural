"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MachineServiceDetailDialog } from "@/components/machine-service-detail-dialog";
import { MachineServiceStatusBadge } from "@/components/machine-service-status-badge";
import { NewMachineServiceDialog } from "@/components/new-machine-service-dialog";
import { useTenantId } from "@/hooks/use-tenant-id";
import { apiFetch } from "@/lib/api-client";
import {
  MACHINE_SERVICE_SCHEDULE_ROLES,
  MACHINE_SERVICE_STATUS_LABELS,
  MACHINE_SERVICE_STATUS_ORDER,
  type MachineService,
  type MachineServiceStatus,
} from "@/lib/machine-service-types";
import type { PaginatedResponse } from "@/lib/producer-types";
import { hasAnyRole } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";

export default function MachineServicesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role);
  const municipalityId = useTenantId();
  const [status, setStatus] = useState<MachineServiceStatus | "">("");
  const [page, setPage] = useState(1);
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["machine-services", municipalityId, status, page],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<PaginatedResponse<MachineService>>(
        `/machine-services?page=${page}&limit=20${status ? `&status=${status}` : ""}`,
        { accessToken: accessToken!, municipalityId: municipalityId! },
      ),
  });

  if (!municipalityId) {
    return (
      <div className="p-6 text-muted-foreground">
        Selecione um municipio no topo da tela.
      </div>
    );
  }

  const totalPages = query.data ? Math.ceil(query.data.total / query.data.limit) : 1;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Servicos de maquina
          </h1>
          <p className="text-sm text-muted-foreground">
            {query.data?.total ?? 0} servicos agendados ou executados
          </p>
        </div>
        {hasAnyRole(role, MACHINE_SERVICE_SCHEDULE_ROLES) && (
          <Button onClick={() => setNewOpen(true)}>Agendar servico</Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as MachineServiceStatus | "");
            setPage(1);
          }}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">Todos os status</option>
          {MACHINE_SERVICE_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {MACHINE_SERVICE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {query.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {query.isError && <p className="text-destructive">Erro ao carregar servicos.</p>}
      {query.data?.data.length === 0 && (
        <p className="text-muted-foreground">Nenhum servico encontrado.</p>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Maquina</th>
              <th className="p-3 font-medium">Produtor</th>
              <th className="p-3 font-medium">Servico</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {query.data?.data.map((service) => (
              <tr
                key={service.id}
                onClick={() => setSelectedId(service.id)}
                className="cursor-pointer border-t border-border transition-colors hover:bg-accent/50"
              >
                <td className="p-3 font-medium text-card-foreground">
                  {service.machine?.name ?? "-"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {service.producer?.name ?? "-"}
                </td>
                <td className="p-3 text-muted-foreground">{service.serviceType}</td>
                <td className="p-3">
                  <MachineServiceStatusBadge status={service.status} />
                </td>
                <td className="p-3 text-right text-sm font-medium text-primary">Ver</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {query.data && totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Proxima
          </Button>
        </div>
      )}

      <NewMachineServiceDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => setSelectedId(id)}
      />
      <MachineServiceDetailDialog
        serviceId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}
