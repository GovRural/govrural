"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewServiceRequestDialog } from "@/components/new-service-request-dialog";
import { RequestStatusBadge } from "@/components/request-status-badge";
import { ServiceRequestDetailDialog } from "@/components/service-request-detail-dialog";
import { useTenantId } from "@/hooks/use-tenant-id";
import { apiFetch } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/producer-types";
import {
  STATUS_ORDER,
  STATUS_LABELS,
  type ServiceRequest,
  type ServiceRequestStatus,
} from "@/lib/service-request-types";
import { canManage } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";

export default function ServiceRequestsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role);
  const municipalityId = useTenantId();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ServiceRequestStatus | "">("");
  const [page, setPage] = useState(1);
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["service-requests", municipalityId, search, status, page],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<PaginatedResponse<ServiceRequest>>(
        `/service-requests?page=${page}&limit=20${
          search ? `&search=${encodeURIComponent(search)}` : ""
        }${status ? `&status=${status}` : ""}`,
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
          <h1 className="text-2xl font-semibold text-foreground">Solicitacoes</h1>
          <p className="text-sm text-muted-foreground">
            {query.data?.total ?? 0} solicitacoes de servico
          </p>
        </div>
        {canManage(role) && (
          <Button onClick={() => setNewOpen(true)}>Nova solicitacao</Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por protocolo ou descricao..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ServiceRequestStatus | "");
            setPage(1);
          }}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">Todos os status</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {query.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {query.isError && <p className="text-destructive">Erro ao carregar solicitacoes.</p>}
      {query.data?.data.length === 0 && (
        <p className="text-muted-foreground">Nenhuma solicitacao encontrada.</p>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Protocolo</th>
              <th className="p-3 font-medium">Produtor</th>
              <th className="p-3 font-medium">Tipo de servico</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {query.data?.data.map((request) => (
              <tr
                key={request.id}
                onClick={() => setSelectedId(request.id)}
                className="cursor-pointer border-t border-border transition-colors hover:bg-accent/50"
              >
                <td className="p-3 font-medium text-card-foreground">
                  {request.protocol}
                </td>
                <td className="p-3 text-muted-foreground">
                  {request.producer?.name ?? "-"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {request.serviceType?.name ?? "-"}
                </td>
                <td className="p-3">
                  <RequestStatusBadge status={request.status} />
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

      <NewServiceRequestDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => setSelectedId(id)}
      />
      <ServiceRequestDetailDialog
        requestId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}
