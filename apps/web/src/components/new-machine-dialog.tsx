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
import type { Machine } from "@/lib/machine-types";
import { useAuthStore } from "@/stores/auth-store";

interface NewMachineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewMachineDialog({ open, onOpenChange }: NewMachineDialogProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [brand, setBrand] = useState("");
  const [plate, setPlate] = useState("");
  const [hourlyCost, setHourlyCost] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<Machine>("/machines", {
        method: "POST",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify(
          cleanPayload({ name, type, brand, plate, hourlyCost: Number(hourlyCost) }),
        ),
      }),
    onSuccess: () => {
      setName("");
      setType("");
      setBrand("");
      setPlate("");
      setHourlyCost("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao criar maquina.");
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
          <DialogTitle>Nova maquina</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Trator Massey Ferguson 275"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Tipo</Label>
            <Input
              id="type"
              required
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Trator, patrol, caminhao..."
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="hourlyCost">Custo por hora (R$)</Label>
            <Input
              id="hourlyCost"
              required
              type="number"
              min="0"
              step="0.01"
              value={hourlyCost}
              onChange={(e) => setHourlyCost(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="brand">Marca (opcional)</Label>
            <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="plate">Placa (opcional)</Label>
            <Input id="plate" value={plate} onChange={(e) => setPlate(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="self-start sm:col-span-2"
          >
            {mutation.isPending ? "Criando..." : "Criar maquina"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
