"use client";

import { useMutation } from "@tanstack/react-query";
import { Sprout } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

const underlineInput = cn(
  "h-10 rounded-none border-0 border-b-2 border-input bg-transparent px-0 text-base",
  "focus-visible:border-primary focus-visible:ring-0",
);

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    onSuccess: (data) => {
      login(data.accessToken, data.refreshToken);
      router.push("/dashboard");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ email, password });
  }

  return (
    <div className="flex min-h-svh flex-1 bg-background">
      <div className="order-2 flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[46%] lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
              <Sprout className="size-5" />
            </div>
            <span className="text-lg font-semibold text-foreground">GovRural</span>
          </div>

          <h1 className="text-2xl font-semibold text-foreground">
            Bem-vindo de volta
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre com suas credenciais para acessar o painel de gestao rural.
          </p>

          <form onSubmit={handleSubmit} className="mt-9 flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="voce@prefeitura.gov.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={underlineInput}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={underlineInput}
              />
            </div>

            {mutation.isError && (
              <p className="text-sm text-destructive">
                Nao foi possivel entrar. Verifique email e senha.
              </p>
            )}

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="mt-2 h-11 rounded-full text-sm font-semibold"
            >
              {mutation.isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </div>

      <div className="order-1 relative hidden flex-1 items-center justify-center bg-[oklch(0.28_0.07_152)] lg:flex">
        <div className="flex w-full max-w-md flex-col items-center px-10 text-center">
          <div className="w-full rounded-xl bg-card p-5 text-left shadow-lg">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sprout className="size-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  Indicadores
                </p>
                <p className="text-xs text-muted-foreground">
                  Sidrolandia - MS
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-lg font-semibold text-card-foreground">1.284</p>
                <p className="text-xs text-muted-foreground">Produtores</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-lg font-semibold text-card-foreground">42</p>
                <p className="text-xs text-muted-foreground">Solicitacoes</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-lg font-semibold text-card-foreground">7</p>
                <p className="text-xs text-muted-foreground">Ocorrencias</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-lg font-semibold text-card-foreground">5</p>
                <p className="text-xs text-muted-foreground">Maquinas ativas</p>
              </div>
            </div>
          </div>

          <h2 className="mt-8 text-xl font-semibold text-white">
            Uma plataforma, toda a gestao rural do municipio
          </h2>
          <p className="mt-2 text-sm text-white/70">
            Produtores, propriedades, solicitacoes, maquinas e programas em um
            so lugar.
          </p>
        </div>
      </div>
    </div>
  );
}
