jest.mock('@/announcements/_utils/t', () => ({
  t: jest.fn((key: string, params?: Record<string, unknown>) => {
    if (params) {
      return `${key}:${JSON.stringify(params)}`;
    }
    return key;
  }),
}));

jest.mock('@/announcements/_utils/currency', () => ({
  formatCurrencyVocal: jest.fn((val: number) => `VOCAL:${val}`),
}));

jest.mock('@/announcements/_utils/plurals', () => ({
  pluralize: jest.fn((word: string, count: number) =>
    count === 1 ? word : `${word}_plurale`,
  ),
}));

import { t } from '@/announcements/_utils/t';
import { formatCurrencyVocal } from '@/announcements/_utils/currency';
import { pluralize } from '@/announcements/_utils/plurals';
import {
  announceAccountCreated,
  announceAccountModified,
  announceAccountDeleted,
  announceAccountDeletedGeneric,
  announceTransaction,
  announceTransactionModified,
  announceTransactionDeleted,
  announceTransfer,
  announceAccountBalance,
  announceRecentTransactions,
  announceExportCSV,
  announceExport,
  announceImportComplete,
  announceExportInProgress,
  announceExportFile,
  exportError,
} from '@/announcements/accounts';
import type { ExportFailureReason } from '@/lib/export-service';
import {
  expectAssertive,
  expectPolite,
  expectTCalledWith,
} from './helpers/announcements-test-utils';

const mockT = t as unknown as jest.Mock;
const mockFormatCurrencyVocal = formatCurrencyVocal as unknown as jest.Mock;
const mockPluralize = pluralize as unknown as jest.Mock;

