import {
  roundCurrency,
  extractDatePart,
  calculateAccountBalance,
  formatCurrency,
  formatDate,
  formatDateShort,
  generateId,
  getTotalBalance,
  getTransactionsInPeriod,
  getTotalByType,
  groupTransactionsByCategory,
  exportToCSV,
  getBudgetProgress,
  getActiveBudgets,
  getBudgetPeriodDates,
  getSavingsGoalProgress,
  calculateSavingsProjection,
} from '../helpers';
import { Account, Transaction, Budget } from '../types';

describe('Helpers', () => {
  let spyNumberFormat: jest.SpyInstance;
  let spyDateTimeFormat: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-15T12:00:00Z'));

    // Mock Intl.NumberFormat and Intl.DateTimeFormat for Case 4 stability
    spyNumberFormat = jest.spyOn(Intl, 'NumberFormat').mockImplementation((locale, options) => {
      return {
        format: (val: number) => `MOCKED_CURRENCY ${val}`,
      } as any;
    });

    spyDateTimeFormat = jest.spyOn(Intl, 'DateTimeFormat').mockImplementation((locale, options) => {
      return {
        format: (val: Date) => `MOCKED_DATE`,
      } as any;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    spyNumberFormat.mockRestore();
    spyDateTimeFormat.mockRestore();
    jest.restoreAllMocks();
  });

  // --- CASI NORMALI ---

  test('Caso 1: Arrotondamento valutario (roundCurrency)', () => {
    expect(roundCurrency(123.456)).toBe(123.46);
    expect(roundCurrency(123.444)).toBe(123.44);
    expect(roundCurrency(-123.456)).toBe(-123.46);
  });

  test('Caso 2: Estrazione parte data (extractDatePart)', () => {
    expect(extractDatePart('2026-06-27T17:25:20.000Z')).toBe('2026-06-27');
    expect(extractDatePart('2026-06-27')).toBe('2026-06-27');
  });

  test('Caso 3: Calcolo saldo conto (calculateAccountBalance)', () => {
    const mockAccount: Account = {
      id: 'conto-1',
      nome: 'Conto Principale',
      tipo: 'bancario',
      saldoIniziale: 500,
      valuta: 'EUR',
      isPrivato: false,
      dataCreazione: '2026-06-01',
      archiviato: false,
    };

    const mockTransactions: Transaction[] = [
      { id: 't-1', contoId: 'conto-1', tipo: 'entrata', importo: 100, data: '2026-06-05', descrizione: '', categoriaId: 'c-1', ricorrente: false, cifrato: false },
      { id: 't-2', contoId: 'conto-1', tipo: 'uscita', importo: 50, data: '2026-06-06', descrizione: '', categoriaId: 'c-2', ricorrente: false, cifrato: false },
      { id: 't-3', contoId: 'conto-1', contoDestinazioneId: 'conto-2', tipo: 'trasferimento', importo: 200, data: '2026-06-07', descrizione: '', categoriaId: 'c-3', ricorrente: false, cifrato: false },
      { id: 't-4', contoId: 'conto-2', contoDestinazioneId: 'conto-1', tipo: 'trasferimento', importo: 300, data: '2026-06-08', descrizione: '', categoriaId: 'c-3', ricorrente: false, cifrato: false },
    ];

    // balance = 500 + 100 (entrata) - 50 (uscita) - 200 (trasferimento in uscita) + 300 (trasferimento in entrata) = 650
    expect(calculateAccountBalance(mockAccount, mockTransactions)).toBe(650);
  });

  test('Caso 4: Formattazione valuta e date (formatCurrency, formatDate)', () => {
    expect(formatCurrency(150.5, 'EUR')).toBe('MOCKED_CURRENCY 150.5');
    expect(spyNumberFormat).toHaveBeenCalledWith('it-IT', { style: 'currency', currency: 'EUR' });

    expect(formatDate('2026-06-27')).toBe('MOCKED_DATE');
    expect(spyDateTimeFormat).toHaveBeenCalledWith('it-IT');
  });

  test('Caso 5: Raggruppamento per Categoria (groupTransactionsByCategory)', () => {
    const mockCategories = [
      { id: 'c-1', nome: 'Alimentari' },
      { id: 'c-2', nome: 'Trasporti' },
    ];

    const mockTransactions: Transaction[] = [
      { id: '1', contoId: 'conto-1', tipo: 'uscita', importo: 100, data: '2026-06-05', descrizione: '', categoriaId: 'c-1', ricorrente: false, cifrato: false },
      { id: '2', contoId: 'conto-1', tipo: 'uscita', importo: 200, data: '2026-06-06', descrizione: '', categoriaId: 'c-2', ricorrente: false, cifrato: false },
      { id: '3', contoId: 'conto-1', tipo: 'uscita', importo: 150, data: '2026-06-07', descrizione: '', categoriaId: 'c-1', ricorrente: false, cifrato: false },
      { id: '4', contoId: 'conto-1', tipo: 'entrata', importo: 500, data: '2026-06-08', descrizione: '', categoriaId: 'c-1', ricorrente: false, cifrato: false }, // entrata, ignored
    ];

    const result = groupTransactionsByCategory(mockTransactions, mockCategories);
    // Alimentari = 100 + 150 = 250
    // Trasporti = 200
    expect(result).toEqual([
      { categoria: 'Alimentari', totale: 250 },
      { categoria: 'Trasporti', totale: 200 },
    ]);
  });

  test('Caso 6: Esportazione CSV (exportToCSV)', () => {
    const mockAccount: Account = {
      id: 'conto-1',
      nome: 'Conto A',
      tipo: 'bancario',
      saldoIniziale: 0,
      valuta: 'EUR',
      isPrivato: false,
      dataCreazione: '2026-01-01',
      archiviato: false,
    };

    const mockCategory = { id: 'c-1', nome: 'Cibo' };

    const mockTransactions: Transaction[] = [
      {
        id: 't-1',
        contoId: 'conto-1',
        tipo: 'uscita',
        importo: 10.5,
        data: '2026-06-20',
        descrizione: 'Pizza',
        categoriaId: 'c-1',
        ricorrente: false,
        cifrato: false,
      },
    ];

    const csv = exportToCSV(mockTransactions, [mockAccount], [mockCategory]);
    // headers: Data,Tipo,Importo,Conto,Categoria,Descrizione,Ricorrente
    // t-1 formatted row: "MOCKED_DATE","uscita","10.5","Conto A","Cibo","Pizza","No"
    expect(csv).toContain('Data,Tipo,Importo,Conto,Categoria,Descrizione,Ricorrente');
    expect(csv).toContain('"MOCKED_DATE","uscita","10.5","Conto A","Cibo","Pizza","No"');
  });

  test('Caso 7: Proiezioni di Risparmio (calculateSavingsProjection)', () => {
    const goal = {
      importoTarget: 1000,
      importoCorrente: 200,
      dataInizio: '2026-06-01T00:00:00.000Z',
      dataScadenza: '2026-06-21T00:00:00.000Z', // 20 days total
    };

    // now = 2026-06-15.
    // elapsedDays = (15 - 1) = 14 days
    // remainingDays = (21 - 15) = 6 days
    // remainingAmount = 800
    // weeklyRequired = 800 / 5.5 * 7 = 1018.1818...
    // monthlyRequired = 800 / 5.5 * 30 = 4363.6363...
    // expectedProgress = 14 / 20 * 1000 = 700
    // actualProgress = 200 (200 < 700 * 0.9 = 630 so onTrack = false)
    // rate = 200 / 14 = 14.285...
    // daysToComplete = 800 / 14.285 = 56 days
    const result = calculateSavingsProjection(goal);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.onTrack).toBe(false);
      expect(result.weeklyRequired).toBeCloseTo(1018.1818181818182, 3);
      expect(result.monthlyRequired).toBeCloseTo(4363.636363636364, 3);
      expect(result.projectedCompletion).toBeDefined();
    }
  });

  // --- CASI LIMITE ---

  test('Caso Limite 1: Trasferimento sullo stesso conto', () => {
    const mockAccount: Account = {
      id: 'conto-1',
      nome: 'Conto Principale',
      tipo: 'bancario',
      saldoIniziale: 500,
      valuta: 'EUR',
      isPrivato: false,
      dataCreazione: '2026-06-01',
      archiviato: false,
    };

    const mockTransactions: Transaction[] = [
      {
        id: 't-1',
        contoId: 'conto-1',
        contoDestinazioneId: 'conto-1',
        tipo: 'trasferimento',
        importo: 100,
        data: '2026-06-05',
        descrizione: 'Giroconto stesso conto',
        categoriaId: 'c-1',
        ricorrente: false,
        cifrato: false,
      },
    ];

    // balance = 500 - 100 + 100 = 500
    expect(calculateAccountBalance(mockAccount, mockTransactions)).toBe(500);
  });

  test('Caso Limite 2: ID generati nello stesso millisecondo', () => {
    const spyDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    const spyMathRandom = jest.spyOn(Math, 'random').mockReturnValue(0.123456789);

    const id1 = generateId();
    const id2 = generateId();

    expect(id1).toBe(id2); // because spies return same values
    expect(id1).toContain('1234567890');

    spyDateNow.mockRestore();
    spyMathRandom.mockRestore();
  });

  test('Caso Limite 3: Scadenze degli obiettivi scadute', () => {
    const goal = {
      importoTarget: 1000,
      importoCorrente: 500,
      dataInizio: '2026-06-01',
      dataScadenza: '2026-06-10', // deadline in the past relative to 2026-06-15
    };

    const result = getSavingsGoalProgress(goal);
    expect(result.isOverdue).toBe(true);
    expect(result.daysRemaining).toBeLessThan(0);
    expect(result.isComplete).toBe(false);
  });

  test('Caso Limite 4: Target nullo (importoTarget = 0)', () => {
    const budget: Budget = {
      id: 'b-1',
      nome: '',
      importoTarget: 0,
      dataInizio: '2026-06-01',
      dataFine: '2026-06-30',
      periodo: 'mensile',
      attivo: true,
    };

    const result = getBudgetProgress(budget, []);
    expect(result.percentage).toBe(0);
  });

  // --- CASI DI ERRORE ---

  test('Caso Errore 1: Presenza di virgolette nei campi delle transazioni nel CSV', () => {
    const mockAccount: Account = {
      id: 'conto-1',
      nome: 'Conto A',
      tipo: 'bancario',
      saldoIniziale: 0,
      valuta: 'EUR',
      isPrivato: false,
      dataCreazione: '2026-01-01',
      archiviato: false,
    };
    const mockCategory = { id: 'c-1', nome: 'Cibo' };

    const mockTransactions: Transaction[] = [
      {
        id: 't-1',
        contoId: 'conto-1',
        tipo: 'uscita',
        importo: 10,
        data: '2026-06-20',
        descrizione: 'Pizza "Margherita"',
        categoriaId: 'c-1',
        ricorrente: false,
        cifrato: false,
      },
    ];

    const csv = exportToCSV(mockTransactions, [mockAccount], [mockCategory]);
    expect(csv).toContain('"Pizza ""Margherita"""');
  });

  test('Caso Errore 2: Date non parseabili', () => {
    // formatDateShort with invalid date
    const result = formatDateShort('invalid-date');
    expect(result).toBe('NaN/NaN/aN');
  });
});
