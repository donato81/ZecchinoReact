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

import { t } from '@/announcements/_utils/t';
import { formatCurrencyVocal } from '@/announcements/_utils/currency';
import {
  announceBudgetCreated,
  announceBudgetModified,
  announceBudgetDeleted,
  announceBudgetDeletedGeneric,
  announceBudgetStatus,
  announceSavingsGoalCreated,
  announceSavingsGoalModified,
  announceSavingsGoalDeleted,
  announceSavingsGoalDeletedGeneric,
  announceSavingsGoalProgress,
  announceCategoryCreated,
} from '@/announcements/budgets';
import {
  expectAssertive,
  expectPolite,
  expectTCalledWith,
} from './helpers/announcements-test-utils';

const mockT = t as unknown as jest.Mock;
const mockFormatCurrencyVocal = formatCurrencyVocal as unknown as jest.Mock;

describe('budgets announcements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ANNB-01 | announceBudgetCreated("Spesa Casa", 1200, "mensile") -> priority polite', () => {
    const result = announceBudgetCreated('Spesa Casa', 1200, 'mensile');
    expectPolite(result);
    expect(mockFormatCurrencyVocal).toHaveBeenCalledWith(1200);
    expectTCalledWith(mockT, 'budget_creato', {
      name: 'Spesa Casa',
      amount: 'VOCAL:1200',
      period: 'mensile',
    });
  });

  test('ANNB-02 | announceBudgetModified("Spesa Casa") -> priority polite', () => {
    const result = announceBudgetModified('Spesa Casa');
    expectPolite(result);
    expectTCalledWith(mockT, 'budget_modificato', { name: 'Spesa Casa' });
  });

  test('ANNB-03 | announceBudgetDeleted("Spesa Casa") -> priority polite', () => {
    const result = announceBudgetDeleted('Spesa Casa');
    expectPolite(result);
    expectTCalledWith(mockT, 'budget_eliminato', { name: 'Spesa Casa' });
  });

  test('ANNB-04 | announceBudgetDeletedGeneric() -> priority polite', () => {
    const result = announceBudgetDeletedGeneric();
    expectPolite(result);
    expectTCalledWith(mockT, 'budget_eliminato_generico');
  });

  test('ANNB-05 | announceBudgetStatus("Spesa", 1200, 1000) (120%) -> priority assertive, key budget_superato', () => {
    const result = announceBudgetStatus('Spesa', 1200, 1000);
    expectAssertive(result);
    expect(mockFormatCurrencyVocal).toHaveBeenCalledWith(1200);
    expect(mockFormatCurrencyVocal).toHaveBeenCalledWith(1000);
    expectTCalledWith(mockT, 'budget_superato', {
      name: 'Spesa',
      spent: 'VOCAL:1200',
      target: 'VOCAL:1000',
    });
  });

  test('ANNB-06 | announceBudgetStatus("Spesa", 950, 1000) (95%) -> priority assertive, key budget_critico', () => {
    const result = announceBudgetStatus('Spesa', 950, 1000);
    expectAssertive(result);
    expect(mockFormatCurrencyVocal).toHaveBeenCalledWith(50); // remaining target - spent = 50
    expectTCalledWith(mockT, 'budget_critico', {
      name: 'Spesa',
      percent: 95,
      remaining: 'VOCAL:50',
    });
  });

  test('ANNB-07 | announceBudgetStatus("Spesa", 800, 1000) (80%) -> priority polite, key budget_attenzione', () => {
    const result = announceBudgetStatus('Spesa', 800, 1000);
    expectPolite(result);
    expect(mockFormatCurrencyVocal).toHaveBeenCalledWith(200); // remaining
    expectTCalledWith(mockT, 'budget_attenzione', {
      name: 'Spesa',
      percent: 80,
      remaining: 'VOCAL:200',
    });
  });

  test('ANNB-08 | announceBudgetStatus("Spesa", 500, 1000) (50%) -> priority polite, key budget_normale', () => {
    const result = announceBudgetStatus('Spesa', 500, 1000);
    expectPolite(result);
    expectTCalledWith(mockT, 'budget_normale', {
      name: 'Spesa',
      percent: 50,
    });
  });

  test('ANNB-09 | announceSavingsGoalCreated("Vacanze", 3000) -> priority polite', () => {
    const result = announceSavingsGoalCreated('Vacanze', 3000);
    expectPolite(result);
    expect(mockFormatCurrencyVocal).toHaveBeenCalledWith(3000);
    expectTCalledWith(mockT, 'obiettivo_creato', {
      name: 'Vacanze',
      amount: 'VOCAL:3000',
    });
  });

  test('ANNB-10 | announceSavingsGoalModified("Vacanze") -> priority polite', () => {
    const result = announceSavingsGoalModified('Vacanze');
    expectPolite(result);
    expectTCalledWith(mockT, 'obiettivo_modificato', { name: 'Vacanze' });
  });

  test('ANNB-11 | announceBudgetStatus("Spesa", 50, 0) (target zero, spent > 0) -> priority assertive, key budget_superato', () => {
    const result = announceBudgetStatus('Spesa', 50, 0);
    expectAssertive(result);
    expect(mockFormatCurrencyVocal).toHaveBeenCalledWith(50);
    expect(mockFormatCurrencyVocal).toHaveBeenCalledWith(0);
    expectTCalledWith(mockT, 'budget_superato', {
      name: 'Spesa',
      spent: 'VOCAL:50',
      target: 'VOCAL:0',
    });
  });

  test('ANNB-12 | announceSavingsGoalDeleted("Vacanze") -> priority polite', () => {
    const result = announceSavingsGoalDeleted('Vacanze');
    expectPolite(result);
    expectTCalledWith(mockT, 'obiettivo_eliminato', { name: 'Vacanze' });
  });

  test('ANNB-13 | announceSavingsGoalDeletedGeneric() -> priority polite', () => {
    const result = announceSavingsGoalDeletedGeneric();
    expectPolite(result);
    expectTCalledWith(mockT, 'obiettivo_eliminato_generico');
  });

  test('ANNB-14 | announceSavingsGoalProgress("Vacanze", 3200, 3000) (>=100%) -> priority polite, key obiettivo_completato', () => {
    const result = announceSavingsGoalProgress('Vacanze', 3200, 3000);
    expectPolite(result);
    expectTCalledWith(mockT, 'obiettivo_completato', { name: 'Vacanze' });
  });

  test('ANNB-15 | announceSavingsGoalProgress("Vacanze", 2500, 3000) (83%) -> priority polite, key obiettivo_quasi_completato', () => {
    const result = announceSavingsGoalProgress('Vacanze', 2500, 3000);
    expectPolite(result);
    expect(mockFormatCurrencyVocal).toHaveBeenCalledWith(500); // remaining
    expectTCalledWith(mockT, 'obiettivo_quasi_completato', {
      name: 'Vacanze',
      percent: 83,
      remaining: 'VOCAL:500',
    });
  });

  test('ANNB-16 | announceSavingsGoalProgress("Vacanze", 1500, 3000) (50%) -> priority polite, key obiettivo_progresso', () => {
    const result = announceSavingsGoalProgress('Vacanze', 1500, 3000);
    expectPolite(result);
    expectTCalledWith(mockT, 'obiettivo_progresso', {
      name: 'Vacanze',
      percent: 50,
    });
  });

  test('ANNB-17 | announceCategoryCreated("Casa") -> priority polite, does not call formatCurrencyVocal', () => {
    const result = announceCategoryCreated('Casa');
    expectPolite(result);
    expect(mockFormatCurrencyVocal).not.toHaveBeenCalled();
    expectTCalledWith(mockT, 'categoria_creata', { name: 'Casa' });
  });
});
