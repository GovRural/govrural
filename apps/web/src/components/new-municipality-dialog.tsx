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
import { ApiError, apiFetch } from "@/lib/api-client";
import { cleanPayload } from "@/lib/clean-payload";
import type { Municipality } from "@/lib/municipality-types";
import { useAuthStore } from "@/stores/auth-store";

interface NewMunicipalityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

export function NewMunicipalityDialog({
  open,
  onOpenChange,
  onCreated,
}: NewMunicipalityDialogProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [ibgeCode, setIbgeCode] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<Municipality>("/municipalities", {
        method: "POST",
        accessToken: accessToken!,
        body: JSON.stringify(
          cleanPayload({ name, state: state.toUpperCase(), ibgeCode, cnpj, phone, email }),
        ),
      }),
    onSuccess: (municipality) => {
      queryClient.invalidateQueries({ queryKey: ["municipalities"] });
      queryClient.invalidateQueries({ queryKey: ["municipalities-selector"] });
      setName("");
      setState("");
      setIbgeCode("");
      setCnpj("");
      setPhone("");
      setEmail("");
      onOpenChange(false);
      onCreated?.(municipality.id);
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao criar municipio.");
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
          <DialogTitle>Novo municipio</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              required
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Prefeitura de..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="state">UF</Label>
            <Input
              id="state"
              required
              maxLength={2}
              minLength={2}
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase())}
              placeholder="SP"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ibgeCode">Codigo IBGE (opcional)</Label>
            <Input id="ibgeCode" value={ibgeCode} onChange={(e) => setIbgeCode(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cnpj">CNPJ (opcional)</Label>
            <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefone (opcional)</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail (opcional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Criando..." : "Criar municipio"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
