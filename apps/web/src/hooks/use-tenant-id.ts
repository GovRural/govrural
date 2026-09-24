import { useAuthStore } from "@/stores/auth-store";
import { useTenantStore } from "@/stores/tenant-store";

/**
 * Municipio efetivo para as chamadas de API. Um SUPER_ADMIN nao tem
 * municipalityId proprio, entao precisa escolher um (ver AdminShell); os
 * demais perfis sempre usam o municipio do proprio JWT.
 */
export function useTenantId(): string | null {
  const user = useAuthStore((state) => state.user);
  const selected = useTenantStore((state) => state.selectedMunicipalityId);

  if (!user) return null;
  return user.role === "SUPER_ADMIN" ? selected : user.municipalityId;
}
