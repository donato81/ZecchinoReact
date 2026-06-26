// src/lib/design-tokens/colors.ts
// File centrale dei design token colore per ZecchinoReact.
// Tutti i valori sono in formato hex compatibile con React Native.
// Nessun altro file deve definire valori colore hardcoded.

export const DESIGN_COLORS = {

  budget: {
    groceries:     '#58A546',  // oklch(0.65 0.15 140) — template Spesa Alimentare
    dining:        '#E97C47',  // oklch(0.70 0.15 45)  — template Ristoranti e Bar
    transport:     '#008EC7',  // oklch(0.60 0.15 230) — template Trasporti
    housing:       '#AC5345',  // oklch(0.55 0.12 30)  — template Casa e Bollette
    entertainment: '#AB79F4',  // oklch(0.68 0.18 300) — template Svago e Intrattenimento
    health:        '#DC655E',  // oklch(0.65 0.15 25)  — template Salute e Benessere
    subscriptions: '#6B6CCF',  // oklch(0.58 0.15 280) — template Abbonamenti
    clothing:      '#A66DB2',  // oklch(0.62 0.12 320) — template Abbigliamento
    education:     '#0F74C4',  // oklch(0.55 0.15 250) — template Istruzione e Formazione
    pets:          '#DD8735',  // oklch(0.70 0.14 60)  — template Animali Domestici
    overallBudget: '#143C62',  // oklch(0.35 0.08 250) — template Budget Totale Mensile
  },

  accountCategory: {
    banking:     '#143C62',  // oklch(0.35 0.08 250) — categoria Bancari
    digital:     '#00ABA3',  // oklch(0.65 0.15 190) — categoria Digitali
    savings:     '#D1A84A',  // oklch(0.75 0.12 85)  — categoria Risparmio
    investments: '#258900',  // oklch(0.55 0.18 140) — categoria Investimenti
    private:     '#B94642',  // oklch(0.55 0.15 25)  — categoria Privato
  },

} as const;

export type BudgetColorToken = keyof typeof DESIGN_COLORS.budget;
export type AccountCategoryColorToken = keyof typeof DESIGN_COLORS.accountCategory;

export type BudgetTemplateIconKey =
  | 'groceries'
  | 'dining'
  | 'transport'
  | 'housing'
  | 'entertainment'
  | 'health'
  | 'subscriptions'
  | 'clothing'
  | 'education'
  | 'pets'
  | 'overall-budget';
