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
import { RequestStatusBadge } from "@/components/request-status-badge";
import { useTenantId } from "@/hooks/use-tenant-id";
import { ApiError, apiFetch } from "@/lib/api-client";
import {
  FINAL_STATUSES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
  type ServiceRequest,
  type ServiceRequestHistoryEntry,
  type ServiceRequestStatus,
} from "@/lib/service-request-types";
import { useAuthStore } from "@/stores/auth-store";

interface ServiceRequestDetailDialogProps {
  requestId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function ServiceRequestDetailDialog({
  requestId,
  onOpenChange,
}: ServiceRequestDetailDialogProps) {
  return (
    <Dialog open={requestId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitacao</DialogTitle>
        </DialogHeader>
        {requestId && <ServiceRequestDetailContent id={requestId} />}
      </DialogContent>
    </Dialog>
  );
}

function ServiceRequestDetailContent({ id }: { id: string }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<ServiceRequestStatus | "">("");
  const [comment, setComment] = useState("");

  const requestQuery = useQuery({
    queryKey: ["service-request", id],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<ServiceRequest>(`/service-requests/${id}`, {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const historyQuery = useQuery({
    queryKey: ["service-request-history", id],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<ServiceRequestHistoryEntry[]>(`/service-requests/${id}/history`, {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: () =>
      apiFetch<ServiceRequest>(`/service-requests/${id}/status`, {
        method: "PATCH",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify({
          status: nextStatus,
          comment: comment || undefined,
        }),
      }),
    onSuccess: () => {
      setNextStatus("");
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["service-request", id] });
      queryClient.invalidateQueries({ queryKey: ["service-request-history", id] });
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao mudar status.");
    },
  });

  const request = requestQuery.data;
  const isFinal = request ? FINAL_STATUSES.includes(request.status) : false;

  function handleStatusSubmit(event: FormEvent) {
    event.preventDefault();
    if (nextStatus) statusMutation.mutate();
  }

  return (
    <div className="flex flex-col gap-5">
      {requestQuery.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {request && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-card-foreground">{request.protocol}</p>
            <RequestStatusBadge status={request.status} />
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">Produtor: </span>
              {request.producer?.name ?? "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Secretaria: </span>
              {request.department?.name ?? "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Tipo de servico: </span>
              {request.serviceType?.name ?? "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Prioridade: </span>
              {PRIORITY_LABELS[request.priority]}
            </p>
            <p>
              <span className="text-muted-foreground">Descricao: </span>
              {request.description}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <p className="text-sm font-medium text-card-foreground">Mudar status</p>
        {isFinal ? (
          <p className="text-sm text-muted-foreground">
            Esta solicitacao ja esta em um status final.
          </p>
        ) : (
          <form onSubmit={handleStatusSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nextStatus">Novo status</Label>
              <select
                id="nextStatus"
                required
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as ServiceRequestStatus)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">Selecione...</option>
                {STATUS_ORDER.filter((s) => s !== request?.status).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="comment">Comentario (opcional)</Label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-16 rounded-lg border border-input bg-transparent p-2.5 text-sm"
              />
            </div>
            <Button type="submit" disabled={!nextStatus || statusMutation.isPending} className="self-start">
              {statusMutation.isPending ? "Salvando..." : "Atualizar status"}
            </Button>
          </form>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <p className="text-sm font-medium text-card-foreground">Historico</p>
        <ol className="flex flex-col gap-4">
          {historyQuery.data?.map((entry) => (
            <li key={entry.id} className="flex gap-3 text-sm">
              <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
              <div>
                <p className="font-medium text-card-foreground">
                  {entry.previousStatus ? (
                    <>
                      {STATUS_LABELS[entry.previousStatus]} {"->"}{" "}
                      {STATUS_LABELS[entry.newStatus]}
                    </>
                  ) : (
                    <>Criada como {STATUS_LABELS[entry.newStatus]}</>
                  )}
                </p>
                {entry.comment && (
                  <p className="text-muted-foreground">{entry.comment}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString("pt-BR")}
                  {entry.user && ` - ${entry.user.name}`}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
