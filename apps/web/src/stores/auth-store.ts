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
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
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
    { name: "govrural-auth" },
  ),
);
