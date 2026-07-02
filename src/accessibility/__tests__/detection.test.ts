import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { useAccessibilityDetection, DEFAULT_ADAPTATIONS } from '../detection';
import { AccessibilityInfo } from 'react-native';
import { useUserSettings } from '@/context/UserSettingsContext';

// Mock UserSettingsContext
jest.mock('@/context/UserSettingsContext', () => ({
  useUserSettings: jest.fn(),
}));

const mockUseUserSettings = useUserSettings as jest.Mock;

// Globals to capture the screen reader listener and the remove subscription mock
let screenReaderChangedCallback: ((enabled: boolean) => void) | null = null;
const mockRemoveSubscription = jest.fn();

// Spy on AccessibilityInfo methods (already mocked by Jest's react-native preset)
const spyIsScreenReaderEnabled = jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled');
const spyAddEventListener = jest.spyOn(AccessibilityInfo, 'addEventListener');

// Helper to render hook in a test component (using React.createElement to avoid JSX syntax errors in a .ts file)
function renderHook(hookFn: () => any) {
  const result = { current: null as any };
  function TestComponent() {
    result.current = hookFn();
    return null;
  }
  const root = renderer.create(React.createElement(TestComponent));
  return {
    result,
    unmount: () => root.unmount(),
    update: () => root.update(React.createElement(TestComponent)),
  };
}

