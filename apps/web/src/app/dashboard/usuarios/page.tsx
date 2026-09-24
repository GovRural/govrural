"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NewUserDialog } from "@/components/new-user-dialog";
import { StatusBadge } from "@/components/status-badge";
import { UserDetailDialog } from "@/components/user-detail-dialog";
import { apiFetch } from "@/lib/api-client";
import { USER_ROLE_LABELS, type AppUser } from "@/lib/user-types";
import { useAuthStore } from "@/stores/auth-store";

export default function UsersPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["users"],
    enabled: Boolean(accessToken),
    queryFn: () => apiFetch<AppUser[]>("/users", { accessToken: accessToken! }),
  });

  const filtered = (query.data ?? []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            {query.data?.length ?? 0} usuarios com acesso ao sistema
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)}>Novo usuario</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {query.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {filtered.length === 0 && !query.isLoading && (
        <p className="text-muted-foreground">Nenhum usuario encontrado.</p>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">E-mail</th>
              <th className="p-3 font-medium">Perfil</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr
                key={user.id}
                onClick={() => setSelectedId(user.id)}
                className="cursor-pointer border-t border-border transition-colors hover:bg-accent/50"
              >
                <td className="p-3 font-medium text-card-foreground">{user.name}</td>
                <td className="p-3 text-muted-foreground">{user.email}</td>
                <td className="p-3 text-muted-foreground">
                  {USER_ROLE_LABELS[user.role]}
                </td>
                <td className="p-3">
                  <StatusBadge status={user.status} />
                </td>
                <td className="p-3 text-right text-sm font-medium text-primary">Ver</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewUserDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => setSelectedId(id)}
      />
      <UserDetailDialog
        userId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}
