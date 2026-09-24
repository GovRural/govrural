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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/status-badge";
import { ApiError, apiFetch } from "@/lib/api-client";
import { cleanPayload } from "@/lib/clean-payload";
import type { Department } from "@/lib/department-types";
import {
  MUNICIPAL_ADMIN_CREATABLE_ROLES,
  USER_ROLE_LABELS,
  type AppUser,
  type UserRole,
} from "@/lib/user-types";
import { useAuthStore } from "@/stores/auth-store";

const ALL_ROLES = Object.keys(USER_ROLE_LABELS) as UserRole[];

interface UserDetailDialogProps {
  userId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailDialog({ userId, onOpenChange }: UserDetailDialogProps) {
  return (
    <Dialog open={userId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Usuario</DialogTitle>
        </DialogHeader>
        {userId && (
          <UserDetailContent id={userId} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function UserDetailContent({ id, onClose }: { id: string; onClose: () => void }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const query = useQuery({
    queryKey: ["user", id],
    enabled: Boolean(accessToken),
    queryFn: () => apiFetch<AppUser>(`/users/${id}`, { accessToken: accessToken! }),
  });

  const updateMutation = useMutation({
    mutationFn: (values: {
      name: string;
      role: UserRole;
      phone: string;
      departmentId: string;
    }) =>
      apiFetch<AppUser>(`/users/${id}`, {
        method: "PATCH",
        accessToken: accessToken!,
        body: JSON.stringify(cleanPayload(values)),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar usuario.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: "ACTIVE" | "INACTIVE") =>
      apiFetch<AppUser>(`/users/${id}`, {
        method: "PATCH",
        accessToken: accessToken!,
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      apiFetch<void>(`/users/${id}`, { method: "DELETE", accessToken: accessToken! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao remover usuario.");
    },
  });

  const user = query.data;
  const isSelf = user?.id === currentUser?.id;

  return (
    <div className="flex flex-col gap-4">
      {query.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {user && (
        <UserEditForm
          user={user}
          isSelf={isSelf}
          onSubmit={(values) => updateMutation.mutate(values)}
          submitting={updateMutation.isPending}
          onToggleStatus={() =>
            statusMutation.mutate(user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")
          }
          togglingStatus={statusMutation.isPending}
          onDelete={() => setConfirmDeleteOpen(true)}
          deleting={deleteMutation.isPending}
        />
      )}

      {user && (
        <ConfirmDialog
          open={confirmDeleteOpen}
          onOpenChange={setConfirmDeleteOpen}
          title="Remover acesso"
          description={`Remover o acesso de "${user.name}"? Essa acao nao pode ser desfeita.`}
          confirmLabel="Remover"
          confirming={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate()}
        />
      )}
    </div>
  );
}

function UserEditForm({
  user,
  isSelf,
  onSubmit,
  submitting,
  onToggleStatus,
  togglingStatus,
  onDelete,
  deleting,
}: {
  user: AppUser;
  isSelf: boolean;
  onSubmit: (values: {
    name: string;
    role: UserRole;
    phone: string;
    departmentId: string;
  }) => void;
  submitting: boolean;
  onToggleStatus: () => void;
  togglingStatus: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const availableRoles = isSuperAdmin ? ALL_ROLES : MUNICIPAL_ADMIN_CREATABLE_ROLES;

  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<UserRole>(user.role);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [departmentId, setDepartmentId] = useState(user.departmentId ?? "");

  const departmentsQuery = useQuery({
    queryKey: ["departments", user.municipalityId],
    enabled: Boolean(accessToken && user.municipalityId),
    queryFn: () =>
      apiFetch<Department[]>("/departments", {
        accessToken: accessToken!,
        municipalityId: user.municipalityId!,
      }),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ name, role, phone, departmentId });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-card-foreground">{user.email}</p>
        <StatusBadge status={user.status} />
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="role">Perfil</Label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {USER_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>

        {role !== "SUPER_ADMIN" && role !== "MUNICIPAL_ADMIN" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="department">Secretaria (opcional)</Label>
            <select
              id="department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="">Nenhuma</option>
              {departmentsQuery.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar alteracoes"}
          </Button>
          {!isSelf && (
            <Button type="button" variant="outline" disabled={togglingStatus} onClick={onToggleStatus}>
              {user.status === "ACTIVE" ? "Desativar" : "Ativar"}
            </Button>
          )}
          {!isSelf && (
            <Button type="button" variant="ghost" disabled={deleting} onClick={onDelete}>
              Remover
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
