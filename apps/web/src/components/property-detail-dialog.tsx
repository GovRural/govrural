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
import { useTenantId } from "@/hooks/use-tenant-id";
import { ApiError, apiFetch } from "@/lib/api-client";
import { cleanPayload } from "@/lib/clean-payload";
import type { PaginatedResponse, Producer } from "@/lib/producer-types";
import {
  OWNERSHIP_TYPE_LABELS,
  type OwnershipType,
  type ProducerPropertyLink,
  type PropertyStatus,
  type RuralProperty,
} from "@/lib/property-types";
import { canManage } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";

interface PropertyDetailDialogProps {
  propertyId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function PropertyDetailDialog({
  propertyId,
  onOpenChange,
}: PropertyDetailDialogProps) {
  return (
    <Dialog open={propertyId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Propriedade</DialogTitle>
        </DialogHeader>
        {propertyId && <PropertyDetailContent id={propertyId} />}
      </DialogContent>
    </Dialog>
  );
}

function PropertyDetailContent({ id }: { id: string }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [selectedProducerId, setSelectedProducerId] = useState("");

  const propertyQuery = useQuery({
    queryKey: ["property", id],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<RuralProperty>(`/properties/${id}`, {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const linksQuery = useQuery({
    queryKey: ["property-producers", id],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<ProducerPropertyLink[]>(`/properties/${id}/producers`, {
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

  const invalidateProperty = () => {
    queryClient.invalidateQueries({ queryKey: ["property", id] });
    queryClient.invalidateQueries({ queryKey: ["properties"] });
  };

  const updateMutation = useMutation({
    mutationFn: (values: {
      name: string;
      locality: string;
      totalArea: string;
      ownershipType: OwnershipType;
      latitude: string;
      longitude: string;
    }) =>
      apiFetch<RuralProperty>(`/properties/${id}`, {
        method: "PATCH",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify(
          cleanPayload({
            ...values,
            totalArea: values.totalArea ? Number(values.totalArea) : "",
            latitude: values.latitude ? Number(values.latitude) : "",
            longitude: values.longitude ? Number(values.longitude) : "",
          }),
        ),
      }),
    onSuccess: invalidateProperty,
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar propriedade.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: PropertyStatus) =>
      apiFetch<RuralProperty>(`/properties/${id}`, {
        method: "PATCH",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify({ status }),
      }),
    onSuccess: invalidateProperty,
  });

  const linkMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/properties/${id}/producers`, {
        method: "POST",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify({ producerId: selectedProducerId }),
      }),
    onSuccess: () => {
      setSelectedProducerId("");
      queryClient.invalidateQueries({ queryKey: ["property-producers", id] });
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao vincular produtor.");
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (linkId: string) =>
      apiFetch(`/properties/${id}/producers/${linkId}`, {
        method: "DELETE",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-producers", id] });
    },
  });

  function handleLink(event: FormEvent) {
    event.preventDefault();
    if (selectedProducerId) linkMutation.mutate();
  }

  const property = propertyQuery.data;
  const linkedProducerIds = new Set(
    (linksQuery.data ?? []).map((link) => link.producer.id),
  );
  const availableProducers = (producersQuery.data?.data ?? []).filter(
    (p) => !linkedProducerIds.has(p.id),
  );

  return (
    <div className="flex flex-col gap-5">
      {propertyQuery.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {property && (
        <PropertyEditForm
          property={property}
          canEdit={canManage(role)}
          onSubmit={(values) => updateMutation.mutate(values)}
          submitting={updateMutation.isPending}
          onToggleStatus={() =>
            statusMutation.mutate(property.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")
          }
          togglingStatus={statusMutation.isPending}
        />
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <p className="text-sm font-medium text-card-foreground">Produtores vinculados</p>

        {linksQuery.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum produtor vinculado.</p>
        )}
        {linksQuery.data?.map((link) => (
          <div
            key={link.id}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
          >
            <span>
              {link.producer.name}
              {link.isPrimary && (
                <span className="ml-2 text-xs text-muted-foreground">(principal)</span>
              )}
            </span>
            {canManage(role) && (
              <Button variant="ghost" size="sm" onClick={() => unlinkMutation.mutate(link.id)}>
                Remover
              </Button>
            )}
          </div>
        ))}

        {canManage(role) && (
          <form onSubmit={handleLink} className="flex flex-col gap-2 pt-2">
            <Label htmlFor="linkProducer">Vincular produtor</Label>
            <div className="flex gap-2">
              <select
                id="linkProducer"
                value={selectedProducerId}
                onChange={(e) => setSelectedProducerId(e.target.value)}
                className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">Selecione um produtor...</option>
                {availableProducers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={!selectedProducerId || linkMutation.isPending}>
                Vincular
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function PropertyEditForm({
  property,
  canEdit,
  onSubmit,
  submitting,
  onToggleStatus,
  togglingStatus,
}: {
  property: RuralProperty;
  canEdit: boolean;
  onSubmit: (values: {
    name: string;
    locality: string;
    totalArea: string;
    ownershipType: OwnershipType;
    latitude: string;
    longitude: string;
  }) => void;
  submitting: boolean;
  onToggleStatus: () => void;
  togglingStatus: boolean;
}) {
  const [name, setName] = useState(property.name);
  const [locality, setLocality] = useState(property.locality ?? "");
  const [totalArea, setTotalArea] = useState(property.totalArea);
  const [ownershipType, setOwnershipType] = useState(property.ownershipType);
  const [latitude, setLatitude] = useState(property.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(property.longitude?.toString() ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ name, locality, totalArea, ownershipType, latitude, longitude });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-card-foreground">Dados da propriedade</p>
        <StatusBadge status={property.status} />
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            required
            disabled={!canEdit}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="locality">Localidade</Label>
          <Input
            id="locality"
            disabled={!canEdit}
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="totalArea">Area total (ha)</Label>
          <Input
            id="totalArea"
            type="number"
            step="0.01"
            required
            disabled={!canEdit}
            value={totalArea}
            onChange={(e) => setTotalArea(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="ownershipType">Tipo de posse</Label>
          <select
            id="ownershipType"
            disabled={!canEdit}
            value={ownershipType}
            onChange={(e) => setOwnershipType(e.target.value as OwnershipType)}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm disabled:opacity-50"
          >
            {Object.entries(OWNERSHIP_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="0.0001"
            disabled={!canEdit}
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="0.0001"
            disabled={!canEdit}
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />
        </div>

        {canEdit && (
          <div className="flex items-center gap-2 sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar alteracoes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={togglingStatus}
              onClick={onToggleStatus}
            >
              {property.status === "ACTIVE" ? "Desativar" : "Ativar"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
