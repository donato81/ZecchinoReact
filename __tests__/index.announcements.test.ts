jest.mock('@/accessibility/engine', () => ({
  engine: {
    announce: jest.fn(),
  },
}));

import { engine } from '@/accessibility/engine';
import { announce } from '@/announcements/index';

const mockEngineAnnounce = engine.announce as jest.Mock;

describe('index announcements entry point', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ANNI-01 | announce(polite) -> calls engine.announce with identical object', () => {
    const announcement = { text: 'Operazione completata', priority: 'polite' as const };
    announce(announcement);
    expect(mockEngineAnnounce).toHaveBeenCalledWith(announcement);
  });

  test('ANNI-02 | announce(assertive) -> calls engine.announce with priority assertive preserved', () => {
    const announcement = { text: 'Errore critico', priority: 'assertive' as const };
    announce(announcement);
    expect(mockEngineAnnounce).toHaveBeenCalledWith(announcement);
  });
});
