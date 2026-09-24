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
import { useTenantId } from "@/hooks/use-tenant-id";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { Department } from "@/lib/department-types";
import type { PaginatedResponse, Producer } from "@/lib/producer-types";
import type { RuralProperty } from "@/lib/property-types";
import type {
  ServiceRequest,
  ServiceRequestPriority,
} from "@/lib/service-request-types";
import { PRIORITY_LABELS } from "@/lib/service-request-types";
import type { ServiceType } from "@/lib/service-type-types";
import { useAuthStore } from "@/stores/auth-store";

interface NewServiceRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

export function NewServiceRequestDialog({
  open,
  onOpenChange,
  onCreated,
}: NewServiceRequestDialogProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [producerId, setProducerId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [priority, setPriority] = useState<ServiceRequestPriority>("MEDIUM");
  const [description, setDescription] = useState("");

  const producersQuery = useQuery({
    queryKey: ["producers-options", municipalityId],
    enabled: Boolean(accessToken && municipalityId && open),
    queryFn: () =>
      apiFetch<PaginatedResponse<Producer>>("/producers?limit=100", {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const propertiesQuery = useQuery({
    queryKey: ["properties-options", municipalityId],
    enabled: Boolean(accessToken && municipalityId && open),
    queryFn: () =>
      apiFetch<PaginatedResponse<RuralProperty>>("/properties?limit=100", {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments", municipalityId],
    enabled: Boolean(accessToken && municipalityId && open),
    queryFn: () =>
      apiFetch<Department[]>("/departments", {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const serviceTypesQuery = useQuery({
    queryKey: ["service-types", municipalityId],
    enabled: Boolean(accessToken && municipalityId && open),
    queryFn: () =>
      apiFetch<ServiceType[]>("/service-types", {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<ServiceRequest>("/service-requests", {
        method: "POST",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify({
          producerId,
          propertyId: propertyId || undefined,
          departmentId,
          serviceTypeId,
          priority,
          description,
        }),
      }),
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      setProducerId("");
      setPropertyId("");
      setDepartmentId("");
      setServiceTypeId("");
      setPriority("MEDIUM");
      setDescription("");
      onOpenChange(false);
      onCreated?.(request.id);
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao criar solicitacao.");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova solicitacao</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="producer">Produtor</Label>
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
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="property">Propriedade (opcional)</Label>
            <select
              id="property"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="">Nenhuma</option>
              {propertiesQuery.data?.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="department">Secretaria</Label>
            <select
              id="department"
              required
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="">Selecione...</option>
              {departmentsQuery.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="serviceType">Tipo de servico</Label>
            <select
              id="serviceType"
              required
              value={serviceTypeId}
              onChange={(e) => setServiceTypeId(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="">Selecione...</option>
              {serviceTypesQuery.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="priority">Prioridade</Label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as ServiceRequestPriority)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descricao</Label>
            <textarea
              id="description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24 rounded-lg border border-input bg-transparent p-2.5 text-sm"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Criando..." : "Criar solicitacao"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
