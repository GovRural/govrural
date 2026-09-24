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
import { MachineServiceStatusBadge } from "@/components/machine-service-status-badge";
import { useTenantId } from "@/hooks/use-tenant-id";
import { ApiError, apiFetch } from "@/lib/api-client";
import { cleanPayload } from "@/lib/clean-payload";
import {
  MACHINE_SERVICE_EXECUTE_ROLES,
  MACHINE_SERVICE_SCHEDULE_ROLES,
  MACHINE_SERVICE_STATUS_LABELS,
  MACHINE_SERVICE_STATUS_ORDER,
  type MachineService,
  type MachineServiceStatus,
} from "@/lib/machine-service-types";
import { hasAnyRole } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";

interface MachineServiceDetailDialogProps {
  serviceId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function MachineServiceDetailDialog({
  serviceId,
  onOpenChange,
}: MachineServiceDetailDialogProps) {
  return (
    <Dialog open={serviceId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Servico de maquina</DialogTitle>
        </DialogHeader>
        {serviceId && <MachineServiceDetailContent id={serviceId} />}
      </DialogContent>
    </Dialog>
  );
}

function MachineServiceDetailContent({ id }: { id: string }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<MachineServiceStatus | "">("");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [initialHourMeter, setInitialHourMeter] = useState("");
  const [finalHourMeter, setFinalHourMeter] = useState("");
  const [fuelConsumption, setFuelConsumption] = useState("");

  const query = useQuery({
    queryKey: ["machine-service", id],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<MachineService>(`/machine-services/${id}`, {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["machine-service", id] });
    queryClient.invalidateQueries({ queryKey: ["machine-services"] });
  };

  const statusMutation = useMutation({
    mutationFn: () =>
      apiFetch<MachineService>(`/machine-services/${id}`, {
        method: "PATCH",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify({ status: nextStatus }),
      }),
    onSuccess: () => {
      setNextStatus("");
      invalidate();
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao mudar status.");
    },
  });

  const executionMutation = useMutation({
    mutationFn: () =>
      apiFetch<MachineService>(`/machine-services/${id}/execution`, {
        method: "PATCH",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify(
          cleanPayload({
            startTime: startTime ? new Date(startTime).toISOString() : "",
            endTime: endTime ? new Date(endTime).toISOString() : "",
            initialHourMeter: initialHourMeter ? Number(initialHourMeter) : "",
            finalHourMeter: finalHourMeter ? Number(finalHourMeter) : "",
            fuelConsumption: fuelConsumption ? Number(fuelConsumption) : "",
          }),
        ),
      }),
    onSuccess: () => {
      invalidate();
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao registrar execucao.");
    },
  });

  const service = query.data;

  function handleStatusSubmit(event: FormEvent) {
    event.preventDefault();
    if (nextStatus) statusMutation.mutate();
  }

  function handleExecutionSubmit(event: FormEvent) {
    event.preventDefault();
    executionMutation.mutate();
  }

  return (
    <div className="flex flex-col gap-5">
      {query.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {service && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-card-foreground">{service.serviceType}</p>
            <MachineServiceStatusBadge status={service.status} />
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">Maquina: </span>
              {service.machine?.name ?? "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Produtor: </span>
              {service.producer?.name ?? "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Operador: </span>
              {service.operator?.name ?? "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Data agendada: </span>
              {service.scheduledDate
                ? new Date(service.scheduledDate).toLocaleDateString("pt-BR")
                : "-"}
            </p>
            {service.totalHours && (
              <p>
                <span className="text-muted-foreground">Total de horas: </span>
                {service.totalHours}
              </p>
            )}
            {service.actualCost && (
              <p>
                <span className="text-muted-foreground">Custo real: </span>R${" "}
                {Number(service.actualCost).toFixed(2)}
              </p>
            )}
            {service.notes && (
              <p>
                <span className="text-muted-foreground">Observacoes: </span>
                {service.notes}
              </p>
            )}
          </div>
        </div>
      )}

      {service && hasAnyRole(role, MACHINE_SERVICE_SCHEDULE_ROLES) && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <p className="text-sm font-medium text-card-foreground">Mudar status</p>
          <form onSubmit={handleStatusSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nextStatus">Novo status</Label>
              <select
                id="nextStatus"
                required
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as MachineServiceStatus)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">Selecione...</option>
                {MACHINE_SERVICE_STATUS_ORDER.filter((s) => s !== service.status).map((s) => (
                  <option key={s} value={s}>
                    {MACHINE_SERVICE_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={!nextStatus || statusMutation.isPending} className="self-start">
              {statusMutation.isPending ? "Salvando..." : "Atualizar status"}
            </Button>
          </form>
        </div>
      )}

      {service && hasAnyRole(role, MACHINE_SERVICE_EXECUTE_ROLES) && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <p className="text-sm font-medium text-card-foreground">Registrar execucao</p>
          <form onSubmit={handleExecutionSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startTime">Inicio</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endTime">Fim</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="initialHourMeter">Horimetro inicial</Label>
              <Input
                id="initialHourMeter"
                type="number"
                min="0"
                step="0.01"
                value={initialHourMeter}
                onChange={(e) => setInitialHourMeter(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="finalHourMeter">Horimetro final</Label>
              <Input
                id="finalHourMeter"
                type="number"
                min="0"
                step="0.01"
                value={finalHourMeter}
                onChange={(e) => setFinalHourMeter(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fuelConsumption">Consumo de combustivel (opcional)</Label>
              <Input
                id="fuelConsumption"
                type="number"
                min="0"
                step="0.01"
                value={fuelConsumption}
                onChange={(e) => setFuelConsumption(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={executionMutation.isPending} className="self-start">
              {executionMutation.isPending ? "Salvando..." : "Salvar execucao"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
