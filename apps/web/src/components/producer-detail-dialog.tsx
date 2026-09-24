"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NewUserDialog } from "@/components/new-user-dialog";
import { ProducerForm, type ProducerFormValues } from "@/components/producer-form";
import { useTenantId } from "@/hooks/use-tenant-id";
import { ApiError, apiFetch } from "@/lib/api-client";
import { cleanPayload } from "@/lib/clean-payload";
import type { Producer } from "@/lib/producer-types";
import { canAdminister } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";

interface ProducerDetailDialogProps {
  producerId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function ProducerDetailDialog({
  producerId,
  onOpenChange,
}: ProducerDetailDialogProps) {
  return (
    <Dialog open={producerId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar produtor</DialogTitle>
        </DialogHeader>
        {producerId && (
          <ProducerDetailContent id={producerId} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProducerDetailContent({ id, onClose }: { id: string; onClose: () => void }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role);
  const municipalityId = useTenantId();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [newUserOpen, setNewUserOpen] = useState(false);

  const query = useQuery({
    queryKey: ["producer", id],
    enabled: Boolean(accessToken && municipalityId),
    queryFn: () =>
      apiFetch<Producer>(`/producers/${id}`, {
        accessToken: accessToken!,
        municipalityId: municipalityId!,
      }),
  });

  const mutation = useMutation({
    mutationFn: (values: ProducerFormValues) =>
      apiFetch<Producer>(`/producers/${id}`, {
        method: "PATCH",
        accessToken: accessToken!,
        municipalityId: municipalityId!,
        body: JSON.stringify(cleanPayload(values)),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["producers"] });
      queryClient.invalidateQueries({ queryKey: ["producer", id] });
      onClose();
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar produtor.");
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {query.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {query.data && (
        <ProducerForm
          bare
          initial={query.data}
          onSubmit={(values) => mutation.mutate(values)}
          submitting={mutation.isPending}
          submitLabel="Salvar alteracoes"
        />
      )}

      {query.data && canAdminister(role) && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <p className="text-sm font-medium text-card-foreground">
            Acesso ao portal do produtor
          </p>
          <p className="text-sm text-muted-foreground">
            Crie um usuario para que este produtor acesse o portal e
            acompanhe suas solicitacoes e beneficios.
          </p>
          <Button
            variant="outline"
            className="self-start"
            onClick={() => setNewUserOpen(true)}
          >
            Criar acesso ao portal
          </Button>
        </div>
      )}

      <NewUserDialog
        open={newUserOpen}
        onOpenChange={setNewUserOpen}
        defaultRole="PRODUCER"
        defaultProducerId={id}
        defaultMunicipalityId={municipalityId ?? undefined}
      />
    </div>
  );
}
