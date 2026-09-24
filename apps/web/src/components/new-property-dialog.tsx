"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import type { OwnershipType, RuralProperty } from "@/lib/property-types";
import { useAuthStore } from "@/stores/auth-store";

interface NewPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

export function NewPropertyDialog({
  open,
  onOpenChange,
  onCreated,
}: NewPropertyDialogProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [locality, setLocality] = useState("");
  const [totalArea, setTotalArea] = useState("");
  const [ownershipType, setOwnershipType] = useState<OwnershipType>("OWNED");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<RuralProperty>("/properties", {
        method: "POST",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify(
          cleanPayload({
            name,
            locality,
            totalArea: totalArea ? Number(totalArea) : undefined,
            ownershipType,
            latitude: latitude ? Number(latitude) : undefined,
            longitude: longitude ? Number(longitude) : undefined,
          }),
        ),
      }),
    onSuccess: (property) => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setName("");
      setLocality("");
      setTotalArea("");
      setOwnershipType("OWNED");
      setLatitude("");
      setLongitude("");
      onOpenChange(false);
      onCreated?.(property.id);
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao criar propriedade.");
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
          <DialogTitle>Nova propriedade</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="locality">Localidade</Label>
            <Input id="locality" value={locality} onChange={(e) => setLocality(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="totalArea">Area total (ha)</Label>
            <Input
              id="totalArea"
              type="number"
              step="0.01"
              required
              value={totalArea}
              onChange={(e) => setTotalArea(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ownershipType">Tipo de posse</Label>
            <select
              id="ownershipType"
              value={ownershipType}
              onChange={(e) => setOwnershipType(e.target.value as OwnershipType)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="OWNED">Propria</option>
              <option value="LEASED">Arrendada</option>
              <option value="LOAN">Comodato</option>
              <option value="PARTNERSHIP">Parceria</option>
              <option value="POSSESSION">Posse</option>
              <option value="OTHER">Outra</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.0001"
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
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Criando..." : "Criar propriedade"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
