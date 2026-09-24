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
import { cleanPayload } from "@/lib/clean-payload";
import type { Machine } from "@/lib/machine-types";
import type { MachineService } from "@/lib/machine-service-types";
import type { PaginatedResponse, Producer } from "@/lib/producer-types";
import type { RuralProperty } from "@/lib/property-types";
import { useAuthStore } from "@/stores/auth-store";

interface NewMachineServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

export function NewMachineServiceDialog({
  open,
  onOpenChange,
  onCreated,
}: NewMachineServiceDialogProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [machineId, setMachineId] = useState("");
  const [producerId, setProducerId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [notes, setNotes] = useState("");

  const machinesQuery = useQuery({
    queryKey: ["machines-options", municipalityId],
    enabled: Boolean(accessToken && municipalityId && open),
    queryFn: () =>
      apiFetch<PaginatedResponse<Machine>>("/machines?limit=100", {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

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

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<MachineService>("/machine-services", {
        method: "POST",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify(
          cleanPayload({
            machineId,
            producerId,
            propertyId,
            serviceType,
            scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : "",
            estimatedCost: estimatedCost ? Number(estimatedCost) : "",
            notes,
          }),
        ),
      }),
    onSuccess: (service) => {
      queryClient.invalidateQueries({ queryKey: ["machine-services"] });
      setMachineId("");
      setProducerId("");
      setPropertyId("");
      setServiceType("");
      setScheduledDate("");
      setEstimatedCost("");
      setNotes("");
      onOpenChange(false);
      onCreated?.(service.id);
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao agendar servico.");
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
          <DialogTitle>Agendar servico de maquina</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="machine">Maquina</Label>
            <select
              id="machine"
              required
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="">Selecione...</option>
              {machinesQuery.data?.data.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

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
            <Label htmlFor="serviceType">Tipo de servico</Label>
            <Input
              id="serviceType"
              required
              maxLength={150}
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="Patrolamento, aração..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="scheduledDate">Data agendada (opcional)</Label>
            <Input
              id="scheduledDate"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="estimatedCost">Custo estimado (opcional)</Label>
            <Input
              id="estimatedCost"
              type="number"
              min="0"
              step="0.01"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Observacoes (opcional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20 rounded-lg border border-input bg-transparent p-2.5 text-sm"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Agendando..." : "Agendar servico"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
