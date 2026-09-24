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
import { useTenantId } from "@/hooks/use-tenant-id";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { Department } from "@/lib/department-types";
import type { ServiceType } from "@/lib/service-type-types";
import { useAuthStore } from "@/stores/auth-store";

interface NewServiceTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewServiceTypeDialog({ open, onOpenChange }: NewServiceTypeDialogProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const departmentsQuery = useQuery({
    queryKey: ["departments", municipalityId],
    enabled: Boolean(accessToken && municipalityId && open),
    queryFn: () =>
      apiFetch<Department[]>("/departments", {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<ServiceType>("/service-types", {
        method: "POST",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify({
          name,
          departmentId: departmentId || undefined,
        }),
      }),
    onSuccess: () => {
      setName("");
      setDepartmentId("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["service-types"] });
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao criar tipo de servico.");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo tipo de servico</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Patrolamento de estrada"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="department">Secretaria responsavel</Label>
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={mutation.isPending} className="self-start">
            {mutation.isPending ? "Criando..." : "Criar tipo de servico"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
