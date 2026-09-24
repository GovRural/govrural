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
import type { Program } from "@/lib/program-types";
import { useAuthStore } from "@/stores/auth-store";

interface NewProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

export function NewProgramDialog({
  open,
  onOpenChange,
  onCreated,
}: NewProgramDialogProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [eligibilityRules, setEligibilityRules] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<Program>("/programs", {
        method: "POST",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify(
          cleanPayload({
            name,
            description,
            startDate: startDate ? new Date(startDate).toISOString() : "",
            endDate: endDate ? new Date(endDate).toISOString() : "",
            budget: budget ? Number(budget) : "",
            eligibilityRules,
          }),
        ),
      }),
    onSuccess: (program) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setBudget("");
      setEligibilityRules("");
      onOpenChange(false);
      onCreated?.(program.id);
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao criar programa.");
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
          <DialogTitle>Novo programa</DialogTitle>
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
              placeholder="Programa de Calcario"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descricao (opcional)</Label>
            <textarea
              id="description"
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20 rounded-lg border border-input bg-transparent p-2.5 text-sm"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="startDate">Inicio (opcional)</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="endDate">Fim (opcional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="budget">Orcamento (opcional)</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="eligibilityRules">Regras de elegibilidade (opcional)</Label>
            <textarea
              id="eligibilityRules"
              maxLength={4000}
              value={eligibilityRules}
              onChange={(e) => setEligibilityRules(e.target.value)}
              className="min-h-20 rounded-lg border border-input bg-transparent p-2.5 text-sm"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Criando..." : "Criar programa"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