describe('useAccessibilityDetection Hook', () => {
  let mockUserSettings: any;

  beforeEach(() => {
    jest.clearAllMocks();
    screenReaderChangedCallback = null;

    mockUserSettings = {
      talkBackAdaptations: DEFAULT_ADAPTATIONS,
      talkBackManualOverride: null,
      setTalkBackAdaptations: jest.fn().mockResolvedValue(undefined),
      setTalkBackManualOverride: jest.fn().mockResolvedValue(undefined),
    };
    mockUseUserSettings.mockReturnValue(mockUserSettings);
    spyIsScreenReaderEnabled.mockResolvedValue(false);

    spyAddEventListener.mockImplementation((event: string, callback: any) => {
      if (event === 'screenReaderChanged') {
        screenReaderChangedCallback = callback;
      }
      return {
        remove: mockRemoveSubscription,
      } as any;
    });
  });

  afterAll(() => {
    spyIsScreenReaderEnabled.mockRestore();
    spyAddEventListener.mockRestore();
  });

  // --- CASI NORMALI ---

  test('Caso 1: Rilevamento dello screen reader all\'avvio (Mount) - attivo', async () => {
    spyIsScreenReaderEnabled.mockResolvedValueOnce(true);

    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() => useAccessibilityDetection());
    });

    const state = renderResult.result.current.talkBackState;
    expect(state.isEnabled).toBe(true);
    expect(state.isDetected).toBe(true);
    expect(state.confidenceLevel).toBe('high');
    expect(state.adaptationsActive).toBe(true);
  });

  test('Caso 1b: Rilevamento dello screen reader all\'avvio (Mount) - non attivo', async () => {
    spyIsScreenReaderEnabled.mockResolvedValueOnce(false);

    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() => useAccessibilityDetection());
    });

    const state = renderResult.result.current.talkBackState;
    expect(state.isEnabled).toBe(false);
    expect(state.isDetected).toBe(false);
    expect(state.confidenceLevel).toBe('low');
    expect(state.adaptationsActive).toBe(false);
  });

  test('Caso 2: Variazione dello stato nativo a runtime', async () => {
    spyIsScreenReaderEnabled.mockResolvedValueOnce(true);

    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() => useAccessibilityDetection());
    });

    expect(renderResult.result.current.talkBackState.isEnabled).toBe(true);
    expect(screenReaderChangedCallback).not.toBeNull();

    // Simulate system event: screen reader disabled
    await act(async () => {
      if (screenReaderChangedCallback) {
        screenReaderChangedCallback(false);
      }
    });

    const state = renderResult.result.current.talkBackState;
    expect(state.isEnabled).toBe(false);
    expect(state.isDetected).toBe(false);
    expect(state.confidenceLevel).toBe('low');
    expect(state.adaptationsActive).toBe(false);
  });

  test('Caso 3: Override manuale abilitato', async () => {
    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() => useAccessibilityDetection());
    });

    await act(async () => {
      renderResult.result.current.enableTalkBack(true);
    });

    expect(mockUserSettings.setTalkBackManualOverride).toHaveBeenCalledWith(true);
    expect(renderResult.result.current.talkBackState.isEnabled).toBe(true);
    expect(renderResult.result.current.talkBackState.adaptationsActive).toBe(true);
  });

  test('Caso 4: Calcolo dimensione touch target', async () => {
    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() => useAccessibilityDetection());
    });

    // Default inactive adaptations
    expect(renderResult.result.current.getTouchTargetSize()).toBe(44);

    // Turn on adaptations via local state
    await act(async () => {
      renderResult.result.current.enableTalkBack(false);
    });

    expect(renderResult.result.current.getTouchTargetSize()).toBe(56);
  });

  test('Caso 5: Calcolo durata animazione', async () => {
    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() => useAccessibilityDetection());
    });

    // Default inactive adaptations
    expect(renderResult.result.current.getAnimationDuration(300)).toBe(300);

    // Turn on adaptations
    await act(async () => {
      renderResult.result.current.enableTalkBack(false);
    });

    // Math.min(300 * 0.5, 100) = 100
    expect(renderResult.result.current.getAnimationDuration(300)).toBe(100);
    // Math.min(100 * 0.5, 100) = 50
    expect(renderResult.result.current.getAnimationDuration(100)).toBe(50);
  });

  test('Caso 6: Moltiplicatore Timeout', async () => {
    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() => useAccessibilityDetection());
    });

    expect(renderResult.result.current.getTimeout(5000)).toBe(5000);

    await act(async () => {
      renderResult.result.current.enableTalkBack(false);
    });

    expect(renderResult.result.current.getTimeout(5000)).toBe(10000);
  });

  // --- CASI LIMITE ---

  test('Caso Limite 1: Override manuale senza persistenza (manual = false)', async () => {
    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() => useAccessibilityDetection());
    });

    await act(async () => {
      renderResult.result.current.enableTalkBack(false);
    });

    expect(mockUserSettings.setTalkBackManualOverride).not.toHaveBeenCalled();
    expect(renderResult.result.current.talkBackState.isEnabled).toBe(true);
  });

  test('Caso Limite 2: Rimozione dell\'override (resetDetection)', async () => {
    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() => useAccessibilityDetection());
    });

    spyIsScreenReaderEnabled.mockResolvedValueOnce(true);

    await act(async () => {
      await renderResult.result.current.resetDetection();
    });

    expect(mockUserSettings.setTalkBackManualOverride).toHaveBeenCalledWith(null);
    expect(spyIsScreenReaderEnabled).toHaveBeenCalled();
    expect(renderResult.result.current.talkBackState.isEnabled).toBe(true);
  });

  test('Caso Limite 3: Cleanup del hook (Unmount)', async () => {
    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() => useAccessibilityDetection());
    });

    await act(async () => {
      renderResult.unmount();
    });

    expect(mockRemoveSubscription).toHaveBeenCalled();
  });

  test('Caso Limite 3b: Cleanup del hook (Unmount) con sottoscrizione undefined o null', async () => {
    spyAddEventListener.mockReturnValueOnce(undefined as any);
    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() => useAccessibilityDetection());
    });

    await act(async () => {
      expect(() => {
        renderResult.unmount();
      }).not.toThrow();
    });
  });

  // --- CASI DI ERRORE ---

  test('Caso Errore 1: Esecuzione fuori dal Provider', () => {
    mockUseUserSettings.mockImplementationOnce(() => {
      throw new Error('useUserSettings must be used within a UserSettingsProvider');
    });

    expect(() => {
      useAccessibilityDetection();
    }).toThrow('useUserSettings must be used within a UserSettingsProvider');
  });

  test('Caso Errore 2: Fallimento del database (Supabase offline)', async () => {
    const dbError = new Error('Database offline');
    mockUserSettings.setTalkBackManualOverride.mockRejectedValueOnce(dbError);

    const spyConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() => useAccessibilityDetection());
    });

    await act(async () => {
      renderResult.result.current.enableTalkBack(true);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(spyConsoleError).toHaveBeenCalledWith(dbError);
    spyConsoleError.mockRestore();
  });

  // --- EXTRA CHECKS (PASSO 6) ---

  test('Extra: updateAdaptation and resetAdaptations', async () => {
    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() => useAccessibilityDetection());
    });

    await act(async () => {
      renderResult.result.current.updateAdaptation('enhancedTouchTargets', false);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockUserSettings.setTalkBackAdaptations).toHaveBeenCalledWith({
      ...DEFAULT_ADAPTATIONS,
      enhancedTouchTargets: false,
    });

    await act(async () => {
      renderResult.result.current.resetAdaptations();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockUserSettings.setTalkBackAdaptations).toHaveBeenCalledWith(DEFAULT_ADAPTATIONS);
  });

  test('Extra: utility methods values (shouldUseVerboseDescriptions, shouldSimplifyNavigation, shouldAutoManageFocus, getAriaDescription)', async () => {
    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() => useAccessibilityDetection());
    });

    // Inactive adaptations
    expect(renderResult.result.current.shouldUseVerboseDescriptions()).toBe(false);
    expect(renderResult.result.current.shouldSimplifyNavigation()).toBe(false);
    expect(renderResult.result.current.shouldAutoManageFocus()).toBe(false);
    expect(renderResult.result.current.getAriaDescription('brief', 'verbose')).toBe('brief');

    // Turn on adaptations
    await act(async () => {
      renderResult.result.current.enableTalkBack(false);
    });

    expect(renderResult.result.current.shouldUseVerboseDescriptions()).toBe(true);
    expect(renderResult.result.current.shouldSimplifyNavigation()).toBe(true);
    expect(renderResult.result.current.shouldAutoManageFocus()).toBe(true);
    expect(renderResult.result.current.getAriaDescription('brief', 'verbose')).toBe('verbose');
  });

  test('INTD-01 | disableTalkBack(true) -> chiama setTalkBackManualOverride(false) e aggiorna lo stato', async () => {
    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() => useAccessibilityDetection());
    });

    await act(async () => {
      renderResult.result.current.enableTalkBack(false);
    });
    expect(renderResult.result.current.talkBackState.isEnabled).toBe(true);

    await act(async () => {
      renderResult.result.current.disableTalkBack(true);
    });

    expect(mockUserSettings.setTalkBackManualOverride).toHaveBeenCalledWith(false);
    expect(renderResult.result.current.talkBackState.isEnabled).toBe(false);
    expect(renderResult.result.current.talkBackState.adaptationsActive).toBe(false);
  });

  test('INTD-02 | disableTalkBack(false) -> disabilita adattazioni locali senza chiamare setTalkBackManualOverride', async () => {
    let renderResult: any;
    await act(async () => {
      renderResult = renderHook(() => useAccessibilityDetection());
    });

    await act(async () => {
      renderResult.result.current.enableTalkBack(false);
    });
    expect(renderResult.result.current.talkBackState.isEnabled).toBe(true);

    mockUserSettings.setTalkBackManualOverride.mockClear();

    await act(async () => {
      renderResult.result.current.disableTalkBack(false);
    });

    expect(mockUserSettings.setTalkBackManualOverride).not.toHaveBeenCalled();
    expect(renderResult.result.current.talkBackState.isEnabled).toBe(false);
    expect(renderResult.result.current.talkBackState.adaptationsActive).toBe(false);
  });
});
