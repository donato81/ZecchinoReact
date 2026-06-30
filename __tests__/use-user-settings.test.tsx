import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useAuth } from '@/context/AuthContext';
import { updatePreference } from '@/lib/supabase/repositories/impostazioni-utente';
import { soundSystem } from '@/lib/sound-system';
import { hapticSystem } from '@/lib/haptic-system';

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/supabase/repositories/impostazioni-utente', () => ({
  updatePreference: jest.fn(),
}));

jest.mock('@/lib/sound-system', () => ({
  soundSystem: {
    initFromSettings: jest.fn(),
    setEnabled: jest.fn(),
    setVolume: jest.fn(),
  },
}));

jest.mock('@/lib/haptic-system', () => ({
  hapticSystem: {
    getSettings: () => ({ enabled: true }),
    setEnabled: jest.fn(),
    isEnabled: () => true,
    isSupported: () => true,
  },
}));

const mockUseAuth = useAuth as jest.Mock;
const mockUpdatePreference = updatePreference as jest.Mock;

function SettingsProbe({ hookRef }: { hookRef: { current: any } }) {
  const result = useUserSettings();
  hookRef.current = result;
  return null;
}

describe('useUserSettings - Unit Tests (Test 21-36)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Scenario 1: Utente non autenticato
  it('Test 21: Inizializzazione defaults - carica preferenze di default in assenza di impostazioni utente cloud', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      userSettings: null,
    });

    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(<SettingsProbe hookRef={hookRef} />);
    });

    expect(hookRef.current.visibleCategories).toEqual([]);
    expect(hookRef.current.isSettingsReady).toBe(false);
  });

  // Scenario 2 & 3: Utente autenticato con preferenze valide
  it('Test 22: Inizializzazione cloud - carica preferenze Supabase e inizializza i sistemi audio/haptic', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      userSettings: {
        preferences: {
          visible_category_ids: ['cat1', 'cat2'],
          dismissed_budget_alert_ids: ['alert1'],
          audio_enabled: false,
          audio_volume: 0.8,
          haptic_enabled: true,
        },
      },
    });

    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(<SettingsProbe hookRef={hookRef} />);
    });

    expect(hookRef.current.visibleCategories).toEqual(['cat1', 'cat2']);
    expect(hookRef.current.dismissedBudgetAlerts).toEqual(['alert1']);
    expect(hookRef.current.audioEnabled).toBe(false);
    expect(hookRef.current.audioVolume).toBe(0.8);
    expect(hookRef.current.hapticEnabled).toBe(true);
    expect(hookRef.current.isSettingsReady).toBe(true);
    expect(soundSystem.initFromSettings).toHaveBeenCalledWith(false, 0.8);
  });

  // Scenario 4: Preferenze cloud incomplete o corrotte (caricamento default salvavita)
  it('Test 22b: Inizializzazione cloud - gestisce preferenze cloud vuote o incomplete usando i default', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      userSettings: {
        preferences: {}, // Vuote
      },
    });

    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(<SettingsProbe hookRef={hookRef} />);
    });

    expect(hookRef.current.audioEnabled).toBe(true);
    expect(hookRef.current.audioVolume).toBe(0.3);
    expect(hookRef.current.hapticEnabled).toBe(true);
  });

  // Scenario 5: updatePreference risolto con successo
  it('Test 23: setVisibleCategories - aggiorna lo stato locale solo a seguito del completamento della scrittura a DB (P29)', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      userSettings: { preferences: { visible_category_ids: ['cat1'] } },
    });

    let resolvePromise!: (val?: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockUpdatePreference.mockReturnValue(promise);

    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(<SettingsProbe hookRef={hookRef} />);
    });

    expect(hookRef.current.visibleCategories).toEqual(['cat1']);

    let setterPromise: Promise<void>;
    act(() => {
      setterPromise = hookRef.current.setVisibleCategories(['cat2']);
    });

    // P29: Stato locale non ancora cambiato prima del DB
    expect(hookRef.current.visibleCategories).toEqual(['cat1']);
    expect(hookRef.current.isSettingsLoading).toBe(true);

    await act(async () => {
      resolvePromise();
      await setterPromise;
    });

    // Cambia solo dopo
    expect(hookRef.current.visibleCategories).toEqual(['cat2']);
    expect(hookRef.current.isSettingsLoading).toBe(false);
  });

  // Scenario 6: updatePreference rigettato con errore
  it('Test 23b: setVisibleCategories - fallimento scrittura mantiene lo stato precedente e popola settingsError (P29)', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      userSettings: { preferences: { visible_category_ids: ['cat1'] } },
    });

    mockUpdatePreference.mockRejectedValue(new Error('DB Error'));

    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(<SettingsProbe hookRef={hookRef} />);
    });

    await act(async () => {
      await hookRef.current.setVisibleCategories(['cat2']);
    });

    // P29: Stato locale invariato e errore registrato
    expect(hookRef.current.visibleCategories).toEqual(['cat1']);
    expect(hookRef.current.settingsError).toBe('DB Error');
    expect(hookRef.current.isSettingsLoading).toBe(false);
  });

  it('Test 24 & 25: dismissBudgetAlert - aggiunge alert id e fa early return se gia dismesso', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      userSettings: { preferences: { dismissed_budget_alert_ids: ['alert1'] } },
    });
    mockUpdatePreference.mockResolvedValue(undefined);

    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(<SettingsProbe hookRef={hookRef} />);
    });

    // Test 25: Early return se già dismesso
    await act(async () => {
      await hookRef.current.dismissBudgetAlert('alert1');
    });
    expect(mockUpdatePreference).not.toHaveBeenCalled();

    // Test 24: Aggiunge se non presente
    await act(async () => {
      await hookRef.current.dismissBudgetAlert('alert2');
    });
    expect(mockUpdatePreference).toHaveBeenCalledWith('dismissed_budget_alert_ids', ['alert1', 'alert2']);
    expect(hookRef.current.dismissedBudgetAlerts).toEqual(['alert1', 'alert2']);
  });

  it('Test 26: resetDismissedAlerts - resetta le esclusioni a DB e nello stato locale', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      userSettings: { preferences: { dismissed_budget_alert_ids: ['alert1'] } },
    });
    mockUpdatePreference.mockResolvedValue(undefined);

    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(<SettingsProbe hookRef={hookRef} />);
    });

    await act(async () => {
      await hookRef.current.resetDismissedAlerts();
    });

    expect(mockUpdatePreference).toHaveBeenCalledWith('dismissed_budget_alert_ids', []);
    expect(hookRef.current.dismissedBudgetAlerts).toEqual([]);
  });

  it('Test 27 & 28: setAudioEnabled / setAudioVolume - persiste e aggiorna stato audio e soundSystem', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      userSettings: { preferences: { audio_enabled: true, audio_volume: 0.3 } },
    });
    mockUpdatePreference.mockResolvedValue(undefined);

    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(<SettingsProbe hookRef={hookRef} />);
    });

    await act(async () => {
      await hookRef.current.setAudioEnabled(false);
    });
    expect(mockUpdatePreference).toHaveBeenCalledWith('audio_enabled', false);
    expect(soundSystem.setEnabled).toHaveBeenCalledWith(false);

    await act(async () => {
      await hookRef.current.setAudioVolume(0.5);
    });
    expect(mockUpdatePreference).toHaveBeenCalledWith('audio_volume', 0.5);
    expect(soundSystem.setVolume).toHaveBeenCalledWith(0.5);
  });

  it('Test 29: setHapticEnabled (locale) - se utente non autenticato, aggiorna solo stato locale e hapticSystem', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      userSettings: null,
    });

    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(<SettingsProbe hookRef={hookRef} />);
    });

    await act(async () => {
      await hookRef.current.setHapticEnabled(false);
    });

    expect(mockUpdatePreference).not.toHaveBeenCalled();
    expect(hapticSystem.setEnabled).toHaveBeenCalledWith(false);
    expect(hookRef.current.hapticEnabled).toBe(false);
  });

  it('Test 30: setHapticEnabled (remoto) - se utente autenticato, persiste a DB, aggiorna locale e hapticSystem', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      userSettings: { preferences: { haptic_enabled: true } },
    });
    mockUpdatePreference.mockResolvedValue(undefined);

    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(<SettingsProbe hookRef={hookRef} />);
    });

    await act(async () => {
      await hookRef.current.setHapticEnabled(false);
    });

    expect(mockUpdatePreference).toHaveBeenCalledWith('haptic_enabled', false);
    expect(hapticSystem.setEnabled).toHaveBeenCalledWith(false);
    expect(hookRef.current.hapticEnabled).toBe(false);
  });

  it('Test 31 & 32: setDisplayPreference / setScreenReaderPreference - persiste e aggiorna visualizzazione e screen reader', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      userSettings: { preferences: {} },
    });
    mockUpdatePreference.mockResolvedValue(undefined);

    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(<SettingsProbe hookRef={hookRef} />);
    });

    await act(async () => {
      await hookRef.current.setDisplayPreference('compactMode', true);
    });
    expect(mockUpdatePreference).toHaveBeenCalledWith('display_compact_mode', true);
    expect(hookRef.current.displayPreferences.compactMode).toBe(true);

    await act(async () => {
      await hookRef.current.setScreenReaderPreference('verbosityLevel', 'conciso');
    });
    expect(mockUpdatePreference).toHaveBeenCalledWith('sr_verbosity', 'conciso');
    expect(hookRef.current.screenReaderPreferences.verbosityLevel).toBe('conciso');
  });

  it('Test 33 & 34: setTalkBackAdaptations - convalida ed aggiorna o rifiuta con errore', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      userSettings: { preferences: {} },
    });
    mockUpdatePreference.mockResolvedValue(undefined);

    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(<SettingsProbe hookRef={hookRef} />);
    });

    const validAdaptations = {
      enhancedTouchTargets: true,
      simplifiedNavigation: false,
      extendedTimeouts: true,
      verboseDescriptions: false,
      highContrastMode: true,
      reducedMotion: false,
      autoFocusManagement: true,
      spatialAudio: false,
    };

    // Test 33: Convalida e aggiorna
    await act(async () => {
      await hookRef.current.setTalkBackAdaptations(validAdaptations);
    });
    expect(mockUpdatePreference).toHaveBeenCalledWith('talkback_adaptations', validAdaptations);
    expect(hookRef.current.talkBackAdaptations).toEqual(validAdaptations);

    // Test 34: Rifiuta dati non conformi
    mockUpdatePreference.mockClear();
    await act(async () => {
      await hookRef.current.setTalkBackAdaptations({ enhancedTouchTargets: 'invalid' } as any);
    });
    expect(mockUpdatePreference).not.toHaveBeenCalled();
    expect(hookRef.current.settingsError).toBe('Dati adattamenti TalkBack non validi');
  });

  it('Test 35: setTalkBackManualOverride - persiste e aggiorna lo stato di override manuale', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      userSettings: { preferences: {} },
    });
    mockUpdatePreference.mockResolvedValue(undefined);

    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(<SettingsProbe hookRef={hookRef} />);
    });

    await act(async () => {
      await hookRef.current.setTalkBackManualOverride(true);
    });
    expect(mockUpdatePreference).toHaveBeenCalledWith('talkback_manual_override', true);
    expect(hookRef.current.talkBackManualOverride).toBe(true);
  });

  it('Test 36: resetScreenReaderPreferences - esegue il reset atomico di tutte le opzioni', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      userSettings: { preferences: {} },
    });
    mockUpdatePreference.mockResolvedValue(undefined);

    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(<SettingsProbe hookRef={hookRef} />);
    });

    await act(async () => {
      await hookRef.current.resetScreenReaderPreferences();
    });

    expect(mockUpdatePreference).toHaveBeenCalledWith('talkback_manual_override', null);
    expect(hookRef.current.talkBackManualOverride).toBeNull();
  });
});
