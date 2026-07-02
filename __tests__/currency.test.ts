import { formatCurrencyVocal } from '../src/announcements/_utils/currency';

describe('formatCurrencyVocal helper', () => {
  test('UTLC-01 | formatCurrencyVocal(1234.56) -> formats decimal and potentially thousands', () => {
    const result = formatCurrencyVocal(1234.56);
    expect(result === '1.234,56 euro' || result === '1234,56 euro').toBe(true);
  });

  test('UTLC-02 | formatCurrencyVocal(0) -> "0,00 euro"', () => {
    expect(formatCurrencyVocal(0)).toBe('0,00 euro');
  });
});
