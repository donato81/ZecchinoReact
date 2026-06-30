import React from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import TestRenderer, { act } from 'react-test-renderer';

// Mock dependencies
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 'Success',
    Warning: 'Warning',
    Error: 'Error',
  },
  ImpactFeedbackStyle: {
    Light: 'Light',
    Medium: 'Medium',
    Heavy: 'Heavy',
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/supabase/repositories/impostazioni-utente', () => ({
  updatePreference: jest.fn(),
}));

import { HapticSystem, hapticSystem } from '@/lib/haptic-system';
import { useHaptic } from '@/hooks/use-haptic';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useAuth } from '@/context/AuthContext';
import { updatePreference } from '@/lib/supabase/repositories/impostazioni-utente';

const mockUseAuth = useAuth as jest.Mock;
const mockUpdatePreference = updatePreference as jest.Mock;
const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

describe('Haptic System - Unit Tests (BLOCCO 021)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', {
      value: 'android',
      configurable: true,
    });
  });

  // T14 — Test: enabled=false blocca ogni chiamata nativa
  it('T14 - enabled=false blocca ogni chiamata nativa', async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify({ enabled: false }));
    const system = new HapticSystem();
    
    // Wait for async loadSettings
    await new Promise((resolve) => setTimeout(resolve, 0));
    
    expect(system.isEnabled()).toBe(false);
    
    await system.success();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  // T15 — Test: stato unknown durante bootstrap → nessuna vibrazione
  it('T15 - stato unknown durante bootstrap -> nessuna vibrazione (fail-closed)', async () => {
    // Return a promise that doesn't resolve immediately
    let resolveGetItem: any;
    const promise = new Promise((resolve) => {
      resolveGetItem = resolve;
    });
    mockGetItem.mockReturnValue(promise);
    
    const system = new HapticSystem();
    
    // settings are not initialized yet, isEnabled must be false
    expect(system.isEnabled()).toBe(false);
    
    await system.success();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    
    // Now resolve the promise
    resolveGetItem(JSON.stringify({ enabled: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    
    expect(system.isEnabled()).toBe(true);
  });

  // T16 & T17 — Test settings synchronization
  it('T16 & T17 - Supabase haptic_enabled=false sovrascrive AsyncStorage ed esegue sync locale', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      userSettings: {
        preferences: {
          haptic_enabled: false,
        },
      },
    });

    function Probe() {
      useUserSettings();
      return null;
    }

    // Set hapticSystem to enabled: true first
    await hapticSystem.setEnabled(true);
    mockSetItem.mockClear();

    act(() => {
      TestRenderer.create(<Probe />);
    });

    // Cloud value (false) should overwrite local state and sync with hapticSystem
    expect(hapticSystem.isEnabled()).toBe(false);
    // Verified that it wrote back to AsyncStorage
    expect(mockSetItem).toHaveBeenCalledWith('haptic-settings', JSON.stringify({ enabled: false }));
  });

  // T18 — Test: success() chiama notificationAsync(Success)
  it('T18 - success() chiama notificationAsync con Success', async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify({ enabled: true }));
    const system = new HapticSystem();
    await new Promise((resolve) => setTimeout(resolve, 0));
    
    await system.success();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
  });

  // T19 — Test: error() chiama notificationAsync(Error)
  it('T19 - error() chiama notificationAsync con Error', async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify({ enabled: true }));
    const system = new HapticSystem();
    await new Promise((resolve) => setTimeout(resolve, 0));
    
    await system.error();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
  });

  // T20 — Test: warning() chiama notificationAsync(Warning)
  it('T20 - warning() chiama notificationAsync con Warning', async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify({ enabled: true }));
    const system = new HapticSystem();
    await new Promise((resolve) => setTimeout(resolve, 0));
    
    await system.warning();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning);
  });

  // T21 — Test: selection() chiama selectionAsync()
  it('T21 - selection() chiama selectionAsync()', async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify({ enabled: true }));
    const system = new HapticSystem();
    await new Promise((resolve) => setTimeout(resolve, 0));
    
    await system.selection();
    expect(Haptics.selectionAsync).toHaveBeenCalled();
  });

  // T22 — Test: impactLight/Medium/Heavy chiamano impactAsync con stile corretto
  it('T22 - impactLight/Medium/Heavy chiamano impactAsync con stile corretto', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify({ enabled: true }));
    const system = new HapticSystem();
    await new Promise((resolve) => setTimeout(resolve, 0));
    
    await system.impactLight();
    expect(Haptics.impactAsync).toHaveBeenLastCalledWith(Haptics.ImpactFeedbackStyle.Light);
    
    await system.impactMedium();
    expect(Haptics.impactAsync).toHaveBeenLastCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    
    await system.impactHeavy();
    expect(Haptics.impactAsync).toHaveBeenLastCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
  });

  // T23 — Test: Platform.OS === 'windows' → no-op silenzioso
  it('T23 - Platform.OS === "windows" -> no-op silenzioso senza eccezioni', async () => {
    Object.defineProperty(Platform, 'OS', {
      value: 'windows',
      configurable: true,
    });
    mockGetItem.mockResolvedValueOnce(JSON.stringify({ enabled: true }));
    
    const system = new HapticSystem();
    await new Promise((resolve) => setTimeout(resolve, 0));
    
    expect(system.isSupported()).toBe(false);
    expect(system.isEnabled()).toBe(false);
    
    await system.success();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  // T24 — Test: metodi legacy @deprecated inoltrano ai 7 atomici senza errori
  it('T24 - metodi legacy @deprecated dello shim inoltrano ai 7 metodi atomici', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify({ enabled: true }));
    const system = new HapticSystem();
    await new Promise((resolve) => setTimeout(resolve, 0));
    
    const successSpy = jest.spyOn(system, 'success').mockResolvedValue();
    const errorSpy = jest.spyOn(system, 'error').mockResolvedValue();
    const warningSpy = jest.spyOn(system, 'warning').mockResolvedValue();
    const selectionSpy = jest.spyOn(system, 'selection').mockResolvedValue();
    const impactLightSpy = jest.spyOn(system, 'impactLight').mockResolvedValue();
    const impactMediumSpy = jest.spyOn(system, 'impactMedium').mockResolvedValue();
    
    system.click();
    expect(impactLightSpy).toHaveBeenCalled();
    
    system.buttonPress();
    expect(impactMediumSpy).toHaveBeenCalled();
    
    system.pinSuccess();
    expect(successSpy).toHaveBeenCalled();
    
    system.pinError();
    expect(errorSpy).toHaveBeenCalled();
    
    system.unlock();
    expect(successSpy).toHaveBeenCalledTimes(2);
    
    system.privateUnlock();
    expect(successSpy).toHaveBeenCalledTimes(3);
    
    system.budgetWarning();
    expect(warningSpy).toHaveBeenCalled();
    
    system.dialogOpen();
    expect(selectionSpy).toHaveBeenCalled();
    
    system.custom([10, 20]);
    expect(impactMediumSpy).toHaveBeenCalledTimes(2);
  });

  // T25 — Test: use-haptic.ts non espone intensity, setIntensity, play, impact, notification
  it('T25 - use-haptic.ts non espone intensity, setIntensity, play, impact, notification', () => {
    let hookResult: any;
    function Probe() {
      hookResult = useHaptic();
      return null;
    }
    
    act(() => {
      TestRenderer.create(<Probe />);
    });
    
    expect(hookResult.intensity).toBeUndefined();
    expect(hookResult.setIntensity).toBeUndefined();
    expect(hookResult.play).toBeUndefined();
    expect(hookResult.impact).toBeUndefined();
    expect(hookResult.notification).toBeUndefined();
    
    expect(hookResult.isEnabled).toBeDefined();
    expect(hookResult.isSupported).toBeDefined();
    expect(hookResult.setEnabled).toBeDefined();
    expect(hookResult.success).toBeDefined();
    expect(hookResult.error).toBeDefined();
    expect(hookResult.warning).toBeDefined();
    expect(hookResult.selection).toBeDefined();
    expect(hookResult.impactLight).toBeDefined();
    expect(hookResult.impactMedium).toBeDefined();
    expect(hookResult.impactHeavy).toBeDefined();
  });

  // --- INTEGRATION SESSIONE E4 ---

  // T26 (E4-1): loadSettings - errore AsyncStorage gestito senza crash
  it('T26 - errore AsyncStorage gestito senza crash', async () => {
    mockGetItem.mockRejectedValueOnce(new Error('AsyncStorage read error'));
    const system = new HapticSystem();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(system.isSupported()).toBe(true);
  });

  // T27 (E4-2): loadSettings - parsing JSON corrotto gestito senza crash
  it('T27 - parsing JSON corrotto gestito senza crash e mantiene default', async () => {
    mockGetItem.mockResolvedValueOnce('{corrupted json');
    const system = new HapticSystem();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(system.isEnabled()).toBe(true);
  });

  // T28 (E4-3): setEnabled - AsyncStorage save error non crasha
  it('T28 - AsyncStorage save error non crasha', async () => {
    mockSetItem.mockRejectedValueOnce(new Error('AsyncStorage write error'));
    const system = new HapticSystem();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await expect(system.setEnabled(false)).resolves.not.toThrow();
  });

  // T29 (E4-4): useHaptic - i metodi dello hook propagano correttamente al singleton
  it('T29 - useHaptic propaga i metodi al singleton', () => {
    const successSpy = jest.spyOn(hapticSystem, 'success').mockResolvedValue();
    const errorSpy = jest.spyOn(hapticSystem, 'error').mockResolvedValue();

    let hookResult: any;
    function Probe() {
      hookResult = useHaptic();
      return null;
    }
    act(() => {
      TestRenderer.create(<Probe />);
    });

    hookResult.success();
    expect(successSpy).toHaveBeenCalled();

    hookResult.error();
    expect(errorSpy).toHaveBeenCalled();

    successSpy.mockRestore();
    errorSpy.mockRestore();
  });

  // T30 (E4-5): success/error - eccezione expo-haptics gestita
  it('T30 - eccezione expo-haptics gestita senza lanciare errore al chiamante', async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify({ enabled: true }));
    const system = new HapticSystem();
    await new Promise((resolve) => setTimeout(resolve, 0));

    (Haptics.notificationAsync as jest.Mock).mockRejectedValueOnce(new Error('Native error'));
    await expect(system.success()).resolves.not.toThrow();
  });

  // T31 (E4-6): hapticSystem - supportato su iOS
  it('T31 - supportato su iOS', async () => {
    Object.defineProperty(Platform, 'OS', {
      value: 'ios',
      configurable: true,
    });
    mockGetItem.mockResolvedValueOnce(JSON.stringify({ enabled: true }));
    const system = new HapticSystem();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(system.isSupported()).toBe(true);
    expect(system.isEnabled()).toBe(true);
  });

  // T32 (E4-7): useUserSettings - setHapticEnabled aggiorna Cloud e Local
  it('T32 - useUserSettings setHapticEnabled aggiorna Cloud e Local', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      userSettings: {
        preferences: {
          haptic_enabled: true,
        },
      },
    });
    mockUpdatePreference.mockResolvedValueOnce(undefined);

    let hookResult: any;
    function Probe() {
      hookResult = useUserSettings();
      return null;
    }
    act(() => {
      TestRenderer.create(<Probe />);
    });

    await act(async () => {
      await hookResult.setHapticEnabled(false);
    });

    expect(mockUpdatePreference).toHaveBeenCalledWith('haptic_enabled', false);
    expect(hapticSystem.isEnabled()).toBe(false);
  });

  // Test 16: Inizializzazione hook useHaptic legge correttamente lo stato iniziale
  it('Test 16 - Inizializzazione useHaptic legge correttamente lo stato iniziale da hapticSystem', () => {
    const isEnabledSpy = jest.spyOn(hapticSystem, 'isEnabled').mockReturnValue(true);
    const isSupportedSpy = jest.spyOn(hapticSystem, 'isSupported').mockReturnValue(true);

    let hookResult: any;
    function Probe() {
      hookResult = useHaptic();
      return null;
    }

    act(() => {
      TestRenderer.create(<Probe />);
    });

    expect(hookResult.isEnabled).toBe(true);
    expect(hookResult.isSupported).toBe(true);

    isEnabledSpy.mockRestore();
    isSupportedSpy.mockRestore();
  });

  // Test 17: setEnabled del hook useHaptic chiama hapticSystem.setEnabled e aggiorna lo stato React
  it('Test 17 - setEnabled di useHaptic chiama hapticSystem.setEnabled e aggiorna lo stato', async () => {
    const setEnabledSpy = jest.spyOn(hapticSystem, 'setEnabled').mockResolvedValue(undefined);

    let hookResult: any;
    function Probe() {
      hookResult = useHaptic();
      return null;
    }

    act(() => {
      TestRenderer.create(<Probe />);
    });

    await act(async () => {
      await hookResult.setEnabled(false);
    });

    expect(setEnabledSpy).toHaveBeenCalledWith(false);
    expect(hookResult.isEnabled).toBe(false);

    setEnabledSpy.mockRestore();
  });
});
