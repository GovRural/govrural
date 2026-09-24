"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewDepartmentDialog } from "@/components/new-department-dialog";
import { StatusBadge } from "@/components/status-badge";
import { useTenantId } from "@/hooks/use-tenant-id";
import { apiFetch } from "@/lib/api-client";
import type { Department } from "@/lib/department-types";
import { canManage } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";

export default function DepartmentsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const query = useQuery({
    queryKey: ["departments", municipalityId],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<Department[]>("/departments", {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; name?: string; status?: string }) =>
      apiFetch<Department>(`/departments/${payload.id}`, {
        method: "PATCH",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify({
          ...(payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.status !== undefined ? { status: payload.status } : {}),
        }),
      }),
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["departments"] });
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
          <h1 className="text-2xl font-semibold text-foreground">Secretarias</h1>
          <p className="text-sm text-muted-foreground">
            Orgaos municipais que recebem solicitacoes e ocorrencias
          </p>
        </div>
        {canManage(role) && (
          <Button onClick={() => setNewOpen(true)}>Nova secretaria</Button>
        )}
      </div>

      {query.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {query.data?.length === 0 && (
        <p className="text-muted-foreground">Nenhuma secretaria cadastrada.</p>
      )}

      <div className="flex flex-col gap-2">
        {query.data?.map((department) => (
          <div
            key={department.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            {editingId === department.id ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  size="sm"
                  disabled={updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({ id: department.id, name: editName })
                  }
                >
                  Salvar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <div>
                <p className="font-medium text-card-foreground">{department.name}</p>
                {department.description && (
                  <p className="text-sm text-muted-foreground">
                    {department.description}
                  </p>
                )}
              </div>
            )}

            {editingId !== department.id && (
              <div className="flex items-center gap-3">
                <StatusBadge status={department.status} />
                {canManage(role) && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(department.id);
                        setEditName(department.name);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateMutation.mutate({
                          id: department.id,
                          status: department.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                        })
                      }
                    >
                      {department.status === "ACTIVE" ? "Desativar" : "Ativar"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <NewDepartmentDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
