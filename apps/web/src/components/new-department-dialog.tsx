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
import type { Department } from "@/lib/department-types";
import { useAuthStore } from "@/stores/auth-store";

interface NewDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewDepartmentDialog({ open, onOpenChange }: NewDepartmentDialogProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<Department>("/departments", {
        method: "POST",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify({ name, description: description || undefined }),
      }),
    onSuccess: () => {
      setName("");
      setDescription("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao criar secretaria.");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova secretaria</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Secretaria de Agricultura"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descricao (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={mutation.isPending} className="self-start">
            {mutation.isPending ? "Criando..." : "Criar secretaria"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
