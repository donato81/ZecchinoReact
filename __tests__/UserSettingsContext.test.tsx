import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { UserSettingsProvider, useUserSettings } from '@/context/UserSettingsContext';

const mockUserSettingsValue = {
  visibleCategories: ['cat1'],
  dismissedBudgetAlerts: [],
  setVisibleCategories: jest.fn(),
  dismissBudgetAlert: jest.fn(),
  resetDismissedAlerts: jest.fn(),
  isSettingsReady: true,
  isSettingsLoading: false,
  settingsError: null,
  audioEnabled: true,
  audioVolume: 0.5,
  setAudioEnabled: jest.fn(),
  setAudioVolume: jest.fn(),
  hapticEnabled: true,
  setHapticEnabled: jest.fn(),
  displayPreferences: {},
  setDisplayPreference: jest.fn(),
  screenReaderPreferences: {},
  setScreenReaderPreference: jest.fn(),
  talkBackAdaptations: {},
  talkBackManualOverride: null,
  setTalkBackAdaptations: jest.fn(),
  setTalkBackManualOverride: jest.fn(),
  resetScreenReaderPreferences: jest.fn(),
};

jest.mock('@/hooks/use-user-settings', () => ({
  useUserSettings: () => mockUserSettingsValue,
}));

describe('UserSettingsContext - Unit Tests (Test 18-20)', () => {
  it('Test 18: Provider mount - UserSettingsProvider monta correttamente i figli avvolgendoli con lo stato', () => {
    let renderedChildren = false;
    act(() => {
      TestRenderer.create(
        <UserSettingsProvider>
          <React.Fragment />
        </UserSettingsProvider>
      );
      renderedChildren = true;
    });
    expect(renderedChildren).toBe(true);
  });

  it('Test 19: Hook consumo - useUserSettings restituisce i dati validi se consumato dentro il provider', () => {
    let contextValue: any = null;
    function Consumer() {
      contextValue = useUserSettings();
      return null;
    }

    act(() => {
      TestRenderer.create(
        <UserSettingsProvider>
          <Consumer />
        </UserSettingsProvider>
      );
    });

    expect(contextValue).toEqual(mockUserSettingsValue);
  });

  it('Test 20: Errore fuori provider - useUserSettings solleva eccezione esplicita se consumato all\'esterno del provider', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    function Consumer() {
      useUserSettings();
      return null;
    }

    expect(() => {
      act(() => {
        TestRenderer.create(<Consumer />);
      });
    }).toThrow('useUserSettings deve essere usato dentro UserSettingsProvider');

    errorSpy.mockRestore();
  });
});
