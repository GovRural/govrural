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
import { StatusBadge } from "@/components/status-badge";
import { ProgramBeneficiaryStatusBadge } from "@/components/program-beneficiary-status-badge";
import { useTenantId } from "@/hooks/use-tenant-id";
import { ApiError, apiFetch } from "@/lib/api-client";
import { cleanPayload } from "@/lib/clean-payload";
import type { PaginatedResponse, Producer } from "@/lib/producer-types";
import type { RuralProperty } from "@/lib/property-types";
import type { Program, ProgramStatus } from "@/lib/program-types";
import {
  PROGRAM_BENEFICIARY_MANAGE_ROLES,
  PROGRAM_BENEFICIARY_STATUS_LABELS,
  PROGRAM_BENEFICIARY_STATUS_ORDER,
  type ProgramBeneficiary,
  type ProgramBeneficiaryStatus,
} from "@/lib/program-beneficiary-types";
import { canAdminister, hasAnyRole } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";

interface ProgramDetailDialogProps {
  programId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function ProgramDetailDialog({
  programId,
  onOpenChange,
}: ProgramDetailDialogProps) {
  return (
    <Dialog open={programId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Programa</DialogTitle>
        </DialogHeader>
        {programId && <ProgramDetailContent id={programId} />}
      </DialogContent>
    </Dialog>
  );
}

function ProgramDetailContent({ id }: { id: string }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [producerId, setProducerId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [benefitType, setBenefitType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [value, setValue] = useState("");

  const programQuery = useQuery({
    queryKey: ["program", id],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<Program>(`/programs/${id}`, {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const beneficiariesQuery = useQuery({
    queryKey: ["program-beneficiaries", id],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<ProgramBeneficiary[]>(`/programs/${id}/beneficiaries`, {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const producersQuery = useQuery({
    queryKey: ["producers-options", municipalityId],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<PaginatedResponse<Producer>>("/producers?limit=100", {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const propertiesQuery = useQuery({
    queryKey: ["properties-options", municipalityId],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<PaginatedResponse<RuralProperty>>("/properties?limit=100", {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: ProgramStatus) =>
      apiFetch<Program>(`/programs/${id}`, {
        method: "PATCH",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program", id] });
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });

  const createBeneficiaryMutation = useMutation({
    mutationFn: () =>
      apiFetch<ProgramBeneficiary>(`/programs/${id}/beneficiaries`, {
        method: "POST",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify(
          cleanPayload({
            producerId,
            propertyId,
            benefitType,
            quantity: quantity ? Number(quantity) : "",
            unit,
            value: value ? Number(value) : "",
          }),
        ),
      }),
    onSuccess: () => {
      setProducerId("");
      setPropertyId("");
      setBenefitType("");
      setQuantity("");
      setUnit("");
      setValue("");
      queryClient.invalidateQueries({ queryKey: ["program-beneficiaries", id] });
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao adicionar beneficiario.");
    },
  });

  const beneficiaryStatusMutation = useMutation({
    mutationFn: (payload: { beneficiaryId: string; status: ProgramBeneficiaryStatus }) =>
      apiFetch<ProgramBeneficiary>(
        `/programs/${id}/beneficiaries/${payload.beneficiaryId}`,
        {
          method: "PATCH",
          accessToken: accessToken!,
          municipalityId: municipalityId!,
          body: JSON.stringify({ status: payload.status }),
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-beneficiaries", id] });
    },
  });

  const program = programQuery.data;

  function handleCreateBeneficiary(event: FormEvent) {
    event.preventDefault();
    createBeneficiaryMutation.mutate();
  }

  return (
    <div className="flex flex-col gap-5">
      {programQuery.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {program && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-card-foreground">{program.name}</p>
            <StatusBadge status={program.status} />
          </div>
          <div className="flex flex-col gap-2 text-sm">
            {program.description && (
              <p>
                <span className="text-muted-foreground">Descricao: </span>
                {program.description}
              </p>
            )}
            {program.budget && (
              <p>
                <span className="text-muted-foreground">Orcamento: </span>R${" "}
                {Number(program.budget).toFixed(2)}
              </p>
            )}
            {program.eligibilityRules && (
              <p>
                <span className="text-muted-foreground">Regras de elegibilidade: </span>
                {program.eligibilityRules}
              </p>
            )}
          </div>
          {canAdminister(role) && (
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() =>
                statusMutation.mutate(program.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")
              }
            >
              {program.status === "ACTIVE" ? "Desativar programa" : "Ativar programa"}
            </Button>
          )}
        </div>
      )}

      {hasAnyRole(role, PROGRAM_BENEFICIARY_MANAGE_ROLES) && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <p className="text-sm font-medium text-card-foreground">Adicionar beneficiario</p>
          <form onSubmit={handleCreateBeneficiary} className="flex flex-col gap-3">
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
              <Label htmlFor="benefitType">Tipo de beneficio</Label>
              <Input
                id="benefitType"
                required
                maxLength={150}
                value={benefitType}
                onChange={(e) => setBenefitType(e.target.value)}
                placeholder="Calcario, sementes, mudas..."
              />
            </div>
            <div className="flex gap-4">
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor="quantity">Quantidade (opcional)</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor="unit">Unidade (opcional)</Label>
                <Input
                  id="unit"
                  maxLength={30}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="kg, ton, un..."
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="value">Valor (opcional)</Label>
              <Input
                id="value"
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={createBeneficiaryMutation.isPending}
              className="self-start"
            >
              {createBeneficiaryMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-card-foreground">Beneficiarios</p>
        {beneficiariesQuery.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum beneficiario cadastrado.</p>
        )}
        {beneficiariesQuery.data?.map((beneficiary) => (
          <div
            key={beneficiary.id}
            className="flex items-center justify-between rounded-lg border border-border p-3"
          >
            <div>
              <p className="text-sm font-medium text-card-foreground">
                {beneficiary.producer?.name ?? "-"}
              </p>
              <p className="text-sm text-muted-foreground">
                {beneficiary.benefitType}
                {beneficiary.quantity ? ` - ${beneficiary.quantity} ${beneficiary.unit ?? ""}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ProgramBeneficiaryStatusBadge status={beneficiary.status} />
              {hasAnyRole(role, PROGRAM_BENEFICIARY_MANAGE_ROLES) && (
                <select
                  value={beneficiary.status}
                  onChange={(e) =>
                    beneficiaryStatusMutation.mutate({
                      beneficiaryId: beneficiary.id,
                      status: e.target.value as ProgramBeneficiaryStatus,
                    })
                  }
                  className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  {PROGRAM_BENEFICIARY_STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {PROGRAM_BENEFICIARY_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
