"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MunicipalityDetailDialog } from "@/components/municipality-detail-dialog";
import { NewMunicipalityDialog } from "@/components/new-municipality-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api-client";
import type { Municipality } from "@/lib/municipality-types";
import { useAuthStore } from "@/stores/auth-store";

export default function MunicipalitiesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["municipalities"],
    enabled: Boolean(accessToken),
    queryFn: () =>
      apiFetch<Municipality[]>("/municipalities", { accessToken: accessToken! }),
  });

  const filtered = (query.data ?? []).filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Municipios</h1>
          <p className="text-sm text-muted-foreground">
            {query.data?.length ?? 0} municipios cadastrados na plataforma
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)}>Novo municipio</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {query.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {filtered.length === 0 && !query.isLoading && (
        <p className="text-muted-foreground">Nenhum municipio encontrado.</p>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">UF</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((municipality) => (
              <tr
                key={municipality.id}
                onClick={() => setSelectedId(municipality.id)}
                className="cursor-pointer border-t border-border transition-colors hover:bg-accent/50"
              >
                <td className="p-3 font-medium text-card-foreground">
                  {municipality.name}
                </td>
                <td className="p-3 text-muted-foreground">{municipality.state}</td>
                <td className="p-3">
                  <StatusBadge status={municipality.status} />
                </td>
                <td className="p-3 text-right text-sm font-medium text-primary">Ver</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewMunicipalityDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => setSelectedId(id)}
      />
      <MunicipalityDetailDialog
        municipalityId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}
