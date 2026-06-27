import { BUDGET_TEMPLATES, findTemplateCategories, BudgetTemplate } from '../budget-templates';

describe('Budget Templates', () => {
  const mockCategories = [
    { id: 'cat-1', nome: 'Spesa alimentare' },
    { id: 'cat-2', nome: 'Affitto/Mutuo' },
    { id: 'cat-3', nome: 'Bollette' },
    { id: 'cat-4', nome: 'Svago/Intrattenimento' },
  ];

  // --- CASI NORMALI ---

  test('Caso 1: Elenco dei template standard', () => {
    expect(Array.isArray(BUDGET_TEMPLATES)).toBe(true);
    expect(BUDGET_TEMPLATES).toHaveLength(11);

    // Verify properties of the first template
    const firstTemplate = BUDGET_TEMPLATES[0];
    expect(firstTemplate.id).toBe('spesa-mensile');
    expect(firstTemplate.nome).toBe('Spesa Alimentare');
    expect(firstTemplate.importoSuggerito).toBe(400);
    expect(firstTemplate.periodo).toBe('mensile');
    expect(firstTemplate.categorieTarget).toEqual(['Spesa alimentare']);
    expect(firstTemplate.iconKey).toBe('groceries');
    expect(typeof firstTemplate.color).toBe('string');
  });

  test('Caso 2: Mappatura categorie esistenti (findTemplateCategories)', () => {
    const template = BUDGET_TEMPLATES.find(t => t.id === 'spesa-mensile') as BudgetTemplate;
    const result = findTemplateCategories(template, mockCategories);
    expect(result).toEqual(['cat-1']);
  });

  test('Caso 3: Mappatura categorie con target multipli', () => {
    const template = BUDGET_TEMPLATES.find(t => t.id === 'casa') as BudgetTemplate;
    const result = findTemplateCategories(template, mockCategories);
    expect(result).toEqual(['cat-2', 'cat-3']);
  });

  test('Caso Extra: Confronto case-insensitive', () => {
    const template = BUDGET_TEMPLATES.find(t => t.id === 'spesa-mensile') as BudgetTemplate;
    const upperCaseCategories = [
      { id: 'cat-upper-1', nome: 'SPESA ALIMENTARE' }
    ];
    const result = findTemplateCategories(template, upperCaseCategories);
    expect(result).toEqual(['cat-upper-1']);
  });

  // --- CASI LIMITE ---

  test('Caso Limite 1: Nessuna categoria corrispondente', () => {
    const template = BUDGET_TEMPLATES.find(t => t.id === 'spesa-mensile') as BudgetTemplate;
    const irrelevantCategories = [
      { id: 'cat-irrelevant', nome: 'Viaggi' }
    ];
    const result = findTemplateCategories(template, irrelevantCategories);
    expect(result).toEqual([]);
  });

  test('Caso Limite 2: Template senza categorie target (budget-totale)', () => {
    const template = BUDGET_TEMPLATES.find(t => t.id === 'budget-totale') as BudgetTemplate;
    const result = findTemplateCategories(template, mockCategories);
    expect(result).toEqual([]);
  });

  // --- CASI DI ERRORE ---

  test('Caso Errore 1: Elenco categorie non definito (undefined / null)', () => {
    const template = BUDGET_TEMPLATES[0];
    expect(() => findTemplateCategories(template, null as any)).toThrow(TypeError);
    expect(() => findTemplateCategories(template, undefined as any)).toThrow(TypeError);
  });
});
