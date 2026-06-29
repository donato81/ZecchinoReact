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
  const wasCapitalized = word.length > 0 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
  const lower = word.toLowerCase();
  if (lower in IRREGULAR) {
    const plural = IRREGULAR[lower];
    return wasCapitalized
      ? plural.charAt(0).toUpperCase() + plural.slice(1)
      : plural;
  }
  if (word.endsWith('o')) return `${word.slice(0, -1)}i`;
  if (word.endsWith('a')) return `${word.slice(0, -1)}e`;
  if (word.endsWith('e')) return `${word.slice(0, -1)}i`;
  return word;
}
