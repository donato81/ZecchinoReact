import { pluralize } from '../src/announcements/_utils/plurals';

describe('pluralize function', () => {
  it('should pluralize irregular lowercase word', () => {
    expect(pluralize('conto', 2)).toBe('conti');
  });

  it('should pluralize irregular capitalized word', () => {
    expect(pluralize('Conto', 2)).toBe('Conti');
  });

  it('should pluralize regular capitalized word', () => {
    expect(pluralize('Nota', 2)).toBe('Note');
  });

  it('should pluralize word not in irregular dictionary', () => {
    expect(pluralize('casa', 2)).toBe('case');
  });

  // Nuovi test Sessione E1
  it('UTLP-01: pluralize("movimento", 1) -> "movimento"', () => {
    expect(pluralize('movimento', 1)).toBe('movimento');
  });

  it('UTLP-02: pluralize("movimento", 3) -> "movimenti"', () => {
    expect(pluralize('movimento', 3)).toBe('movimenti');
  });

  it('UTLP-03: pluralize("euro", 5) -> "euro"', () => {
    expect(pluralize('euro', 5)).toBe('euro');
  });

  it('UTLP-04: pluralize("documento", 2) -> "documenti"', () => {
    expect(pluralize('documento', 2)).toBe('documenti');
  });

  it('UTLP-05: pluralize("nota", 2) -> "note"', () => {
    expect(pluralize('nota', 2)).toBe('note');
  });

  it('UTLP-06: pluralize("Movimento", 2) -> "Movimenti" (preserva capitalizzazione)', () => {
    expect(pluralize('Movimento', 2)).toBe('Movimenti');
  });

  it('UTLP-07: pluralize("mese", 3) -> "mesi"', () => {
    expect(pluralize('mese', 3)).toBe('mesi');
  });
});
