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
});
