// src/announcements/_utils/plurals.ts
// Pluralizzatore italiano con eccezioni e regole morfologiche minime.
// Non importa @/accessibility/engine.

const IRREGULAR: Record<string, string> = {
  euro: 'euro',
  movimento: 'movimenti',
  elemento: 'elementi',
  conto: 'conti',
  budget: 'budget',
  obiettivo: 'obiettivi',
  dato: 'dati',
  categoria: 'categorie',
};

export function pluralize(word: string, count: number): string {
  if (count === 1) return word;
  const lower = word.toLowerCase();
  if (lower in IRREGULAR) return IRREGULAR[lower];
  if (word.endsWith('o')) return `${word.slice(0, -1)}i`;
  if (word.endsWith('a')) return `${word.slice(0, -1)}e`;
  if (word.endsWith('e')) return `${word.slice(0, -1)}i`;
  return word;
}
