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
import type { Department } from "@/lib/department-types";
import {
  OCCURRENCE_PRIORITY_LABELS,
  OCCURRENCE_TYPE_LABELS,
  type OccurrencePriority,
  type OccurrenceType,
  type RuralOccurrence,
} from "@/lib/occurrence-types";
import { useAuthStore } from "@/stores/auth-store";

interface NewOccurrenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

export function NewOccurrenceDialog({
  open,
  onOpenChange,
  onCreated,
}: NewOccurrenceDialogProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<OccurrenceType>("ROAD");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<OccurrencePriority>("MEDIUM");
  const [departmentId, setDepartmentId] = useState("");

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
      apiFetch<RuralOccurrence>("/occurrences", {
        method: "POST",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify(
          cleanPayload({ type, title, description, priority, departmentId }),
        ),
      }),
    onSuccess: (occurrence) => {
      queryClient.invalidateQueries({ queryKey: ["occurrences"] });
      setType("ROAD");
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDepartmentId("");
      onOpenChange(false);
      onCreated?.(occurrence.id);
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao criar ocorrencia.");
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
          <DialogTitle>Nova ocorrencia</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as OccurrenceType)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              {Object.entries(OCCURRENCE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Titulo</Label>
            <Input
              id="title"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descricao</Label>
            <textarea
              id="description"
              required
              maxLength={4000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24 rounded-lg border border-input bg-transparent p-2.5 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="priority">Prioridade</Label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as OccurrencePriority)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              {Object.entries(OCCURRENCE_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="department">Secretaria (opcional)</Label>
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

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Criando..." : "Criar ocorrencia"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