describe('accounts announcements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ANNA-01 | announceAccountCreated("Conto", "corrente", 1234.56) -> priority polite', () => {
    const result = announceAccountCreated('Conto', 'corrente', 1234.56);
    expectPolite(result);
    expect(mockFormatCurrencyVocal).toHaveBeenCalledWith(1234.56);
    expectTCalledWith(mockT, 'conto_creato', {
      name: 'Conto',
      type: 'corrente',
      amount: 'VOCAL:1234.56',
    });
  });

  test('ANNA-02 | announceAccountModified("Conto") -> priority polite', () => {
    const result = announceAccountModified('Conto');
    expectPolite(result);
    expectTCalledWith(mockT, 'conto_modificato', { name: 'Conto' });
  });

  test('ANNA-03 | announceAccountDeleted("Conto", true) -> HadTransactions: true', () => {
    const result = announceAccountDeleted('Conto', true);
    expectPolite(result);
    expectTCalledWith(mockT, 'conto_eliminato_con_movimenti', { name: 'Conto' });
  });

  test('ANNA-04 | announceAccountDeleted("Conto", false) -> HadTransactions: false', () => {
    const result = announceAccountDeleted('Conto', false);
    expectPolite(result);
    expectTCalledWith(mockT, 'conto_eliminato', { name: 'Conto' });
  });

  test('ANNA-05 | announceAccountDeletedGeneric() -> priority polite', () => {
    const result = announceAccountDeletedGeneric();
    expectPolite(result);
    expectTCalledWith(mockT, 'conto_eliminato_generico');
  });

  test('ANNA-06 | announceTransaction("Uscita", 99.50, "Conto Corrente") -> priority polite', () => {
    const result = announceTransaction('Uscita', 99.50, 'Conto Corrente');
    expectPolite(result);
    expect(mockFormatCurrencyVocal).toHaveBeenCalledWith(99.50);
    expectTCalledWith(mockT, 'movimento_aggiunto', {
      type: 'Uscita',
      amount: 'VOCAL:99.5',
      name: 'Conto Corrente',
    });
  });

  test('ANNA-07 | announceTransactionModified() -> priority polite', () => {
    const result = announceTransactionModified();
    expectPolite(result);
    expectTCalledWith(mockT, 'movimento_modificato');
  });

  test('ANNA-08 | announceTransactionDeleted() -> priority polite', () => {
    const result = announceTransactionDeleted();
    expectPolite(result);
    expectTCalledWith(mockT, 'movimento_eliminato');
  });

  test('ANNA-09 | announceTransfer(500, "Conto A", "Conto B") -> priority polite', () => {
    const result = announceTransfer(500, 'Conto A', 'Conto B');
    expectPolite(result);
    expect(mockFormatCurrencyVocal).toHaveBeenCalledWith(500);
    expectTCalledWith(mockT, 'trasferimento_completato', {
      amount: 'VOCAL:500',
      from: 'Conto A',
      to: 'Conto B',
    });
  });

  test('ANNA-10 | announceAccountBalance("Conto", 2500.00) -> priority polite', () => {
    const result = announceAccountBalance('Conto', 2500.00);
    expectPolite(result);
    expect(mockFormatCurrencyVocal).toHaveBeenCalledWith(2500.00);
    expectTCalledWith(mockT, 'saldo_conto', {
      name: 'Conto',
      amount: 'VOCAL:2500',
    });
  });

  test('ANNA-11 | announceRecentTransactions(1) -> calls pluralize and is singular', () => {
    const result = announceRecentTransactions(1);
    expectPolite(result);
    expect(mockPluralize).toHaveBeenCalledWith('movimento', 1);
    expectTCalledWith(mockT, 'movimenti_recenti', {
      count: 1,
      plural_movimento: 'movimento',
    });
  });

  test('ANNA-12 | announceRecentTransactions(5) -> calls pluralize and is plural', () => {
    const result = announceRecentTransactions(5);
    expectPolite(result);
    expect(mockPluralize).toHaveBeenCalledWith('movimento', 5);
    expectTCalledWith(mockT, 'movimenti_recenti', {
      count: 5,
      plural_movimento: 'movimento_plurale',
    });
  });

  test('ANNA-13 | announceRecentTransactions(0) -> zero case', () => {
    const result = announceRecentTransactions(0);
    expectPolite(result);
    expect(mockPluralize).toHaveBeenCalledWith('movimento', 0);
    expectTCalledWith(mockT, 'movimenti_recenti', {
      count: 0,
      plural_movimento: 'movimento_plurale',
    });
  });

  test('ANNA-14 | announceExportCSV(1) -> singular', () => {
    const result = announceExportCSV(1);
    expectPolite(result);
    expect(mockPluralize).toHaveBeenCalledWith('movimento', 1);
    expectTCalledWith(mockT, 'export_csv_completato', {
      count: 1,
      plural_movimento: 'movimento',
    });
  });

  test('ANNA-15 | announceExportCSV(10) -> plural', () => {
    const result = announceExportCSV(10);
    expectPolite(result);
    expect(mockPluralize).toHaveBeenCalledWith('movimento', 10);
    expectTCalledWith(mockT, 'export_csv_completato', {
      count: 10,
      plural_movimento: 'movimento_plurale',
    });
  });

  test('ANNA-16 | announceExport(1) -> singular', () => {
    const result = announceExport(1);
    expectPolite(result);
    expect(mockPluralize).toHaveBeenCalledWith('elemento', 1);
    expectTCalledWith(mockT, 'export_completato', {
      count: 1,
      plural_elemento: 'elemento',
    });
  });

  test('ANNA-17 | announceExport(3) -> plural', () => {
    const result = announceExport(3);
    expectPolite(result);
    expect(mockPluralize).toHaveBeenCalledWith('elemento', 3);
    expectTCalledWith(mockT, 'export_completato', {
      count: 3,
      plural_elemento: 'elemento_plurale',
    });
  });

  test('ANNA-18 | announceImportComplete(1) -> singular', () => {
    const result = announceImportComplete(1);
    expectPolite(result);
    expect(mockPluralize).toHaveBeenCalledWith('elemento', 1);
    expectTCalledWith(mockT, 'import_completato', {
      count: 1,
      plural_elemento: 'elemento',
    });
  });

  test('ANNA-19 | announceExportInProgress() -> priority polite', () => {
    const result = announceExportInProgress();
    expectPolite(result);
    expectTCalledWith(mockT, 'export_in_corso');
  });

  test('ANNA-20 | announceExportFile(5) -> ignores count', () => {
    const result = announceExportFile(5);
    expectPolite(result);
    expectTCalledWith(mockT, 'export_success_sr');
  });

  const errorCases: Array<[Exclude<ExportFailureReason, 'CANCELLED'>, string]> = [
    ['ALREADY_IN_PROGRESS', 'export_already_in_progress_sr'],
    ['PERMISSION_DENIED', 'export_permission_denied_sr'],
    ['FILESYSTEM_ERROR', 'export_filesystem_error_sr'],
    ['UNSUPPORTED_PLATFORM', 'export_unsupported_platform_sr'],
    ['INVALID_PATH', 'export_invalid_path_sr'],
    ['INSUFFICIENT_SPACE', 'export_insufficient_space_sr'],
    ['UNKNOWN', 'export_unknown_error_sr'],
  ];

  test.each(errorCases)(
    'ANNA-21 | exportError(%s) -> priority assertive, key: %s',
    (reason, expectedKey) => {
      const result = exportError(reason);
      expectAssertive(result);
      expectTCalledWith(mockT, expectedKey);
    },
  );
});
