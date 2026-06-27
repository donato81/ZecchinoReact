import { BudgetPeriod } from './types';
import { DESIGN_COLORS } from './design-tokens/colors';
import type { BudgetTemplateIconKey } from './design-tokens/colors';

export interface BudgetTemplate {
  id: string;
  nome: string;
  descrizione: string;
  importoSuggerito: number;
  periodo: BudgetPeriod;
  categorieTarget: string[];
  iconKey: BudgetTemplateIconKey;
  color: string;
}

export const BUDGET_TEMPLATES: BudgetTemplate[] = [
  {
    id: 'spesa-mensile',
    nome: 'Spesa Alimentare',
    descrizione: 'Budget mensile per supermercato e alimentari',
    importoSuggerito: 400,
    periodo: 'mensile',
    categorieTarget: ['Spesa alimentare'],
    iconKey: 'groceries',
    color: DESIGN_COLORS.budget.groceries,
  },
  {
    id: 'ristoranti',
    nome: 'Ristoranti e Bar',
    descrizione: 'Budget mensile per pasti fuori e caffè',
    importoSuggerito: 200,
    periodo: 'mensile',
    categorieTarget: ['Ristorante/Bar'],
    iconKey: 'dining',
    color: DESIGN_COLORS.budget.dining,
  },
  {
    id: 'trasporti',
    nome: 'Trasporti',
    descrizione: 'Budget mensile per benzina, mezzi pubblici e parcheggi',
    importoSuggerito: 150,
    periodo: 'mensile',
    categorieTarget: ['Trasporti'],
    iconKey: 'transport',
    color: DESIGN_COLORS.budget.transport,
  },
  {
    id: 'casa',
    nome: 'Casa e Bollette',
    descrizione: 'Budget mensile per affitto, mutuo e utenze',
    importoSuggerito: 800,
    periodo: 'mensile',
    categorieTarget: ['Affitto/Mutuo', 'Bollette'],
    iconKey: 'housing',
    color: DESIGN_COLORS.budget.housing,
  },
  {
    id: 'svago',
    nome: 'Svago e Intrattenimento',
    descrizione: 'Budget mensile per cinema, eventi e hobby',
    importoSuggerito: 100,
    periodo: 'mensile',
    categorieTarget: ['Svago/Intrattenimento'],
    iconKey: 'entertainment',
    color: DESIGN_COLORS.budget.entertainment,
  },
  {
    id: 'salute',
    nome: 'Salute e Benessere',
    descrizione: 'Budget mensile per farmacia, visite mediche e palestra',
    importoSuggerito: 100,
    periodo: 'mensile',
    categorieTarget: ['Salute/Farmacia'],
    iconKey: 'health',
    color: DESIGN_COLORS.budget.health,
  },
  {
    id: 'abbonamenti',
    nome: 'Abbonamenti',
    descrizione: 'Budget mensile per streaming, software e servizi',
    importoSuggerito: 50,
    periodo: 'mensile',
    categorieTarget: ['Abbonamenti'],
    iconKey: 'subscriptions',
    color: DESIGN_COLORS.budget.subscriptions,
  },
  {
    id: 'abbigliamento',
    nome: 'Abbigliamento',
    descrizione: 'Budget trimestrale per vestiti e accessori',
    importoSuggerito: 300,
    periodo: 'trimestrale',
    categorieTarget: ['Abbigliamento'],
    iconKey: 'clothing',
    color: DESIGN_COLORS.budget.clothing,
  },
  {
    id: 'istruzione',
    nome: 'Istruzione e Formazione',
    descrizione: 'Budget annuale per corsi, libri e materiali didattici',
    importoSuggerito: 500,
    periodo: 'annuale',
    categorieTarget: ['Istruzione'],
    iconKey: 'education',
    color: DESIGN_COLORS.budget.education,
  },
  {
    id: 'animali',
    nome: 'Animali Domestici',
    descrizione: 'Budget mensile per cibo, cure veterinarie e accessori',
    importoSuggerito: 80,
    periodo: 'mensile',
    categorieTarget: ['Animali'],
    iconKey: 'pets',
    color: DESIGN_COLORS.budget.pets,
  },
  {
    id: 'budget-totale',
    nome: 'Budget Totale Mensile',
    descrizione: 'Budget complessivo per tutte le spese del mese',
    importoSuggerito: 2000,
    periodo: 'mensile',
    categorieTarget: [],
    iconKey: 'overall-budget',
    color: DESIGN_COLORS.budget.overallBudget,
  },
];

export function findTemplateCategories(
  template: BudgetTemplate,
  availableCategories: Array<{ id: string; nome: string }>,
): string[] {
  return availableCategories
    .filter(cat =>
      template.categorieTarget
        .map(t => t.toLowerCase())
        .includes(cat.nome.toLowerCase())
    )
    .map(cat => cat.id);
}
