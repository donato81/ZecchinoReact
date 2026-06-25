import {
  extractMonthTransactions,
  aggregateByCategory,
  computeMonthlyComparison,
} from '../src/lib/monthly-comparison';
import {
  Transaction,
  Category,
  MonthlyComparisonOptions,
} from '../src/lib/types';

describe('monthly-comparison', () => {
  const mockCategories: Category[] = [
    { id: 'cat-1', nome: 'Alimentari', tipo: 'uscita', predefinita: false },
    { id: 'cat-2', nome: 'Trasporti', tipo: 'uscita', predefinita: false },
    { id: 'cat-3', nome: 'Stipendio', tipo: 'entrata', predefinita: false },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 't1',
      data: '2026-05-15',
      importo: -50.123,
      tipo: 'uscita',
      contoId: 'c1',
      categoriaId: 'cat-1',
      descrizione: '',
      ricorrente: false,
      cifrato: false,
    },
    {
      id: 't2',
      data: '2026-05-16',
      importo: -20,
      tipo: 'uscita',
      contoId: 'c1',
      categoriaId: 'cat-1',
      descrizione: '',
      ricorrente: false,
      cifrato: false,
    },
    {
      id: 't3',
      data: '2026-04-10',
      importo: -60,
      tipo: 'uscita',
      contoId: 'c1',
      categoriaId: 'cat-1',
      descrizione: '',
      ricorrente: false,
      cifrato: false,
    },
    {
      id: 't4',
      data: '2026-05-20',
      importo: -30,
      tipo: 'uscita',
      contoId: 'c1',
      categoriaId: 'cat-2',
      descrizione: '',
      ricorrente: false,
      cifrato: false,
    },
    {
      id: 't5',
      data: '2026-04-20',
      importo: 100,
      tipo: 'entrata',
      contoId: 'c1',
      categoriaId: 'cat-3',
      descrizione: '',
      ricorrente: false,
      cifrato: false,
    },
    {
      id: 't6',
      data: '2026-05-20',
      importo: 150,
      tipo: 'entrata',
      contoId: 'c1',
      categoriaId: 'cat-3',
      descrizione: '',
      ricorrente: false,
      cifrato: false,
    },
    {
      id: 't7',
      data: '2026-05-25',
      importo: -10,
      tipo: 'trasferimento',
      contoId: 'c1',
      categoriaId: 'cat-1',
      descrizione: '',
      ricorrente: false,
      cifrato: false,
    },
    {
      id: 't8',
      data: '2025-12-31T23:50:00.000Z',
      importo: -100,
      tipo: 'uscita',
      contoId: 'c1',
      categoriaId: 'cat-1',
      descrizione: '',
      ricorrente: false,
      cifrato: false,
    }, // cross-year
    {
      id: 't9',
      data: '2026-05-10',
      importo: -10,
      tipo: 'uscita',
      contoId: 'c1',
      categoriaId: 'cat-deleted',
      descrizione: '',
      ricorrente: false,
      cifrato: false,
    },
    {
      id: 't10',
      data: '2026-05-11',
      importo: -5,
      tipo: 'uscita',
      contoId: 'c1',
      categoriaId: '',
      descrizione: '',
      ricorrente: false,
      cifrato: false,
    },
  ];

  const baseOptions: MonthlyComparisonOptions = {
    baseYear: 2026,
    baseMonth: 4,
    compareYear: 2026,
    compareMonth: 5,
    movementType: 'uscita',
    excludeZeroRows: true,
  };

  describe('extractMonthTransactions', () => {
    it('filtra correttamente le transazioni per mese e tipo, escludendo i trasferimenti di default', () => {
      const tx = extractMonthTransactions(
        mockTransactions,
        2026,
        5,
        'uscita',
        false,
      );
      expect(tx).toHaveLength(5); // t1, t2, t4, t9, t10
      expect(tx.map(t => t.id)).toEqual(['t1', 't2', 't4', 't9', 't10']);
    });

    it('include i trasferimenti se richiesto', () => {
      const tx = extractMonthTransactions(
        mockTransactions,
        2026,
        5,
        'uscita',
        true,
      );
      expect(tx).toHaveLength(6); // include t7
      expect(tx.some(t => t.id === 't7')).toBe(true);
    });
  });

  describe('aggregateByCategory', () => {
    it('aggrega gli importi prendendo il valore assoluto', () => {
      const tx = extractMonthTransactions(mockTransactions, 2026, 5, 'uscita');
      const agg = aggregateByCategory(tx);
      expect(agg['cat-1']).toBeCloseTo(70.123, 3);
      expect(agg['cat-2']).toBe(30);
      expect(agg['cat-deleted']).toBe(10);
      expect(agg['nessuna']).toBe(5);
    });
  });

  describe('computeMonthlyComparison', () => {
    it('Scenario: due mesi con categorie comuni producono differenze corrette.', () => {
      const res = computeMonthlyComparison(
        mockTransactions,
        mockCategories,
        baseOptions,
      );
      const cat1 = res.find(r => r.categoriaId === 'cat-1');
      expect(cat1).toBeDefined();
      expect(cat1?.importoPeriodoBase).toBe(60);
      expect(cat1?.importoPeriodoConfronto).toBe(70.12);
      expect(cat1?.differenzaAssoluta).toBe(10.12); // 70.12 - 60
      expect(cat1?.differenzaPercentuale).toBeCloseTo(16.87, 2);
      expect(cat1?.tendenza).toBe('aumento');
      expect(cat1?.isNuova).toBe(false);
      expect(cat1?.isScomparsa).toBe(false);
    });

    it('Scenario: mese base vuoto con righe tutte nuove.', () => {
      const res = computeMonthlyComparison(mockTransactions, mockCategories, {
        ...baseOptions,
        baseMonth: 3, // Nessuna transazione
      });
      const cat1 = res.find(r => r.categoriaId === 'cat-1');
      expect(cat1?.importoPeriodoBase).toBe(0);
      expect(cat1?.differenzaPercentuale).toBeNull();
      expect(cat1?.tendenza).toBe('aumento');
      expect(cat1?.isNuova).toBe(true);
    });

    it('Scenario: mese confronto vuoto con righe tutte scomparse.', () => {
      const res = computeMonthlyComparison(mockTransactions, mockCategories, {
        ...baseOptions,
        compareMonth: 6, // Nessuna transazione
      });
      const cat1 = res.find(r => r.categoriaId === 'cat-1');
      expect(cat1?.importoPeriodoConfronto).toBe(0);
      expect(cat1?.differenzaPercentuale).toBe(-100);
      expect(cat1?.tendenza).toBe('riduzione');
      expect(cat1?.isScomparsa).toBe(true);
    });

    it('Scenario: base maggiore di zero e confronto zero produce -100 e isScomparsa true.', () => {
      // Come test sopra, lo stesso caso
      const res = computeMonthlyComparison(mockTransactions, mockCategories, {
        ...baseOptions,
        compareMonth: 6,
      });
      const cat1 = res.find(r => r.categoriaId === 'cat-1');
      expect(cat1?.differenzaPercentuale).toBe(-100);
      expect(cat1?.isScomparsa).toBe(true);
    });

    it('Scenario: base zero o assente e confronto positivo produce differenzaPercentuale null e isNuova true.', () => {
      const res = computeMonthlyComparison(
        mockTransactions,
        mockCategories,
        baseOptions,
      );
      const cat2 = res.find(r => r.categoriaId === 'cat-2'); // In aprile è zero
      expect(cat2?.importoPeriodoBase).toBe(0);
      expect(cat2?.importoPeriodoConfronto).toBe(30);
      expect(cat2?.differenzaPercentuale).toBeNull();
      expect(cat2?.isNuova).toBe(true);
    });

    it('Scenario: zero verso zero con excludeZeroRows false mantiene tendenza stabile e nessun valore non finito.', () => {
      const res = computeMonthlyComparison(mockTransactions, mockCategories, {
        ...baseOptions,
        baseMonth: 3,
        compareMonth: 6,
        excludeZeroRows: false,
      });
      // Entrambi vuoti.
      // aggregateByCategory restituirà oggetti vuoti, ma allCategoryIds sarà vuoto?
      // Se allCategoryIds è vuoto, res è []
      expect(res.length).toBe(0); // Nessuna categoria coinvolta.

      // Ma forziamo una transazione 0.
      const txWithZero = [
        {
          id: 'z1',
          data: '2026-04-10',
          importo: 0,
          tipo: 'uscita',
          contoId: 'c1',
          categoriaId: 'cat-zero',
          descrizione: '',
          ricorrente: false,
          cifrato: false,
        },
        {
          id: 'z2',
          data: '2026-05-10',
          importo: 0,
          tipo: 'uscita',
          contoId: 'c1',
          categoriaId: 'cat-zero',
          descrizione: '',
          ricorrente: false,
          cifrato: false,
        },
      ] as Transaction[];

      const res2 = computeMonthlyComparison(txWithZero, mockCategories, {
        ...baseOptions,
        excludeZeroRows: false,
      });

      const catZero = res2.find(r => r.categoriaId === 'cat-zero');
      expect(catZero?.differenzaPercentuale).toBeNull();
      expect(catZero?.tendenza).toBe('stabile');
    });

    it('Scenario: categoria eliminata conserva categoriaId e usa fallback corretto.', () => {
      const res = computeMonthlyComparison(
        mockTransactions,
        mockCategories,
        baseOptions,
      );
      const catDeleted = res.find(r => r.categoriaId === 'cat-deleted');
      expect(catDeleted).toBeDefined();
      expect(catDeleted?.categoriaId).toBe('cat-deleted');
      expect(catDeleted?.categoriaNome).toBe('Categoria eliminata'); // localizzazione testata
    });

    it('Scenario: ordinamento per differenza assoluta e tie-break deterministico.', () => {
      const tx = [
        {
          id: 'x1',
          data: '2026-04-10',
          importo: -10,
          tipo: 'uscita',
          contoId: 'c1',
          categoriaId: 'A',
          descrizione: '',
          ricorrente: false,
          cifrato: false,
        },
        {
          id: 'x2',
          data: '2026-05-10',
          importo: -30,
          tipo: 'uscita',
          contoId: 'c1',
          categoriaId: 'A',
          descrizione: '',
          ricorrente: false,
          cifrato: false,
        }, // diff: 20
        {
          id: 'x3',
          data: '2026-04-10',
          importo: -50,
          tipo: 'uscita',
          contoId: 'c1',
          categoriaId: 'B',
          descrizione: '',
          ricorrente: false,
          cifrato: false,
        },
        {
          id: 'x4',
          data: '2026-05-10',
          importo: -10,
          tipo: 'uscita',
          contoId: 'c1',
          categoriaId: 'B',
          descrizione: '',
          ricorrente: false,
          cifrato: false,
        }, // diff: 40
        {
          id: 'x5',
          data: '2026-04-10',
          importo: -10,
          tipo: 'uscita',
          contoId: 'c1',
          categoriaId: 'C',
          descrizione: '',
          ricorrente: false,
          cifrato: false,
        },
        {
          id: 'x6',
          data: '2026-05-10',
          importo: -30,
          tipo: 'uscita',
          contoId: 'c1',
          categoriaId: 'C',
          descrizione: '',
          ricorrente: false,
          cifrato: false,
        }, // diff: 20
      ] as Transaction[];

      const res = computeMonthlyComparison(tx, mockCategories, {
        baseYear: 2026,
        baseMonth: 4,
        compareYear: 2026,
        compareMonth: 5,
        movementType: 'uscita',
      });
      expect(res[0].categoriaId).toBe('B'); // diff 40
      expect(res[1].categoriaId).toBe('A'); // diff 20, A viene prima di C in ordine alfabetico
      expect(res[2].categoriaId).toBe('C'); // diff 20
    });

    it('Scenario: roundCurrency limita tutti gli importi a due decimali.', () => {
      const tx = [
        {
          id: 'y1',
          data: '2026-04-10',
          importo: -10.12345,
          tipo: 'uscita',
          contoId: 'c1',
          categoriaId: 'A',
          descrizione: '',
          ricorrente: false,
          cifrato: false,
        },
        {
          id: 'y2',
          data: '2026-05-10',
          importo: -20.6789,
          tipo: 'uscita',
          contoId: 'c1',
          categoriaId: 'A',
          descrizione: '',
          ricorrente: false,
          cifrato: false,
        },
      ] as Transaction[];
      const res = computeMonthlyComparison(tx, mockCategories, {
        baseYear: 2026,
        baseMonth: 4,
        compareYear: 2026,
        compareMonth: 5,
        movementType: 'uscita',
      });
      expect(res[0].importoPeriodoBase).toBe(10.12);
      expect(res[0].importoPeriodoConfronto).toBe(20.68);
      expect(res[0].differenzaAssoluta).toBe(10.56);
    });

    it('Scenario: includeTransfers false esclude i trasferimenti, true li include.', () => {
      // Già coperto parzialmente in extractMonthTransactions, vediamo i risultati
      const resFalse = computeMonthlyComparison(
        mockTransactions,
        mockCategories,
        { ...baseOptions, includeTransfers: false },
      );
      const resTrue = computeMonthlyComparison(
        mockTransactions,
        mockCategories,
        { ...baseOptions, includeTransfers: true },
      );

      const cat1False = resFalse.find(r => r.categoriaId === 'cat-1');
      const cat1True = resTrue.find(r => r.categoriaId === 'cat-1');

      expect(cat1False?.importoPeriodoConfronto).toBe(70.12);
      expect(cat1True?.importoPeriodoConfronto).toBe(80.12); // +10 dal trasferimento
    });

    it('Scenario: transazione vicina al cambio UTC viene assegnata al mese corretto tramite extractDatePart.', () => {
      const tx = extractMonthTransactions(mockTransactions, 2025, 12, 'uscita');
      expect(tx).toHaveLength(1);
      expect(tx[0].id).toBe('t8'); // 2025-12-31T23:50:00.000Z deve essere mappata a "2025-12-31" o giù di lì
    });

    it("Scenario: dataset grande non muta l'array originale; il tempo di esecuzione non supera i 100ms su un input di 1000 righe", () => {
      const largeTx: Transaction[] = [];
      for (let i = 0; i < 1000; i++) {
        largeTx.push({
          id: `tx-${i}`,
          data: i % 2 === 0 ? '2026-04-10' : '2026-05-10',
          importo: -10,
          tipo: 'uscita',
          contoId: 'c1',
          categoriaId: `cat-${i % 50}`, // 50 categories
          descrizione: '',
          ricorrente: false,
          cifrato: false,
        });
      }

      const start = performance.now();
      const res = computeMonthlyComparison(
        largeTx,
        mockCategories,
        baseOptions,
      );
      const end = performance.now();

      expect(end - start).toBeLessThan(100);
      expect(res.length).toBe(50);
      expect(largeTx.length).toBe(1000); // Immutabile
    });

    it('Scenario: collisione categoria eliminata/senza categoria', () => {
      const res = computeMonthlyComparison(
        mockTransactions,
        mockCategories,
        baseOptions,
      );
      const catDeleted = res.find(r => r.categoriaId === 'cat-deleted');
      const noCat = res.find(r => r.categoriaId === 'nessuna');

      expect(catDeleted).toBeDefined();
      expect(noCat).toBeDefined();
      expect(catDeleted?.categoriaNome).toBe('Categoria eliminata');
      expect(noCat?.categoriaNome).toBe('Senza categoria');
    });
  });
});
