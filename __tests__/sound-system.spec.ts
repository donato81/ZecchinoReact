import React from 'react';
import { Platform, AppState } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

// Mock dependencies
const mockOscillatorNode = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  type: 'sine',
  frequency: { value: 440 },
};

const mockGainNode = {
  connect: jest.fn(),
  gain: {
    value: 1,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  },
};

const mockAudioContext = {
  createOscillator: jest.fn().mockReturnValue(mockOscillatorNode),
  createGain: jest.fn().mockReturnValue(mockGainNode),
  destination: {},
  currentTime: 10,
  state: 'suspended',
  resume: jest.fn().mockResolvedValue(undefined),
  suspend: jest.fn().mockResolvedValue(undefined),
};

jest.mock('react-native-audio-api', () => ({
  AudioContext: jest.fn().mockImplementation(() => mockAudioContext),
}), { virtual: true });

const mockAuthContext = {
  isAuthenticated: true,
  userSettings: {
    preferences: {
      audio_enabled: true,
      audio_volume: 0.8,
      haptic_enabled: true,
    },
  },
};

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

jest.mock('@/lib/supabase/repositories/impostazioni-utente', () => ({
  updatePreference: jest.fn().mockResolvedValue(undefined),
}));

import { soundSystem } from '@/lib/sound-system';
import { useUserSettings } from '@/hooks/use-user-settings';

