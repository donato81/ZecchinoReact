import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AuthProvider } from '../src/context/AuthContext';
import { AccessibilityInfo } from 'react-native';

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      signOut: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

jest.mock('@/lib/supabase/cache', () => ({
  invalidateCache: jest.fn(),
}));

jest.mock('@/lib/supabase/repositories/impostazioni-utente', () => ({
  getOrCreate: jest.fn().mockResolvedValue({ pinHashed: null, pinSalt: null }),
  updatePreference: jest.fn(),
  updatePinSecurityMaterial: jest.fn(),
}));

jest.mock('@/lib/sound-system', () => ({
  soundSystem: { play: jest.fn() },
}));

jest.mock('@/lib/haptic-system', () => ({
  hapticSystem: { pinError: jest.fn(), privateUnlock: jest.fn() },
}));

jest.mock('@/hooks/use-inactivity-timer', () => ({
  useInactivityTimer: jest.fn(() => ({
    resetTimer: jest.fn(),
    showWarning: false,
  })),
}));

jest.mock('@/accessibility/detection', () => ({
  useAccessibilityDetection: jest.fn(() => ({
    talkBackState: { enabled: false },
  })),
}));

jest.mock('@/announcements', () => ({
  announce: jest.fn(),
  auth: {
    pinNotConfigured: jest.fn(),
    pinInvalid: jest.fn(),
    privateUnlocked: jest.fn(),
    privateAccountLocked: jest.fn(),
    pinSet: jest.fn(),
    pinChanged: jest.fn(),
    pinRemoved: jest.fn(),
    sessionKept: jest.fn(),
  },
}));

describe('AuthContext Cleanup Test', () => {
  let spyIsScreenReaderEnabled: jest.SpiedFunction<typeof AccessibilityInfo.isScreenReaderEnabled>;
  let spyAddEventListener: jest.SpiedFunction<typeof AccessibilityInfo.addEventListener>;

  beforeEach(() => {
    spyIsScreenReaderEnabled = jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(false);
    spyAddEventListener = jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue(undefined as any);
  });

  afterEach(() => {
    spyIsScreenReaderEnabled.mockRestore();
    spyAddEventListener.mockRestore();
  });

  it('should unmount AuthProvider without exception when screen reader subscription is undefined', async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <AuthProvider>
          <React.Fragment />
        </AuthProvider>
      );
    });

    await act(async () => {
      renderer.unmount();
    });
  });
});
