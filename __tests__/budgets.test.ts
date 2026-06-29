import { announceBudgetStatus } from '../src/announcements/budgets';

describe('announceBudgetStatus', () => {
  it('should handle target zero with positive spent as budget exceeded with assertive priority', () => {
    const ann = announceBudgetStatus('Spese', 50, 0);
    expect(ann.priority).toBe('assertive');
    expect(ann.text).toContain('superato');
    expect(ann.text).toContain('Hai speso 50,00 euro su 0,00 euro');
  });

  it('should handle target zero with zero spent as normal budget', () => {
    const ann = announceBudgetStatus('Spese', 0, 0);
    expect(ann.priority).toBe('polite');
    expect(ann.text).toBe('Budget Spese al 0 percento.');
  });

  it('should handle normal positive target', () => {
    const ann = announceBudgetStatus('Spese', 50, 100);
    expect(ann.priority).toBe('polite');
    expect(ann.text).toBe('Budget Spese al 50 percento.');
  });
});
