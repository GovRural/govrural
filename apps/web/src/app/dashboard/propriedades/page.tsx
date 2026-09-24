"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewPropertyDialog } from "@/components/new-property-dialog";
import { PropertyDetailDialog } from "@/components/property-detail-dialog";
import { StatusBadge } from "@/components/status-badge";
import { useTenantId } from "@/hooks/use-tenant-id";
import { apiFetch } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/producer-types";
import { OWNERSHIP_TYPE_LABELS, type RuralProperty } from "@/lib/property-types";
import { canManage } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";

export default function PropertiesListPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role);
  const municipalityId = useTenantId();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["properties", municipalityId, search, page],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<PaginatedResponse<RuralProperty>>(
        `/properties?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`,
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
          <h1 className="text-2xl font-semibold text-foreground">Propriedades</h1>
          <p className="text-sm text-muted-foreground">
            {query.data?.total ?? 0} propriedades cadastradas
          </p>
        </div>
        {canManage(role) && (
          <Button onClick={() => setNewOpen(true)}>Nova propriedade</Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, matricula ou localidade..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-8"
        />
      </div>

      {query.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {query.isError && <p className="text-destructive">Erro ao carregar propriedades.</p>}
      {query.data?.data.length === 0 && (
        <p className="text-muted-foreground">Nenhuma propriedade encontrada.</p>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">Localidade</th>
              <th className="p-3 font-medium">Area (ha)</th>
              <th className="p-3 font-medium">Posse</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {query.data?.data.map((property) => (
              <tr
                key={property.id}
                onClick={() => setSelectedId(property.id)}
                className="cursor-pointer border-t border-border transition-colors hover:bg-accent/50"
              >
                <td className="p-3 font-medium text-card-foreground">{property.name}</td>
                <td className="p-3 text-muted-foreground">{property.locality ?? "-"}</td>
                <td className="p-3 text-muted-foreground">{property.totalArea}</td>
                <td className="p-3 text-muted-foreground">
                  {OWNERSHIP_TYPE_LABELS[property.ownershipType]}
                </td>
                <td className="p-3">
                  <StatusBadge status={property.status} />
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

      <NewPropertyDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => setSelectedId(id)}
      />
      <PropertyDetailDialog
        propertyId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}
