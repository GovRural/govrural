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
import { NewUserDialog } from "@/components/new-user-dialog";
import { StatusBadge } from "@/components/status-badge";
import { ApiError, apiFetch } from "@/lib/api-client";
import { cleanPayload } from "@/lib/clean-payload";
import type { Municipality } from "@/lib/municipality-types";
import { useAuthStore } from "@/stores/auth-store";

interface MunicipalityDetailDialogProps {
  municipalityId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function MunicipalityDetailDialog({
  municipalityId,
  onOpenChange,
}: MunicipalityDetailDialogProps) {
  return (
    <Dialog open={municipalityId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Municipio</DialogTitle>
        </DialogHeader>
        {municipalityId && <MunicipalityDetailContent id={municipalityId} />}
      </DialogContent>
    </Dialog>
  );
}

function MunicipalityDetailContent({ id }: { id: string }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [newAdminOpen, setNewAdminOpen] = useState(false);

  const query = useQuery({
    queryKey: ["municipality", id],
    enabled: Boolean(accessToken),
    queryFn: () =>
      apiFetch<Municipality>(`/municipalities/${id}`, { accessToken: accessToken! }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["municipality", id] });
    queryClient.invalidateQueries({ queryKey: ["municipalities"] });
    queryClient.invalidateQueries({ queryKey: ["municipalities-selector"] });
  };

  const updateMutation = useMutation({
    mutationFn: (values: { name: string; phone: string; email: string }) =>
      apiFetch<Municipality>(`/municipalities/${id}`, {
        method: "PATCH",
        accessToken: accessToken!,
        body: JSON.stringify(cleanPayload(values)),
      }),
    onSuccess: invalidate,
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar municipio.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: "ACTIVE" | "INACTIVE") =>
      apiFetch<Municipality>(`/municipalities/${id}`, {
        method: "PATCH",
        accessToken: accessToken!,
        body: JSON.stringify({ status }),
      }),
    onSuccess: invalidate,
  });

  const municipality = query.data;

  return (
    <div className="flex flex-col gap-4">
      {query.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {municipality && (
        <>
          <MunicipalityEditForm
            municipality={municipality}
            onSubmit={(values) => updateMutation.mutate(values)}
            submitting={updateMutation.isPending}
            onToggleStatus={() =>
              statusMutation.mutate(municipality.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")
            }
            togglingStatus={statusMutation.isPending}
          />

          <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-card-foreground">Administrador municipal</p>
            <p className="text-sm text-muted-foreground">
              Crie o primeiro usuario administrador para que a prefeitura acesse o sistema.
            </p>
            <Button
              variant="outline"
              className="self-start"
              onClick={() => setNewAdminOpen(true)}
            >
              Criar administrador municipal
            </Button>
          </div>

          <NewUserDialog
            open={newAdminOpen}
            onOpenChange={setNewAdminOpen}
            defaultRole="MUNICIPAL_ADMIN"
            defaultMunicipalityId={municipality.id}
          />
        </>
      )}
    </div>
  );
}

function MunicipalityEditForm({
  municipality,
  onSubmit,
  submitting,
  onToggleStatus,
  togglingStatus,
}: {
  municipality: Municipality;
  onSubmit: (values: { name: string; phone: string; email: string }) => void;
  submitting: boolean;
  onToggleStatus: () => void;
  togglingStatus: boolean;
}) {
  const [name, setName] = useState(municipality.name);
  const [phone, setPhone] = useState(municipality.phone ?? "");
  const [email, setEmail] = useState(municipality.email ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ name, phone, email });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-card-foreground">Dados do municipio</p>
        <StatusBadge status={municipality.status} />
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar alteracoes"}
          </Button>
          <Button type="button" variant="outline" disabled={togglingStatus} onClick={onToggleStatus}>
            {municipality.status === "ACTIVE" ? "Desativar" : "Ativar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
