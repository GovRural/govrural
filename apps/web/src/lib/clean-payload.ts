/**
 * Remove campos com string vazia do payload antes de enviar - varios DTOs
 * do backend usam validadores (@IsEmail, @IsUUID, etc.) que rejeitam "" em
 * campos opcionais, entao "nao preenchido" precisa virar "campo ausente",
 * nao string vazia.
 */
export function cleanPayload<T extends object>(values: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(values) as [keyof T, unknown][]) {
    if (value !== "") {
      result[key] = value as T[keyof T];
    }
  }
  return result;
}
