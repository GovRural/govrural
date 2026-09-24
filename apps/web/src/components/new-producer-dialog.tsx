"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProducerForm, type ProducerFormValues } from "@/components/producer-form";
import { useTenantId } from "@/hooks/use-tenant-id";
import { ApiError, apiFetch } from "@/lib/api-client";
import { cleanPayload } from "@/lib/clean-payload";
import type { Producer } from "@/lib/producer-types";
import { useAuthStore } from "@/stores/auth-store";

interface NewProducerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

export function NewProducerDialog({
  open,
  onOpenChange,
  onCreated,
}: NewProducerDialogProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (values: ProducerFormValues) =>
      apiFetch<Producer>("/producers", {
        method: "POST",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify(cleanPayload(values)),
      }),
    onSuccess: (producer) => {
      queryClient.invalidateQueries({ queryKey: ["producers"] });
      onOpenChange(false);
      onCreated?.(producer.id);
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao criar produtor.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo produtor</DialogTitle>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <ProducerForm
          bare
          onSubmit={(values) => mutation.mutate(values)}
          submitting={mutation.isPending}
          submitLabel="Criar produtor"
        />
      </DialogContent>
    </Dialog>
  );
}
