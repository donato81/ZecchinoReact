import { engine } from '../engine';
import { AccessibilityInfo } from 'react-native';
import { Announcement } from '../types';

jest.mock('react-native', () => ({
  AccessibilityInfo: {
    announceForAccessibility: jest.fn(),
  },
}));

declare global {
  var __DEV__: boolean;
}

describe('ScreenReaderEngine', () => {
  let originalDev: boolean;
  let spyConsoleLog: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    originalDev = global.__DEV__;
    spyConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    global.__DEV__ = originalDev;
    spyConsoleLog.mockRestore();
  });

  // --- CASI NORMALI ---

  test('Caso 1: Annuncio con testo valido', () => {
    const announcement: Announcement = {
      text: 'Finestra aperta',
      priority: 'polite',
    };

    engine.announce(announcement);

    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Finestra aperta');
  });

  test('Caso 2: Annuncio vuoto o con soli spazi', () => {
    const emptyAnnouncement: Announcement = {
      text: '',
      priority: 'polite',
    };

    const spacesAnnouncement: Announcement = {
      text: '    ',
      priority: 'assertive',
    };

    engine.announce(emptyAnnouncement);
    engine.announce(spacesAnnouncement);

    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
  });

  // --- CASI LIMITE ---

  test('Esecuzione in ambiente di test (senza API nativa) con __DEV__ = true', () => {
    global.__DEV__ = true;
    
    // Temporarily remove native function
    const originalAnnounce = AccessibilityInfo.announceForAccessibility;
    (AccessibilityInfo as any).announceForAccessibility = undefined;

    const announcement: Announcement = {
      text: 'Test fallback log',
      priority: 'polite',
    };

    engine.announce(announcement);

    expect(spyConsoleLog).toHaveBeenCalledWith(
      '[engine] announceForAccessibility non disponibile:',
      'Test fallback log'
    );

    // Restore
    AccessibilityInfo.announceForAccessibility = originalAnnounce;
  });

  test('Esecuzione in ambiente di test (senza API nativa) con __DEV__ = false', () => {
    global.__DEV__ = false;
    
    const originalAnnounce = AccessibilityInfo.announceForAccessibility;
    (AccessibilityInfo as any).announceForAccessibility = undefined;

    const announcement: Announcement = {
      text: 'Test fallback log silent',
      priority: 'polite',
    };

    engine.announce(announcement);

    expect(spyConsoleLog).not.toHaveBeenCalled();

    // Restore
    AccessibilityInfo.announceForAccessibility = originalAnnounce;
  });

  // --- CASI DI ERRORE ---

  test('Caso Errore: Oggetto Announcement non definito o non conforme', () => {
    expect(() => {
      engine.announce(null as any);
    }).toThrow();

    expect(() => {
      engine.announce(undefined as any);
    }).toThrow();

    expect(() => {
      engine.announce({} as any);
    }).toThrow();
  });
});
