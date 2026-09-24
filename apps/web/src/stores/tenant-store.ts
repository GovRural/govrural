import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TenantState {
  selectedMunicipalityId: string | null;
  setSelectedMunicipalityId: (id: string | null) => void;
}

// Usado apenas quando o usuario logado e SUPER_ADMIN (nao pertence a
// nenhum municipio). Para os demais perfis, o municipio vem sempre do
// proprio JWT (ver hooks/use-tenant-id.ts).
export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      selectedMunicipalityId: null,
      setSelectedMunicipalityId: (id) => set({ selectedMunicipalityId: id }),
    }),
    { name: "govrural-tenant" },
  ),
);
