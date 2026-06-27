import { calculateBudgetForecast, getForecastMethodLabel, getConfidenceLabel, getConfidenceDescription } from '../budget-forecasting';
import { getBudgetHistoricalData } from '../budget-history';
import { Budget, Transaction } from '../types';

jest.mock('../budget-history', () => ({
  getBudgetHistoricalData: jest.fn(),
}));

const mockGetBudgetHistoricalData = getBudgetHistoricalData as jest.MockedFunction<
  typeof getBudgetHistoricalData
>;

describe('Budget Forecasting', () => {
  let mockBudget: Budget;
  let mockTransactions: Transaction[];

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-15T12:00:00Z'));

    mockBudget = {
      id: 'budget-1',
      nome: 'Test Budget',
      importoTarget: 1000,
      dataInizio: '2026-06-01T00:00:00.000Z',
      dataFine: '2026-06-30T23:59:59.000Z',
      periodo: 'mensile',
      attivo: true,
    };

    mockTransactions = [
      {
        id: 't-1',
        contoId: 'conto-1',
        tipo: 'uscita',
        importo: 100,
        data: '2026-06-05T12:00:00.000Z',
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
        data: '2026-06-10T12:00:00.000Z',
        descrizione: 'Spesa 2',
        categoriaId: 'cat-1',
        ricorrente: false,
        cifrato: false,
      },
    ];

    mockGetBudgetHistoricalData.mockReturnValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // --- CASI NORMALI ---

  test('Caso 1: Periodo concluso (now > budget.dataFine)', () => {
    jest.setSystemTime(new Date('2026-07-05T12:00:00Z'));
    const result = calculateBudgetForecast(mockBudget, mockTransactions);

    expect(result.daysRemaining).toBe(0);
    expect(result.confidence).toBe('high');
    expect(result.forecastMethod).toBe('current-trend');
    expect(result.projectedSpending).toBe(300);
    expect(result.willExceedBudget).toBe(false);
  });

  test('Caso 2: Fase iniziale del periodo (daysElapsed < 5) con storico sufficiente', () => {
    // now = 2026-06-03 (2 days elapsed)
    jest.setSystemTime(new Date('2026-06-03T12:00:00Z'));

    // Mock 4 past periods + 1 current period = 5 periods total
    mockGetBudgetHistoricalData.mockReturnValue([
      { spent: 400 } as any,
      { spent: 500 } as any,
      { spent: 600 } as any,
      { spent: 500 } as any,
      { spent: 300 } as any, // Current period (ignored in slice)
    ]);

    const result = calculateBudgetForecast(mockBudget, mockTransactions);

    expect(result.forecastMethod).toBe('historical-average');
    // average of 400, 500, 600, 500 = 500
    expect(result.projectedSpending).toBe(500);
    expect(result.confidence).toBe('medium'); // pastPeriodsData.length is 4 (>= 3)
  });

  test('Caso 2b: Fase iniziale del periodo (daysElapsed < 5) con storico scarso', () => {
    jest.setSystemTime(new Date('2026-06-03T12:00:00Z'));

    mockGetBudgetHistoricalData.mockReturnValue([
      { spent: 400 } as any,
      { spent: 300 } as any, // Current period
    ]);

    const result = calculateBudgetForecast(mockBudget, mockTransactions);

    expect(result.forecastMethod).toBe('historical-average');
    expect(result.projectedSpending).toBe(400);
    expect(result.confidence).toBe('low'); // pastPeriodsData.length is 1 (< 3)
  });

  test('Caso 3: Primo quarto del periodo (daysElapsed / totalDays < 0.25)', () => {
    // totalDays = 30 (from 2026-06-01 to 2026-06-30 is 30 days)
    // now = 2026-06-06 (5.5 days elapsed -> Math.ceil = 6)
    jest.setSystemTime(new Date('2026-06-06T12:00:00Z'));

    mockGetBudgetHistoricalData.mockReturnValue([
      { spent: 500 } as any,
      { spent: 500 } as any,
      { spent: 500 } as any,
      { spent: 300 } as any, // Current
    ]);

    // Current spending = 100 (t-1: 2026-06-05)
    // currentDailyAverage = 100 / 6 = 16.666...
    // daysRemaining = 25
    // currentTrendProjection = 100 + 16.666... * 25 = 516.666...
    // averageHistoricalSpending = 500
    // weighted = 516.666... * 0.4 + 500 * 0.6 = 206.666... + 300 = 506.666...
    const result = calculateBudgetForecast(mockBudget, mockTransactions);

    expect(result.forecastMethod).toBe('weighted');
    expect(result.projectedSpending).toBeCloseTo(506.66666666666674, 5);
    expect(result.confidence).toBe('medium'); // length 3 >= 3
  });

  test('Caso 4: Metà del periodo (daysElapsed / totalDays < 0.5)', () => {
    // now = 2026-06-11 (10.5 days elapsed -> Math.ceil = 11)
    jest.setSystemTime(new Date('2026-06-11T12:00:00Z'));

    mockGetBudgetHistoricalData.mockReturnValue([
      { spent: 500 } as any,
      { spent: 500 } as any,
      { spent: 300 } as any, // Current
    ]);

    // Current spending = 300 (t-1 + t-2)
    // currentDailyAverage = 300 / 11 = 27.2727...
    // daysRemaining = 20
    // currentTrendProjection = 300 + 27.2727... * 20 = 845.4545...
    // averageHistoricalSpending = 500
    // weighted = 845.4545... * 0.6 + 500 * 0.4 = 507.2727... + 200 = 707.2727...
    const result = calculateBudgetForecast(mockBudget, mockTransactions);

    expect(result.forecastMethod).toBe('weighted');
    expect(result.projectedSpending).toBeCloseTo(707.2727272727273, 5);
    expect(result.confidence).toBe('high'); // length 2 >= 2
  });

  test('Caso 5: Seconda metà del periodo (daysElapsed / totalDays >= 0.5)', () => {
    // now = 2026-06-16 (15.5 days elapsed -> Math.ceil = 16)
    jest.setSystemTime(new Date('2026-06-16T12:00:00Z'));

    // Current spending = 300 (t-1 + t-2)
    // currentDailyAverage = 300 / 16 = 18.75
    // daysRemaining = 15
    // currentTrendProjection = 300 + 18.75 * 15 = 581.25
    const result = calculateBudgetForecast(mockBudget, mockTransactions);

    expect(result.forecastMethod).toBe('current-trend');
    expect(result.projectedSpending).toBe(581.25);
    expect(result.confidence).toBe('high');
  });

  test('Caso 6: Filtro transazioni per Categoria', () => {
    mockBudget.categoriaId = 'cat-1';
    jest.setSystemTime(new Date('2026-06-16T12:00:00Z'));

    const result = calculateBudgetForecast(mockBudget, mockTransactions);
    // both t-1 and t-2 are cat-1 and uscita, spent = 300.
    expect(result.projectedSpending).toBe(581.25);

    // adding transaction of a different category
    const extendedTransactions: Transaction[] = [
      ...mockTransactions,
      {
        id: 't-3',
        contoId: 'conto-1',
        tipo: 'uscita',
        importo: 1000,
        data: '2026-06-12T12:00:00.000Z',
        descrizione: 'Spesa differente cat',
        categoriaId: 'cat-different',
        ricorrente: false,
        cifrato: false,
      },
    ];

    const resultFiltered = calculateBudgetForecast(mockBudget, extendedTransactions);
    // t-3 should be ignored because of category filter, so projectedSpending should remain 581.25.
    expect(resultFiltered.projectedSpending).toBe(581.25);
  });

  test('Caso 7: Filtro transazioni per Conto', () => {
    mockBudget.contoId = 'conto-1';
    jest.setSystemTime(new Date('2026-06-16T12:00:00Z'));

    const extendedTransactions: Transaction[] = [
      ...mockTransactions,
      {
        id: 't-3',
        contoId: 'conto-different',
        tipo: 'uscita',
        importo: 1000,
        data: '2026-06-12T12:00:00.000Z',
        descrizione: 'Conto differente',
        categoriaId: 'cat-1',
        ricorrente: false,
        cifrato: false,
      },
    ];

    const result = calculateBudgetForecast(mockBudget, extendedTransactions);
    // t-3 should be ignored because of conto filter
    expect(result.projectedSpending).toBe(581.25);
  });

  // --- CASI LIMITE ---

  test('Storico assente', () => {
    jest.setSystemTime(new Date('2026-06-03T12:00:00Z')); // daysElapsed = 2
    mockGetBudgetHistoricalData.mockReturnValue([]); // empty historical

    const result = calculateBudgetForecast(mockBudget, mockTransactions);
    expect(result.projectedSpending).toBe(0);
    expect(result.confidence).toBe('low');
  });

  test('Target budget pari a zero (importoTarget = 0)', () => {
    mockBudget.importoTarget = 0;
    jest.setSystemTime(new Date('2026-06-16T12:00:00Z'));

    const result = calculateBudgetForecast(mockBudget, mockTransactions);
    expect(result.projectedPercentage).toBe(Infinity);
    expect(result.projectedRemaining).toBe(-581.25);
  });

  test('Transazioni del periodo assenti', () => {
    jest.setSystemTime(new Date('2026-06-16T12:00:00Z'));

    const result = calculateBudgetForecast(mockBudget, []);
    expect(result.currentDailyAverage).toBe(0);
    expect(result.projectedSpending).toBe(0);
  });

  test('Date coincidenti (dataInizio === dataFine)', () => {
    mockBudget.dataFine = mockBudget.dataInizio;
    jest.setSystemTime(new Date('2026-06-01T12:00:00Z')); // past dataFine, returns early

    const result = calculateBudgetForecast(mockBudget, []);
    expect(result.historicalDailyAverage).toBe(0);
  });

  test('Date coincidenti senza early return (now === dataFine)', () => {
    mockBudget.dataFine = mockBudget.dataInizio = '2026-06-01T00:00:00.000Z';
    jest.setSystemTime(new Date('2026-06-01T00:00:00.000Z')); // now === dataFine (no early return now > dataFine)

    const result = calculateBudgetForecast(mockBudget, []);
    expect(result.historicalDailyAverage).toBe(NaN); // 0 / 0
  });

  // --- CASI DI ERRORE ---

  test('Date del budget non valide', () => {
    mockBudget.dataInizio = 'invalid-date';
    const result = calculateBudgetForecast(mockBudget, []);
    expect(result.daysElapsed).toBeNaN();
    expect(result.projectedSpending).toBe(0);
  });

  test('Data fine antecedente a data inizio', () => {
    mockBudget.dataInizio = '2026-06-30T00:00:00.000Z';
    mockBudget.dataFine = '2026-06-01T00:00:00.000Z';
    jest.setSystemTime(new Date('2026-06-15T12:00:00Z'));

    const result = calculateBudgetForecast(mockBudget, []);
    expect(result.daysElapsed).toBeLessThan(0);
  });

  // --- LABEL FUNCTIONS ---

  test('getForecastMethodLabel returns correct strings', () => {
    expect(getForecastMethodLabel('current-trend')).toBe('Basato sulla tendenza corrente');
    expect(getForecastMethodLabel('historical-average')).toBe('Basato sulla media storica');
    expect(getForecastMethodLabel('weighted')).toBe('Basato su tendenza e storico');
  });

  test('getConfidenceLabel returns correct strings', () => {
    expect(getConfidenceLabel('high')).toBe('Alta affidabilità');
    expect(getConfidenceLabel('medium')).toBe('Media affidabilità');
    expect(getConfidenceLabel('low')).toBe('Bassa affidabilità');
  });

  test('getConfidenceDescription returns correct description', () => {
    const forecast: any = {
      confidence: 'high',
      daysElapsed: 10,
      daysRemaining: 0,
      forecastMethod: 'current-trend',
    };

    expect(getConfidenceDescription(forecast)).toBe('Il periodo è concluso');

    forecast.daysRemaining = 5;
    expect(getConfidenceDescription(forecast)).toBe(
      'Con oltre 10 giorni di dati, la previsione si basa sulla tua spesa giornaliera attuale'
    );

    forecast.forecastMethod = 'weighted';
    expect(getConfidenceDescription(forecast)).toBe('Dati sufficienti per una previsione accurata');

    forecast.confidence = 'medium';
    expect(getConfidenceDescription(forecast)).toBe(
      'La previsione è moderatamente affidabile, basandosi su dati parziali e storico'
    );

    forecast.confidence = 'low';
    expect(getConfidenceDescription(forecast)).toBe(
      'Pochi dati disponibili - la previsione potrebbe essere meno accurata'
    );
  });
});
