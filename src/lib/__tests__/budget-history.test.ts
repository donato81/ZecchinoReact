import {
  getBudgetHistoricalData,
  calculateBudgetTrend,
  compareBudgetPeriods,
} from '../budget-history';
import { Budget, Transaction } from '../types';

describe('Budget History', () => {
  let mockBudget: Budget;
  let mockTransactions: Transaction[];

  beforeEach(() => {
    mockBudget = {
      id: 'budget-1',
      nome: 'Test Budget',
      importoTarget: 1000,
      dataInizio: '2026-06-15T00:00:00.000Z',
      dataFine: '2026-07-14T23:59:59.000Z',
      periodo: 'mensile',
      attivo: true,
    };

    mockTransactions = [
      {
        id: 't-1',
        contoId: 'conto-1',
        tipo: 'uscita',
        importo: 100,
        data: '2026-06-20T12:00:00.000Z',
        descrizione: 'Spesa 1',
        categoriaId: 'cat-1',
        ricorrente: false,
        cifrato: false,
      },
      {
        id: 't-2',
        contoId: 'conto-1',
        tipo: 'uscita',
        importo: 200,
        data: '2026-05-20T12:00:00.000Z',
        descrizione: 'Spesa 2',
        categoriaId: 'cat-1',
        ricorrente: false,
        cifrato: false,
      },
      {
        id: 't-3',
        contoId: 'conto-1',
        tipo: 'uscita',
        importo: 150,
        data: '2026-04-20T12:00:00.000Z',
        descrizione: 'Spesa 3',
        categoriaId: 'cat-1',
        ricorrente: false,
        cifrato: false,
      },
    ];
  });

  // Helpers to dynamically calculate start/end dates with local timezone safety (DST-safe)
  const getExpectedStartDate = (startDateIso: string, monthsToSubtract: number): string => {
    const d = new Date(startDateIso);
    d.setDate(1);
    d.setMonth(d.getMonth() - monthsToSubtract);
    return d.toISOString();
  };

  const getExpectedStartDateYears = (startDateIso: string, yearsToSubtract: number): string => {
    const d = new Date(startDateIso);
    d.setDate(1);
    d.setFullYear(d.getFullYear() - yearsToSubtract);
    return d.toISOString();
  };

  const getExpectedEndDate = (startDateIso: string, monthsToAdd: number): string => {
    const d = new Date(startDateIso);
    d.setMonth(d.getMonth() + monthsToAdd);
    d.setDate(d.getDate() - 1);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  };

  const getExpectedEndDateYears = (startDateIso: string, yearsToAdd: number): string => {
    const d = new Date(startDateIso);
    d.setFullYear(d.getFullYear() + yearsToAdd);
    d.setDate(d.getDate() - 1);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  };

  // --- CASI NORMALI ---

  test('Caso 1: Storico budget mensile (periodo = mensile)', () => {
    const result = getBudgetHistoricalData(mockBudget, mockTransactions, 3);

    expect(result).toHaveLength(3);
    // reversed: index 0 is April, index 1 is May, index 2 is June
    expect(result[0].periodLabel).toBe('Apr 2026');
    expect(result[1].periodLabel).toBe('Mag 2026');
    expect(result[2].periodLabel).toBe('Giu 2026');

    // Date range verification (normalized to day 1)
    expect(result[2].startDate).toBe(getExpectedStartDate(mockBudget.dataInizio, 0));
    expect(result[2].endDate).toBe(getExpectedEndDate(result[2].startDate, 1));
    expect(result[2].spent).toBe(100); // only t-1 (June)

    expect(result[1].startDate).toBe(getExpectedStartDate(mockBudget.dataInizio, 1));
    expect(result[1].endDate).toBe(getExpectedEndDate(result[1].startDate, 1));
    expect(result[1].spent).toBe(200); // t-2 (May)

    expect(result[0].startDate).toBe(getExpectedStartDate(mockBudget.dataInizio, 2));
    expect(result[0].endDate).toBe(getExpectedEndDate(result[0].startDate, 1));
    expect(result[0].spent).toBe(150); // t-3 (April)
  });

  test('Caso 2: Storico budget trimestrale (periodo = trimestrale)', () => {
    mockBudget.periodo = 'trimestrale';
    const result = getBudgetHistoricalData(mockBudget, mockTransactions, 2);

    expect(result).toHaveLength(2);
    // June 15 normalized -> 2026-06-01. Index 0 is March, Index 1 is June.
    expect(result[0].periodLabel).toBe('Q1 2026');
    expect(result[1].periodLabel).toBe('Q2 2026');

    // Q2 range: 2026-06-01 to 2026-08-31
    expect(result[1].startDate).toBe(getExpectedStartDate(mockBudget.dataInizio, 0));
    expect(result[1].endDate).toBe(getExpectedEndDate(result[1].startDate, 3));

    // Q1 range: 2026-03-01 to 2026-05-31
    expect(result[0].startDate).toBe(getExpectedStartDate(mockBudget.dataInizio, 3));
    expect(result[0].endDate).toBe(getExpectedEndDate(result[0].startDate, 3));
  });

  test('Caso 3: Storico budget annuale (periodo = annuale)', () => {
    mockBudget.periodo = 'annuale';
    const result = getBudgetHistoricalData(mockBudget, mockTransactions, 2);

    expect(result).toHaveLength(2);
    expect(result[0].periodLabel).toBe('2025');
    expect(result[1].periodLabel).toBe('2026');

    // 2026 range: 2026-06-01 to 2027-05-31
    expect(result[1].startDate).toBe(getExpectedStartDateYears(mockBudget.dataInizio, 0));
    expect(result[1].endDate).toBe(getExpectedEndDateYears(result[1].startDate, 1));

    // 2025 range: 2025-06-01 to 2026-05-31
    expect(result[0].startDate).toBe(getExpectedStartDateYears(mockBudget.dataInizio, 1));
    expect(result[0].endDate).toBe(getExpectedEndDateYears(result[0].startDate, 1));
  });

  test('Caso 4: Analisi Trend Crescente (trend = increasing)', () => {
    const customTransactions: Transaction[] = [
      // Older periods: Oct, Nov, Dec 2025
      { id: '1', contoId: 'c1', tipo: 'uscita', importo: 100, data: '2025-10-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
      { id: '2', contoId: 'c1', tipo: 'uscita', importo: 100, data: '2025-11-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
      { id: '3', contoId: 'c1', tipo: 'uscita', importo: 100, data: '2025-12-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
      // Recent periods: Jan, Feb, Mar 2026
      { id: '4', contoId: 'c1', tipo: 'uscita', importo: 120, data: '2026-01-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
      { id: '5', contoId: 'c1', tipo: 'uscita', importo: 120, data: '2026-02-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
      { id: '6', contoId: 'c1', tipo: 'uscita', importo: 120, data: '2026-03-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
    ];

    mockBudget.dataInizio = '2026-03-15T00:00:00.000Z';

    const result = calculateBudgetTrend(mockBudget, customTransactions, 6);
    expect(result.trend).toBe('increasing');
    expect(result.changePercentage).toBeCloseTo(20, 2);
  });

  test('Caso 5: Analisi Trend Decrescente (trend = decreasing)', () => {
    const customTransactions: Transaction[] = [
      { id: '1', contoId: 'c1', tipo: 'uscita', importo: 100, data: '2025-10-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
      { id: '2', contoId: 'c1', tipo: 'uscita', importo: 100, data: '2025-11-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
      { id: '3', contoId: 'c1', tipo: 'uscita', importo: 100, data: '2025-12-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
      { id: '4', contoId: 'c1', tipo: 'uscita', importo: 80, data: '2026-01-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
      { id: '5', contoId: 'c1', tipo: 'uscita', importo: 80, data: '2026-02-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
      { id: '6', contoId: 'c1', tipo: 'uscita', importo: 80, data: '2026-03-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
    ];

    mockBudget.dataInizio = '2026-03-15T00:00:00.000Z';

    const result = calculateBudgetTrend(mockBudget, customTransactions, 6);
    expect(result.trend).toBe('decreasing');
    expect(result.changePercentage).toBeCloseTo(-20, 2);
  });

  test('Caso 6: Analisi Trend Stabile (trend = stable)', () => {
    const customTransactions: Transaction[] = [
      { id: '1', contoId: 'c1', tipo: 'uscita', importo: 100, data: '2025-10-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
      { id: '2', contoId: 'c1', tipo: 'uscita', importo: 100, data: '2025-11-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
      { id: '3', contoId: 'c1', tipo: 'uscita', importo: 100, data: '2025-12-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
      { id: '4', contoId: 'c1', tipo: 'uscita', importo: 105, data: '2026-01-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
      { id: '5', contoId: 'c1', tipo: 'uscita', importo: 105, data: '2026-02-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
      { id: '6', contoId: 'c1', tipo: 'uscita', importo: 105, data: '2026-03-15T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
    ];

    mockBudget.dataInizio = '2026-03-15T00:00:00.000Z';

    const result = calculateBudgetTrend(mockBudget, customTransactions, 6);
    expect(result.trend).toBe('stable');
    expect(result.changePercentage).toBeCloseTo(5, 2);
  });

  test('Caso 7: Confronto periodi (compareBudgetPeriods)', () => {
    const result = compareBudgetPeriods(mockBudget, mockTransactions);

    expect(result.currentPeriod.periodLabel).toBe('Giu 2026');
    expect(result.previousPeriod.periodLabel).toBe('Mag 2026');
    expect(result.change).toBe(-100); // 100 (current) - 200 (previous)
    expect(result.changePercentage).toBe(-50); // -100 / 200 * 100
  });

  test('Caso 8: Filtro per categoria e conto in calculatePeriodSpending', () => {
    const extendedTransactions: Transaction[] = [
      ...mockTransactions,
      {
        id: 't-cat-diff',
        contoId: 'conto-1',
        tipo: 'uscita',
        importo: 1000,
        data: '2026-06-20T12:00:00.000Z',
        descrizione: 'Categoria diversa',
        categoriaId: 'cat-differente',
        ricorrente: false,
        cifrato: false,
      },
      {
        id: 't-conto-diff',
        contoId: 'conto-differente',
        tipo: 'uscita',
        importo: 2000,
        data: '2026-06-20T12:00:00.000Z',
        descrizione: 'Conto diverso',
        categoriaId: 'cat-1',
        ricorrente: false,
        cifrato: false,
      },
    ];

    // Filter by category
    mockBudget.categoriaId = 'cat-1';
    const resultCat = getBudgetHistoricalData(mockBudget, extendedTransactions, 1);
    // Should only count t-1 (100) and t-conto-diff (2000), total 2100
    expect(resultCat[0].spent).toBe(2100);

    // Filter by conto
    mockBudget.categoriaId = undefined;
    mockBudget.contoId = 'conto-1';
    const resultConto = getBudgetHistoricalData(mockBudget, extendedTransactions, 1);
    // Should only count t-1 (100) and t-cat-diff (1000), total 1100
    expect(resultConto[0].spent).toBe(1100);
  });

  // --- CASI LIMITE ---

  test('Caso Limite 1: Numero minimo di periodi da analizzare (< 2)', () => {
    const result = calculateBudgetTrend(mockBudget, mockTransactions, 1);

    expect(result.trend).toBe('stable');
    expect(result.changePercentage).toBe(0);
    expect(result.averageSpending).toBe(100);
  });

  test('Caso Limite 2: Spesa passata nulla (olderAvg = 0)', () => {
    const customTransactions: Transaction[] = [
      { id: '1', contoId: 'c1', tipo: 'uscita', importo: 100, data: '2026-06-20T00:00:00Z', descrizione: '', categoriaId: 'cat-1', ricorrente: false, cifrato: false },
    ];

    const result = calculateBudgetTrend(mockBudget, customTransactions, 2);
    expect(result.changePercentage).toBe(0);
  });

  test('Caso Limite 3: Target budget nullo (importoTarget = 0)', () => {
    mockBudget.importoTarget = 0;
    const result = getBudgetHistoricalData(mockBudget, mockTransactions, 1);
    expect(result[0].percentage).toBe(0);
  });

  // --- CASI DI ERRORE ---

  test('Caso Errore 1: Periodo del budget non supportato', () => {
    mockBudget.periodo = 'settimanale' as any;
    expect(() => getBudgetHistoricalData(mockBudget, mockTransactions)).toThrow();
  });
});
