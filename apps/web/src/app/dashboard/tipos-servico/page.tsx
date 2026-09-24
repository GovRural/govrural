"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { NewServiceTypeDialog } from "@/components/new-service-type-dialog";
import { useTenantId } from "@/hooks/use-tenant-id";
import { apiFetch } from "@/lib/api-client";
import type { Department } from "@/lib/department-types";
import type { ServiceType } from "@/lib/service-type-types";
import { canManage } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";

export default function ServiceTypesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);

  const query = useQuery({
    queryKey: ["service-types", municipalityId],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<ServiceType[]>("/service-types", {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments", municipalityId],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<Department[]>("/departments", {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: (payload: { id: string; status: string }) =>
      apiFetch<ServiceType>(`/service-types/${payload.id}`, {
        method: "PATCH",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify({ status: payload.status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-types"] });
    },
  });

  if (!municipalityId) {
    return (
      <div className="p-6 text-muted-foreground">
        Selecione um municipio no topo da tela.
      </div>
    );
  }

  const departmentById = new Map(
    (departmentsQuery.data ?? []).map((d) => [d.id, d.name]),
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Tipos de servico
          </h1>
          <p className="text-sm text-muted-foreground">
            Catalogo de servicos que podem ser solicitados (patrolamento,
            calcario, sementes...)
          </p>
        </div>
        {canManage(role) && (
          <Button onClick={() => setNewOpen(true)}>Novo tipo de servico</Button>
        )}
      </div>

      {query.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {query.data?.length === 0 && (
        <p className="text-muted-foreground">Nenhum tipo de servico cadastrado.</p>
      )}

      <div className="flex flex-col gap-2">
        {query.data?.map((serviceType) => (
          <div
            key={serviceType.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div>
              <p className="font-medium text-card-foreground">{serviceType.name}</p>
              <p className="text-sm text-muted-foreground">
                {serviceType.departmentId
                  ? (departmentById.get(serviceType.departmentId) ?? "-")
                  : "Sem secretaria vinculada"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={serviceType.status} />
              {canManage(role) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    toggleMutation.mutate({
                      id: serviceType.id,
                      status: serviceType.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                    })
                  }
                >
                  {serviceType.status === "ACTIVE" ? "Desativar" : "Ativar"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <NewServiceTypeDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
