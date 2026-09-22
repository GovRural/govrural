"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin GovRural",
  MUNICIPAL_ADMIN: "Administrador Municipal",
  SECRETARY: "Secretario",
  TECHNICIAN: "Tecnico",
  MACHINE_OPERATOR: "Operador de Maquina",
  PRODUCER: "Produtor Rural",
};

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-4 py-16 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Bem-vindo(a)</CardTitle>
          <CardDescription>Voce esta autenticado no GovRural.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div>
            <p className="text-sm text-zinc-500">E-mail</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Perfil</p>
            <p className="font-medium">
              {ROLE_LABELS[user.role] ?? user.role}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Municipio</p>
            <p className="font-medium">
              {user.municipalityId ?? "Sem municipio (plataforma)"}
            </p>
          </div>
          <Link href="/dashboard/mapa" className={buttonVariants({ className: "mt-4" })}>
            Ver mapa
          </Link>
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
