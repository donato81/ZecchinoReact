// src/announcements/_utils/t.ts
// Funzione di interpolazione: sostituisce {chiave} con i valori passati.
// Non importa @/accessibility/engine. Solo @/locales.
import { strings } from '@/locales';
import type { StringKey } from '@/locales/it';

export function t(
  key: StringKey,
  params?: Record<string, string | number>,
): string {
  let result: string = strings[key];
  if (!params) return result;
  for (const [k, v] of Object.entries(params)) {
    result = result.split(`{${k}}`).join(String(v));
  }
  return result;
}
