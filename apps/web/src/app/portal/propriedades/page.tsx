"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import type { PortalProperty } from "@/lib/portal-types";
import { useAuthStore } from "@/stores/auth-store";

export default function PortalPropertiesPage() {
  const router = useRouter();
  const { accessToken, user, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.replace("/login");
  }, [hasHydrated, user, router]);

  const query = useQuery({
    queryKey: ["portal-properties"],
    enabled: Boolean(accessToken),
    queryFn: () =>
      apiFetch<PortalProperty[]>("/portal/properties", {
        accessToken: accessToken!,
      }),
  });

  if (!hasHydrated || !user) return null;

  return (
    <div className="flex flex-1 flex-col gap-4 bg-background p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          Minhas propriedades
        </h1>
        <Link href="/portal" className={buttonVariants({ variant: "outline" })}>
          Voltar
        </Link>
      </div>

      {query.isLoading && <p className="text-muted-foreground">Carregando...</p>}
      {query.data?.length === 0 && (
        <p className="text-muted-foreground">Nenhuma propriedade vinculada.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {query.data?.map((property) => (
          <Card key={property.id}>
            <CardHeader>
              <CardTitle>{property.name}</CardTitle>
              <CardDescription>
                {property.locality ?? "Localidade nao informada"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Area total: {property.totalArea} ha
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
