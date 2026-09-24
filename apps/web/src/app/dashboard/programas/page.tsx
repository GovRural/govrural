"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewProgramDialog } from "@/components/new-program-dialog";
import { ProgramDetailDialog } from "@/components/program-detail-dialog";
import { StatusBadge } from "@/components/status-badge";
import { useTenantId } from "@/hooks/use-tenant-id";
import { apiFetch } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/producer-types";
import type { Program } from "@/lib/program-types";
import { canAdminister } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";
import { Search } from "lucide-react";

export default function ProgramsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role);
  const municipalityId = useTenantId();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["programs", municipalityId, search, page],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<PaginatedResponse<Program>>(
        `/programs?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`,
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
          <h1 className="text-2xl font-semibold text-foreground">Programas</h1>
          <p className="text-sm text-muted-foreground">
            {query.data?.total ?? 0} programas municipais
          </p>
        </div>
        {canAdminister(role) && (
          <Button onClick={() => setNewOpen(true)}>Novo programa</Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-8"
        />
      </div>

      {query.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {query.data?.data.length === 0 && (
        <p className="text-muted-foreground">Nenhum programa cadastrado.</p>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">Orcamento</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {query.data?.data.map((program) => (
              <tr
                key={program.id}
                onClick={() => setSelectedId(program.id)}
                className="cursor-pointer border-t border-border transition-colors hover:bg-accent/50"
              >
                <td className="p-3 font-medium text-card-foreground">{program.name}</td>
                <td className="p-3 text-muted-foreground">
                  {program.budget ? `R$ ${Number(program.budget).toFixed(2)}` : "-"}
                </td>
                <td className="p-3">
                  <StatusBadge status={program.status} />
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

      <NewProgramDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => setSelectedId(id)}
      />
      <ProgramDetailDialog
        programId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}
