"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Building2,
  ClipboardList,
  Gauge,
  Landmark,
  LogOut,
  Map as MapIcon,
  Siren,
  Sprout,
  Tractor,
  Trees,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ProfileDialog } from "@/components/profile-dialog";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import type { AppUser } from "@/lib/user-types";
import { useAuthStore } from "@/stores/auth-store";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin GovRural",
  MUNICIPAL_ADMIN: "Administrador Municipal",
  SECRETARY: "Secretario",
  TECHNICIAN: "Tecnico",
  MACHINE_OPERATOR: "Operador de Maquina",
  PRODUCER: "Produtor Rural",
};

// Telas operacionais do dia a dia municipal - o Super Admin GovRural
// administra a plataforma (municipios/usuarios), nao opera essas telas.
const MUNICIPAL_STAFF_ROLES = [
  "MUNICIPAL_ADMIN",
  "SECRETARY",
  "TECHNICIAN",
  "MACHINE_OPERATOR",
];

interface NavItem {
  href: string;
  label: string;
  icon: typeof BarChart3;
  roles?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Visao geral",
    items: [
      { href: "/dashboard/indicadores", label: "Indicadores", icon: BarChart3, roles: MUNICIPAL_STAFF_ROLES },
      { href: "/dashboard/mapa", label: "Mapa", icon: MapIcon, roles: MUNICIPAL_STAFF_ROLES },
    ],
  },
  {
    title: "Atendimento",
    items: [
      {
        href: "/dashboard/solicitacoes",
        label: "Solicitacoes",
        icon: ClipboardList,
        roles: MUNICIPAL_STAFF_ROLES,
      },
      { href: "/dashboard/ocorrencias", label: "Ocorrencias", icon: Siren, roles: MUNICIPAL_STAFF_ROLES },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { href: "/dashboard/produtores", label: "Produtores", icon: Sprout, roles: MUNICIPAL_STAFF_ROLES },
      { href: "/dashboard/propriedades", label: "Propriedades", icon: Trees, roles: MUNICIPAL_STAFF_ROLES },
      { href: "/dashboard/secretarias", label: "Secretarias", icon: Landmark, roles: MUNICIPAL_STAFF_ROLES },
      {
        href: "/dashboard/tipos-servico",
        label: "Tipos de Servico",
        icon: Wrench,
        roles: MUNICIPAL_STAFF_ROLES,
      },
    ],
  },
  {
    title: "Patrulha mecanizada",
    items: [
      { href: "/dashboard/maquinas", label: "Maquinas", icon: Tractor, roles: MUNICIPAL_STAFF_ROLES },
      {
        href: "/dashboard/servicos-maquina",
        label: "Servicos de Maquina",
        icon: Gauge,
        roles: MUNICIPAL_STAFF_ROLES,
      },
    ],
  },
  {
    title: "Programas sociais",
    items: [
      { href: "/dashboard/programas", label: "Programas", icon: Wallet, roles: MUNICIPAL_STAFF_ROLES },
    ],
  },
  {
    title: "Administracao",
    items: [
      {
        href: "/dashboard/usuarios",
        label: "Usuarios",
        icon: Users,
        roles: ["SUPER_ADMIN", "MUNICIPAL_ADMIN"],
      },
      {
        href: "/dashboard/municipios",
        label: "Municipios",
        icon: Building2,
        roles: ["SUPER_ADMIN"],
      },
    ],
  },
];

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, accessToken, hasHydrated, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.replace("/login");
    else if (user.role === "PRODUCER") router.replace("/portal");
  }, [hasHydrated, user, router]);

  const meQuery = useQuery({
    queryKey: ["me", user?.id],
    enabled: Boolean(accessToken && user?.id),
    queryFn: () =>
      apiFetch<AppUser>(`/users/${user!.id}`, { accessToken: accessToken! }),
  });

  if (!hasHydrated || !user || user.role === "PRODUCER") return null;

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="flex flex-1 bg-background">
      <aside className="flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            <Sprout className="size-5" />
          </div>
          <div>
            <p className="font-semibold leading-none text-sidebar-foreground">
              GovRural
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Gestao rural municipal
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 pb-3">
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter(
              (item) => !item.roles || item.roles.includes(user.role),
            );
            if (items.length === 0) return null;

            return (
              <div key={group.title} className="flex flex-col gap-1">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/40">
                  {group.title}
                </p>
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-1 rounded-lg px-1 py-1">
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-sidebar-accent"
            >
              {meQuery.data?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={meQuery.data.avatarUrl}
                  alt=""
                  className="size-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                  {initials(user.email)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {user.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
              </div>
            </button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Sair"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-auto">{children}</main>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}
