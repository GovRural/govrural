// Espelha o RBAC do backend so para esconder acoes que o usuario nao
// conseguiria executar de qualquer forma - a validacao real e sempre no
// backend (ver auth/guards/roles.guard.ts).
const MANAGE_ROLES = ["SUPER_ADMIN", "MUNICIPAL_ADMIN", "TECHNICIAN"];
const ADMIN_ROLES = ["SUPER_ADMIN", "MUNICIPAL_ADMIN"];

export function canManage(role: string | undefined): boolean {
  return Boolean(role && MANAGE_ROLES.includes(role));
}

export function canAdminister(role: string | undefined): boolean {
  return Boolean(role && ADMIN_ROLES.includes(role));
}

export function hasAnyRole(role: string | undefined, allowed: string[]): boolean {
  return Boolean(role && allowed.includes(role));
}