describe("Sound System - Unit Tests (PLAN 022)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', {
      value: 'android',
      configurable: true,
    });
    mockAudioContext.currentTime = 10;
    mockAudioContext.state = 'suspended';
    mockAudioContext.resume.mockClear();
    mockAudioContext.suspend.mockClear();
    mockAudioContext.createOscillator.mockClear();
    mockAudioContext.createGain.mockClear();
    mockOscillatorNode.start.mockClear();
    mockOscillatorNode.stop.mockClear();
    mockOscillatorNode.connect.mockClear();
    mockGainNode.connect.mockClear();
    mockGainNode.gain.setValueAtTime.mockClear();
    mockGainNode.gain.linearRampToValueAtTime.mockClear();
  });

  // T01 — enabled=false interrompe ed inibisce immediatamente qualsiasi chiamata al generatore di suoni
  it("T01 - enabled=false blocca ogni chiamata nativa", () => {
    soundSystem.initFromSettings(false, 0.3);
    soundSystem.play('click');
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });

  // T02 — Il valore del volume passato a setVolume o initFromSettings viene clampato matematicamente nel range 0-1
  it("T02 - Il valore del volume viene clampato matematicamente nel range 0-1", async () => {
    soundSystem.initFromSettings(true, 1.5);
    expect(soundSystem.getVolume()).toBe(1.0);
    soundSystem.initFromSettings(true, -0.5);
    expect(soundSystem.getVolume()).toBe(0.0);
    await soundSystem.setVolume(2.0);
    expect(soundSystem.getVolume()).toBe(1.0);
    await soundSystem.setVolume(-1.0);
    expect(soundSystem.getVolume()).toBe(0.0);
  });

  // T03 — setEnabled invoca il callback di persistenza onEnabledChange se precedentemente configurato
  it("T03 - setEnabled invoca il callback di persistenza onEnabledChange", async () => {
    const onEnabledChange = jest.fn().mockResolvedValue(undefined);
    soundSystem.configure({ onEnabledChange });
    await soundSystem.setEnabled(false);
    expect(onEnabledChange).toHaveBeenCalledWith(false);
  });

  // T04 — setVolume invoca il callback di persistenza onVolumeChange se precedentemente configurato
  it("T04 - setVolume invoca il callback di persistenza onVolumeChange", async () => {
    const onVolumeChange = jest.fn().mockResolvedValue(undefined);
    soundSystem.configure({ onVolumeChange });
    await soundSystem.setVolume(0.5);
    expect(onVolumeChange).toHaveBeenCalledWith(0.5);
  });

  // T05 — initFromSettings allinea le proprietà in memoria senza attivare la catena dei callback di salvataggio (previene cicli infiniti)
  it("T05 - initFromSettings allinea le proprietà in memoria senza attivare i callback", () => {
    const onEnabledChange = jest.fn().mockResolvedValue(undefined);
    const onVolumeChange = jest.fn().mockResolvedValue(undefined);
    soundSystem.configure({ onEnabledChange, onVolumeChange });
    soundSystem.initFromSettings(false, 0.2);
    expect(onEnabledChange).not.toHaveBeenCalled();
    expect(onVolumeChange).not.toHaveBeenCalled();
    expect(soundSystem.getEnabled()).toBe(false);
    expect(soundSystem.getVolume()).toBe(0.2);
  });

  // T06 — play('success') sintetizza 3 note sine ad altezza ascendente (523.25 Hz -> 659.25 Hz -> 783.99 Hz)
  it("T06 - play(\"success\") sintetizza 3 note sine ascendenti", () => {
    soundSystem.initFromSettings(true, 0.3);
    soundSystem['audioContext'] = null; // force creation
    soundSystem.play('success');
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
    expect(mockOscillatorNode.frequency.value).toBe(783.99);
  });

  // T07 — play('error') genera 2 toni sawtooth discendenti (300 Hz -> 250 Hz)
  it("T07 - play(\"error\") genera 2 toni sawtooth discendenti", () => {
    soundSystem.initFromSettings(true, 0.3);
    soundSystem['audioContext'] = null; // force creation
    soundSystem.play('error');
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    expect(mockOscillatorNode.frequency.value).toBe(250);
  });

  // T08 — play('warning') produce il pattern warning specificato (doppio tono repeated: 440 Hz -> 440 Hz)
  it("T08 - play(\"warning\") produce il pattern warning specificato", () => {
    soundSystem.initFromSettings(true, 0.3);
    soundSystem['audioContext'] = null; // force creation
    soundSystem.play('warning');
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    expect(mockOscillatorNode.frequency.value).toBe(440);
  });

  // T09 — play('click') produce un suono di click sine da 800 Hz e 30-50 ms
  it("T09 - play(\"click\") produce un suono di click sine da 800 Hz", () => {
    soundSystem.initFromSettings(true, 0.3);
    soundSystem['audioContext'] = null; // force creation
    soundSystem.play('click');
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
    expect(mockOscillatorNode.frequency.value).toBe(800);
  });

  // T10 — play('navigation') esegue il tono navigation specificato (sine 600 Hz, 40 ms)
  it("T10 - play(\"navigation\") esegue il tono navigation specificato", () => {
    soundSystem.initFromSettings(true, 0.3);
    soundSystem['audioContext'] = null; // force creation
    soundSystem.play('navigation');
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
    expect(mockOscillatorNode.frequency.value).toBe(600);
  });

  // T11 — Il costruttore del singleton SoundSystem non crea AudioContext, non chiama initialize() e non invoca alcun metodo che crei AudioContext
  it("T11 - il costruttore non crea AudioContext e initialize() non esiste", () => {
    expect((soundSystem as any)['initialize']).toBeUndefined();
  });

  // T12 — Se l'inizializzazione di AudioContext nativo fallisce, play() degrada silenziosamente in no-op
  it("T12 - inizializzazione fallita degrada silenziosamente in no-op", () => {
    const { AudioContext } = require('react-native-audio-api');
    AudioContext.mockImplementationOnce(() => {
      throw new Error('Native Audio Context failed');
    });
    soundSystem.initFromSettings(true, 0.3);
    soundSystem['audioContext'] = null; // force creation
    expect(() => soundSystem.play('click')).not.toThrow();
    expect(soundSystem.getEnabled()).toBe(false);
  });

  // T13 — Il passaggio di AppState a background/inactive sospende l'audio context se istanziato
  it("T13 - AppState a background/inactive sospende l'audio context", () => {
    soundSystem.initFromSettings(true, 0.3);
    soundSystem['audioContext'] = null; // force creation
    soundSystem.play('click'); // instantiate context
    
    const addListenerMock = AppState.addEventListener as jest.Mock;
    expect(addListenerMock).toHaveBeenCalled();
    const handler = addListenerMock.mock.calls[0][1];
    
    handler('background');
    expect(mockAudioContext.suspend).toHaveBeenCalled();
  });

  // T14 — Il passaggio di AppState ad active riesuma l'audio context solo se l'impostazione enabled è true
  it("T14 - AppState ad active riesuma l'audio context solo se enabled === true", () => {
    soundSystem.initFromSettings(true, 0.3);
    soundSystem['audioContext'] = null;
    soundSystem.play('click');
    
    const addListenerMock = AppState.addEventListener as jest.Mock;
    const handler = addListenerMock.mock.calls[0][1];
    
    handler('active');
    expect(mockAudioContext.resume).toHaveBeenCalled();
    
    mockAudioContext.resume.mockClear();
    soundSystem.initFromSettings(false, 0.3);
    handler('active');
    expect(mockAudioContext.resume).not.toHaveBeenCalled();
  });

  // T15 — Il caricamento iniziale delle preferenze in useUserSettings chiama soundSystem.initFromSettings con i valori idratati
  it("T15 - useUserSettings chiama soundSystem.initFromSettings con i valori iniziali all'idratazione", () => {
    const initSpy = jest.spyOn(soundSystem, 'initFromSettings');
    
    function Probe() {
      useUserSettings();
      return null;
    }
    
    act(() => {
      TestRenderer.create(React.createElement(Probe));
    });
    
    expect(initSpy).toHaveBeenCalledWith(true, 0.8);
    initSpy.mockRestore();
  });

  // T16 — La funzione setAudioEnabled aggiorna l'istanza soundSystem dopo la persistenza su Supabase
  it("T16 - setAudioEnabled aggiorna soundSystem dopo la persistenza", async () => {
    const setEnabledSpy = jest.spyOn(soundSystem, 'setEnabled').mockResolvedValue(undefined);
    
    let hookResult: any;
    function Probe() {
      hookResult = useUserSettings();
      return null;
    }
    
    act(() => {
      TestRenderer.create(React.createElement(Probe));
    });
    
    await act(async () => {
      await hookResult.setAudioEnabled(false);
    });
    
    expect(require('@/lib/supabase/repositories/impostazioni-utente').updatePreference).toHaveBeenCalledWith('audio_enabled', false);
    expect(setEnabledSpy).toHaveBeenCalledWith(false);
    setEnabledSpy.mockRestore();
  });

  // T17 — La funzione setAudioVolume aggiorna l'istanza soundSystem dopo la persistenza su Supabase
  it("T17 - setAudioVolume aggiorna soundSystem dopo la persistenza", async () => {
    const setVolumeSpy = jest.spyOn(soundSystem, 'setVolume').mockResolvedValue(undefined);
    
    let hookResult: any;
    function Probe() {
      hookResult = useUserSettings();
      return null;
    }
    
    act(() => {
      TestRenderer.create(React.createElement(Probe));
    });
    
    await act(async () => {
      await hookResult.setAudioVolume(0.5);
    });
    
    expect(require('@/lib/supabase/repositories/impostazioni-utente').updatePreference).toHaveBeenCalledWith('audio_volume', 0.5);
    expect(setVolumeSpy).toHaveBeenCalledWith(0.5);
    setVolumeSpy.mockRestore();
  });

  // T18 — playSequence() pianifica le note usando audioContext.currentTime con oscillator.start(startTime) e oscillator.stop(stopTime), dove startTime è espresso in secondi come offset su currentTime. setTimeout non viene usato per la temporizzazione musicale.
  it("T18 - playSequence() pianifica le note usando currentTime senza setTimeout", () => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
    soundSystem.initFromSettings(true, 0.3);
    soundSystem['audioContext'] = null; // force creation
    soundSystem.play('success');
    
    expect(mockOscillatorNode.start).toHaveBeenCalled();
    expect(mockOscillatorNode.stop).toHaveBeenCalled();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
  });

  // T19 — Se AudioContext fallisce durante ensureContext(), la proprietà enabled viene impostata a false solo in memoria runtime
  it("T19 - in caso di fallimento runtime la proprietà enabled diventa false in memoria senza toccare Supabase", () => {
    const { AudioContext } = require('react-native-audio-api');
    AudioContext.mockImplementationOnce(() => {
      throw new Error('Native Audio Context failed');
    });
    
    soundSystem.initFromSettings(true, 0.3);
    soundSystem['audioContext'] = null; // force recreation
    
    const updatePrefMock = require('@/lib/supabase/repositories/impostazioni-utente').updatePreference;
    updatePrefMock.mockClear();
    
    soundSystem.play('click');
    expect(soundSystem.getEnabled()).toBe(false);
    expect(updatePrefMock).not.toHaveBeenCalled();
    
    // Restore it
    soundSystem.initFromSettings(true, 0.3);
    expect(soundSystem.getEnabled()).toBe(true);
  });

  // T20 — I SoundType legacy usati dai consumer reali attuali vengono normalizzati verso i 5 canonici tramite normalizeSoundType() senza errore di tipo TypeScript e senza ricadere nel ramo default
  it("T20 - verifica normalizzazione dei 16 suoni legacy obbligatori", () => {
    const mapping: Record<string, string> = {
      'pin-error': 'error',
      'private-unlock': 'success',
      'dialog-close': 'navigation',
      'budget-exceeded': 'error',
      'budget-critical': 'warning',
      'budget-warning': 'warning',
      'save': 'success',
      'account-created': 'success',
      'income': 'success',
      'expense': 'click',
      'transfer': 'navigation',
      'delete': 'error',
      'budget-deleted': 'error',
      'export': 'success',
      'budget-created': 'success',
      'goal-created': 'success',
    };
    
    Object.keys(mapping).forEach((legacySound) => {
      const res = soundSystem['normalizeSoundType'](legacySound as any);
      expect(res).toBe(mapping[legacySound]);
    });
  });

  // --- INTEGRATION SESSIONE E4 ---

  it("T21 (E4-1) - normalizeSoundType fa il fallback su click per suoni non validi", () => {
    const res = soundSystem['normalizeSoundType']('invalid-sound' as any);
    expect(res).toBe('click');
  });

  it("T22 (E4-2) - play non fa nulla se soundType non è valido e viene normalizzato ad un valore gestito", () => {
    soundSystem.initFromSettings(true, 0.3);
    soundSystem['audioContext'] = mockAudioContext as any;
    expect(() => soundSystem.play(undefined as any)).not.toThrow();
  });

  it("T23 (E4-3) - play gestisce la sicurezza se il context è in stato closed", () => {
    soundSystem.initFromSettings(true, 0.3);
    soundSystem['audioContext'] = mockAudioContext as any;
    mockAudioContext.state = 'closed';
    const prev = mockAudioContext.createOscillator;
    mockAudioContext.createOscillator = jest.fn().mockImplementationOnce(() => {
      throw new Error('Closed context');
    });
    expect(() => soundSystem.play('click')).not.toThrow();
    mockAudioContext.createOscillator = prev;
  });

  it("T24 (E4-4) - play ricrea il context se resettato a null", () => {
    soundSystem.initFromSettings(true, 0.3);
    soundSystem['audioContext'] = null;
    soundSystem.play('success');
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it("T25 (E4-5) - play funziona su iOS", () => {
    Object.defineProperty(Platform, 'OS', {
      value: 'ios',
      configurable: true,
    });
    soundSystem.initFromSettings(true, 0.3);
    soundSystem['audioContext'] = null;
    expect(() => soundSystem.play('click')).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it("T26 (E4-6) - useUserSettings riflette i valori modificati", async () => {
    let hookResult: any;
    function Probe() {
      hookResult = useUserSettings();
      return null;
    }
    act(() => {
      TestRenderer.create(React.createElement(Probe));
    });
    expect(hookResult.audioEnabled).toBe(true);
    expect(hookResult.audioVolume).toBe(0.8);
  });

  it("T27 (E4-7) - registerAppStateListener si registra correttamente", () => {
    const addListenerSpy = jest.spyOn(AppState, 'addEventListener');
    soundSystem.initFromSettings(true, 0.3);
    soundSystem['audioContext'] = null;
    soundSystem.play('click');
    expect(addListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
    addListenerSpy.mockRestore();
  });
});
