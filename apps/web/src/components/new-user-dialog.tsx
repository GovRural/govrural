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
import { ApiError, apiFetch } from "@/lib/api-client";
import { cleanPayload } from "@/lib/clean-payload";
import type { Department } from "@/lib/department-types";
import type { Municipality } from "@/lib/municipality-types";
import type { PaginatedResponse, Producer } from "@/lib/producer-types";
import {
  MUNICIPAL_ADMIN_CREATABLE_ROLES,
  USER_ROLE_LABELS,
  type AppUser,
  type UserRole,
} from "@/lib/user-types";
import { useAuthStore } from "@/stores/auth-store";

const ALL_ROLES = Object.keys(USER_ROLE_LABELS) as UserRole[];

interface NewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRole?: UserRole;
  defaultMunicipalityId?: string;
  defaultProducerId?: string;
  onCreated?: (id: string) => void;
}

export function NewUserDialog({
  open,
  onOpenChange,
  defaultRole,
  defaultMunicipalityId,
  defaultProducerId,
  onCreated,
}: NewUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo usuario</DialogTitle>
        </DialogHeader>

        {open && (
          <NewUserForm
            onOpenChange={onOpenChange}
            defaultRole={defaultRole}
            defaultMunicipalityId={defaultMunicipalityId}
            defaultProducerId={defaultProducerId}
            onCreated={onCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function NewUserForm({
  onOpenChange,
  defaultRole,
  defaultMunicipalityId,
  defaultProducerId,
  onCreated,
}: {
  onOpenChange: (open: boolean) => void;
  defaultRole?: UserRole;
  defaultMunicipalityId?: string;
  defaultProducerId?: string;
  onCreated?: (id: string) => void;
}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const availableRoles = isSuperAdmin ? ALL_ROLES : MUNICIPAL_ADMIN_CREATABLE_ROLES;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(
    defaultRole ?? (isSuperAdmin ? "MUNICIPAL_ADMIN" : "SECRETARY"),
  );
  const [municipalityId, setMunicipalityId] = useState(defaultMunicipalityId ?? "");
  const [departmentId, setDepartmentId] = useState("");
  const [producerId, setProducerId] = useState(defaultProducerId ?? "");
  const [phone, setPhone] = useState("");

  const effectiveMunicipalityId = isSuperAdmin
    ? municipalityId
    : (currentUser?.municipalityId ?? "");

  const municipalitiesQuery = useQuery({
    queryKey: ["municipalities-selector"],
    enabled: Boolean(accessToken && isSuperAdmin),
    queryFn: () =>
      apiFetch<Municipality[]>("/municipalities", { accessToken: accessToken! }),
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments", effectiveMunicipalityId],
    enabled: Boolean(accessToken && effectiveMunicipalityId),
    queryFn: () =>
      apiFetch<Department[]>("/departments", {
        accessToken: accessToken!,
        municipalityId: effectiveMunicipalityId,
      }),
  });

  const producersQuery = useQuery({
    queryKey: ["producers-options", effectiveMunicipalityId],
    enabled: Boolean(accessToken && effectiveMunicipalityId && role === "PRODUCER"),
    queryFn: () =>
      apiFetch<PaginatedResponse<Producer>>("/producers?limit=100", {
        accessToken: accessToken!,
        municipalityId: effectiveMunicipalityId,
      }),
  });

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<AppUser>("/users", {
        method: "POST",
        accessToken: accessToken!,
        body: JSON.stringify(
          cleanPayload({
            name,
            email,
            password,
            role,
            municipalityId: isSuperAdmin ? municipalityId : "",
            departmentId,
            producerId: role === "PRODUCER" ? producerId : "",
            phone,
          }),
        ),
      }),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
      onCreated?.(user.id);
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao criar usuario.");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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

      {isSuperAdmin && role !== "SUPER_ADMIN" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="municipality">Municipio</Label>
          <select
            id="municipality"
            required
            value={municipalityId}
            onChange={(e) => setMunicipalityId(e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">Selecione...</option>
            {municipalitiesQuery.data?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} - {m.state}
              </option>
            ))}
          </select>
        </div>
      )}

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

      {role === "PRODUCER" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="producer">Produtor vinculado</Label>
          <select
            id="producer"
            required
            value={producerId}
            onChange={(e) => setProducerId(e.target.value)}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">Selecione...</option>
            {producersQuery.data?.data.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            O produtor precisa ja estar cadastrado em Produtores.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Telefone (opcional)</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Criando..." : "Criar usuario"}
      </Button>
    </form>
  );
}
