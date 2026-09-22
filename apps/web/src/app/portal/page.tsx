"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatTile } from "@/components/stat-tile";
import { apiFetch } from "@/lib/api-client";
import type { PortalMe } from "@/lib/portal-types";
import { useAuthStore } from "@/stores/auth-store";

export default function PortalPage() {
  const router = useRouter();
  const { accessToken, user, logout } = useAuthStore();

  useEffect(() => {
    if (!user) router.replace("/login");
    else if (user.role !== "PRODUCER") router.replace("/dashboard");
  }, [user, router]);

  const meQuery = useQuery({
    queryKey: ["portal-me"],
    enabled: Boolean(accessToken),
    queryFn: () => apiFetch<PortalMe>("/portal/me", { accessToken: accessToken! }),
  });

  if (!user || user.role !== "PRODUCER") return null;

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="flex flex-1 flex-col gap-6 bg-zinc-50 p-6 dark:bg-black">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Ola, {meQuery.data?.name ?? "..."}!
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Portal do Produtor - GovRural
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Sair
        </Button>
      </div>

      {meQuery.isLoading && <p className="text-zinc-500">Carregando...</p>}
      {meQuery.isError && (
        <p className="text-red-600">Erro ao carregar seus dados.</p>
      )}

      {meQuery.data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Minhas propriedades" value={meQuery.data.properties} />
          <StatTile
            label="Solicitacoes abertas"
            value={meQuery.data.openServiceRequests}
            status={meQuery.data.openServiceRequests > 0 ? "warning" : "good"}
          />
          <StatTile
            label="Servicos realizados"
            value={meQuery.data.completedServices}
          />
          <StatTile
            label="Programas recebidos"
            value={meQuery.data.programBenefits}
          />
        </div>
      )}

      <nav className="flex flex-wrap gap-2">
        <Link href="/portal/propriedades" className={buttonVariants({ variant: "outline" })}>
          Minhas propriedades
        </Link>
        <Link href="/portal/solicitacoes" className={buttonVariants({ variant: "outline" })}>
          Solicitacoes
        </Link>
        <span
          className={buttonVariants({ variant: "ghost" })}
          title="Modulo de Documentos ainda nao implementado"
        >
          Documentos (em breve)
        </span>
        <span
          className={buttonVariants({ variant: "ghost" })}
          title="Notificacoes ainda nao implementadas"
        >
          Notificacoes (em breve)
        </span>
      </nav>
    </div>
  );
}
