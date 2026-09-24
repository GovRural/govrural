"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RequestStatusBadge } from "@/components/request-status-badge";
import { apiFetch } from "@/lib/api-client";
import type { PortalServiceRequest } from "@/lib/portal-types";
import { useAuthStore } from "@/stores/auth-store";

interface Department {
  id: string;
  name: string;
}
interface ServiceType {
  id: string;
  name: string;
}

export default function PortalServiceRequestsPage() {
  const router = useRouter();
  const { accessToken, user, hasHydrated } = useAuthStore();
  const queryClient = useQueryClient();
  const [departmentId, setDepartmentId] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.replace("/login");
  }, [hasHydrated, user, router]);

  const requestsQuery = useQuery({
    queryKey: ["portal-service-requests"],
    enabled: Boolean(accessToken),
    queryFn: () =>
      apiFetch<PortalServiceRequest[]>("/portal/service-requests", {
        accessToken: accessToken!,
      }),
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    enabled: Boolean(accessToken),
    queryFn: () =>
      apiFetch<Department[]>("/departments", { accessToken: accessToken! }),
  });

  const serviceTypesQuery = useQuery({
    queryKey: ["service-types"],
    enabled: Boolean(accessToken),
    queryFn: () =>
      apiFetch<ServiceType[]>("/service-types", { accessToken: accessToken! }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch("/portal/service-requests", {
        method: "POST",
        accessToken: accessToken!,
        body: JSON.stringify({ departmentId, serviceTypeId, description }),
      }),
    onSuccess: () => {
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["portal-service-requests"] });
    },
  });

  if (!hasHydrated || !user) return null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 bg-background p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          Solicitacoes
        </h1>
        <Link href="/portal" className={buttonVariants({ variant: "outline" })}>
          Voltar
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova solicitacao</CardTitle>
          <CardDescription>Peca um servico a secretaria.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="department">Secretaria</Label>
              <select
                id="department"
                required
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">Selecione...</option>
                {departmentsQuery.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="serviceType">Tipo de servico</Label>
              <select
                id="serviceType"
                required
                value={serviceTypeId}
                onChange={(e) => setServiceTypeId(e.target.value)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">Selecione...</option>
                {serviceTypesQuery.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Descricao</Label>
              <textarea
                id="description"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-24 rounded-lg border border-input bg-transparent p-2.5 text-sm"
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Enviando..." : "Enviar solicitacao"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {requestsQuery.data?.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <CardTitle>{request.protocol}</CardTitle>
              <CardDescription>
                {request.serviceType.name} - {request.department.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm">{request.description}</p>
              <RequestStatusBadge status={request.status} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
