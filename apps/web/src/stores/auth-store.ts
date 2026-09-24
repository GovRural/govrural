import { create } from "zustand";
import { persist } from "zustand/middleware";
import { decodeJwtPayload } from "@/lib/jwt";

interface AuthUser {
  id: string;
  email: string;
  role: string;
  municipalityId: string | null;
  producerId: string | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  // O persist middleware reidrata do localStorage de forma assincrona - no
  // primeiro render do client, accessToken/user ainda estao no valor
  // inicial (null) mesmo com uma sessao valida salva. Sem esse flag, uma
  // tela que faz "if (!user) redirect para /login" no useEffect dispara
  // esse redirect precocemente a cada F5 num usuario ja autenticado.
  hasHydrated: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,
      login: (accessToken, refreshToken) => {
        const payload = decodeJwtPayload(accessToken);
        set({
          accessToken,
          refreshToken,
          user: payload
            ? {
                id: payload.sub,
                email: payload.email,
                role: payload.role,
                municipalityId: payload.municipalityId,
                producerId: payload.producerId,
              }
            : null,
        });
      },
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "govrural-auth",
      onRehydrateStorage: () => (state) => {
        // Mutar o state recebido aqui (nao chamar useAuthStore.setState) -
        // esse callback pode disparar de forma sincrona durante a propria
        // criacao do store, antes da constante useAuthStore ser atribuida.
        if (state) state.hasHydrated = true;
      },
    },
  ),
);
