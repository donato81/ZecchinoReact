jest.mock('@/announcements/_utils/t', () => ({
  t: jest.fn((key: string) => key),
}));

import { t } from '@/announcements/_utils/t';
import {
  pinNotConfigured,
  pinInvalid,
  privateUnlocked,
  privateAccountLocked,
  pinSet,
  pinChanged,
  pinRemoved,
  sessionKept,
} from '@/announcements/auth';
import {
  expectAssertive,
  expectPolite,
  expectTCalledWith,
} from './helpers/announcements-test-utils';

const mockT = t as unknown as jest.Mock;

describe('auth announcements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ANNU-01 | pinNotConfigured() -> priority assertive', () => {
    const result = pinNotConfigured();
    expectAssertive(result);
    expectTCalledWith(mockT, 'pin_non_configurato');
  });

  test('ANNU-02 | pinInvalid() -> priority assertive', () => {
    const result = pinInvalid();
    expectAssertive(result);
    expectTCalledWith(mockT, 'pin_non_valido');
  });

  test('ANNU-03 | privateUnlocked() -> priority polite', () => {
    const result = privateUnlocked();
    expectPolite(result);
    expectTCalledWith(mockT, 'conto_privato_sbloccato');
  });

  test('ANNU-04 | privateAccountLocked() -> priority polite', () => {
    const result = privateAccountLocked();
    expectPolite(result);
    expectTCalledWith(mockT, 'conto_privato_bloccato');
  });

  test('ANNU-05 | pinSet() -> priority polite', () => {
    const result = pinSet();
    expectPolite(result);
    expectTCalledWith(mockT, 'pin_configurato');
  });

  test('ANNU-06 | pinChanged() -> priority polite', () => {
    const result = pinChanged();
    expectPolite(result);
    expectTCalledWith(mockT, 'pin_modificato');
  });

  test('ANNU-07 | pinRemoved() -> priority polite', () => {
    const result = pinRemoved();
    expectPolite(result);
    expectTCalledWith(mockT, 'pin_rimosso');
  });

  test('ANNU-08 | sessionKept() -> priority polite', () => {
    const result = sessionKept();
    expectPolite(result);
    expectTCalledWith(mockT, 'sessione_mantenuta');
  });

  test('ANNU-09 | Test consolidato ACC-1: pinNotConfigured e pinInvalid hanno priority assertive', () => {
    const r1 = pinNotConfigured();
    const r2 = pinInvalid();
    expect(r1.priority).toBe('assertive');
    expect(r2.priority).toBe('assertive');
  });

  test('ANNU-10 | Test consolidato: funzioni non-errore hanno priority polite', () => {
    const results = [
      privateUnlocked(),
      privateAccountLocked(),
      pinSet(),
      pinChanged(),
      pinRemoved(),
      sessionKept(),
    ];
    results.forEach((res) => {
      expect(res.priority).toBe('polite');
    });
  });
});
