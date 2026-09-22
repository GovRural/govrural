export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  municipalityId: string | null;
  exp: number;
}

/**
 * Decodifica o payload de um JWT sem verificar a assinatura - usado apenas
 * para exibicao na UI (ex: nome/role do usuario logado). A verificacao real
 * acontece sempre no backend, a cada requisicao.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}
