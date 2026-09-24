"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { OccurrenceStatusBadge } from "@/components/occurrence-status-badge";
import { useTenantId } from "@/hooks/use-tenant-id";
import { ApiError, apiFetch } from "@/lib/api-client";
import {
  OCCURRENCE_MANAGE_ROLES,
  OCCURRENCE_PRIORITY_LABELS,
  OCCURRENCE_STATUS_LABELS,
  OCCURRENCE_STATUS_ORDER,
  OCCURRENCE_TYPE_LABELS,
  type OccurrenceStatus,
  type RuralOccurrence,
} from "@/lib/occurrence-types";
import { hasAnyRole } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";

interface OccurrenceDetailDialogProps {
  occurrenceId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function OccurrenceDetailDialog({
  occurrenceId,
  onOpenChange,
}: OccurrenceDetailDialogProps) {
  return (
    <Dialog open={occurrenceId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ocorrencia</DialogTitle>
        </DialogHeader>
        {occurrenceId && <OccurrenceDetailContent id={occurrenceId} />}
      </DialogContent>
    </Dialog>
  );
}

function OccurrenceDetailContent({ id }: { id: string }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<OccurrenceStatus | "">("");

  const query = useQuery({
    queryKey: ["occurrence", id],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<RuralOccurrence>(`/occurrences/${id}`, {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: () =>
      apiFetch<RuralOccurrence>(`/occurrences/${id}`, {
        method: "PATCH",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify({ status: nextStatus }),
      }),
    onSuccess: () => {
      setNextStatus("");
      queryClient.invalidateQueries({ queryKey: ["occurrence", id] });
      queryClient.invalidateQueries({ queryKey: ["occurrences"] });
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao mudar status.");
    },
  });

  const occurrence = query.data;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (nextStatus) statusMutation.mutate();
  }

  return (
    <div className="flex flex-col gap-5">
      {query.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {occurrence && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-card-foreground">{occurrence.title}</p>
            <OccurrenceStatusBadge status={occurrence.status} />
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">Tipo: </span>
              {OCCURRENCE_TYPE_LABELS[occurrence.type]}
            </p>
            <p>
              <span className="text-muted-foreground">Prioridade: </span>
              {OCCURRENCE_PRIORITY_LABELS[occurrence.priority]}
            </p>
            <p>
              <span className="text-muted-foreground">Secretaria: </span>
              {occurrence.department?.name ?? "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Reportado por: </span>
              {occurrence.reporterUser?.name ?? "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Descricao: </span>
              {occurrence.description}
            </p>
            {occurrence.resolvedAt && (
              <p>
                <span className="text-muted-foreground">Resolvida em: </span>
                {new Date(occurrence.resolvedAt).toLocaleString("pt-BR")}
              </p>
            )}
          </div>
        </div>
      )}

      {occurrence && hasAnyRole(role, OCCURRENCE_MANAGE_ROLES) && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <p className="text-sm font-medium text-card-foreground">Mudar status</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nextStatus">Novo status</Label>
              <select
                id="nextStatus"
                required
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as OccurrenceStatus)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">Selecione...</option>
                {OCCURRENCE_STATUS_ORDER.filter((s) => s !== occurrence.status).map((s) => (
                  <option key={s} value={s}>
                    {OCCURRENCE_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={!nextStatus || statusMutation.isPending} className="self-start">
              {statusMutation.isPending ? "Salvando..." : "Atualizar status"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
