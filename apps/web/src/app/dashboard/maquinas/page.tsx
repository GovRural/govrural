"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MachineStatusBadge } from "@/components/machine-status-badge";
import { NewMachineDialog } from "@/components/new-machine-dialog";
import { useTenantId } from "@/hooks/use-tenant-id";
import { apiFetch } from "@/lib/api-client";
import {
  MACHINE_STATUS_LABELS,
  type Machine,
  type MachineStatus,
} from "@/lib/machine-types";
import type { PaginatedResponse } from "@/lib/producer-types";
import { canAdminister } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";

export default function MachinesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Machine | null>(null);

  const query = useQuery({
    queryKey: ["machines", municipalityId],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<PaginatedResponse<Machine>>("/machines?limit=100", {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: (payload: { id: string; status: MachineStatus }) =>
      apiFetch<Machine>(`/machines/${payload.id}`, {
        method: "PATCH",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify({ status: payload.status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/machines/${id}`, {
        method: "DELETE",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
    },
  });

  if (!municipalityId) {
    return (
      <div className="p-6 text-muted-foreground">
        Selecione um municipio no topo da tela.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Patrulha mecanizada
          </h1>
          <p className="text-sm text-muted-foreground">
            Maquinas e equipamentos disponiveis para servicos rurais
          </p>
        </div>
        {canAdminister(role) && (
          <Button onClick={() => setNewOpen(true)}>Nova maquina</Button>
        )}
      </div>

      {query.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {query.data?.data.length === 0 && (
        <p className="text-muted-foreground">Nenhuma maquina cadastrada.</p>
      )}

      <div className="flex flex-col gap-2">
        {query.data?.data.map((machine) => (
          <div
            key={machine.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div>
              <p className="font-medium text-card-foreground">{machine.name}</p>
              <p className="text-sm text-muted-foreground">
                {machine.type}
                {machine.plate ? ` - ${machine.plate}` : ""} - R${" "}
                {Number(machine.hourlyCost).toFixed(2)}/h
              </p>
            </div>
            <div className="flex items-center gap-3">
              <MachineStatusBadge status={machine.status} />
              {canAdminister(role) && (
                <>
                  <select
                    value={machine.status}
                    onChange={(e) =>
                      statusMutation.mutate({
                        id: machine.id,
                        status: e.target.value as MachineStatus,
                      })
                    }
                    className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  >
                    {Object.entries(MACHINE_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(machine)}
                  >
                    Excluir
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <NewMachineDialog open={newOpen} onOpenChange={setNewOpen} />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir maquina"
        description={
          deleteTarget ? `Excluir a maquina "${deleteTarget.name}"? Essa acao nao pode ser desfeita.` : undefined
        }
        confirmLabel="Excluir"
        confirming={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
