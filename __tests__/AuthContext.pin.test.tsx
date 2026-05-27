import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
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
  getOrCreate: jest.fn(),
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
  useInactivityTimer: jest.fn(() => ({ resetTimer: jest.fn(), showWarning: false })),
}));

jest.mock('@/accessibility/detection', () => ({
  useAccessibilityDetection: jest.fn(() => ({ talkBackState: { enabled: false } })),
}));

jest.mock('@/announcements', () => ({
  announce: jest.fn(),
  auth: {
    pinNotConfigured: jest.fn(() => ({ text: 'pin-not-configured', priority: 'assertive' })),
    pinInvalid: jest.fn(() => ({ text: 'pin-invalid', priority: 'assertive' })),
    privateUnlocked: jest.fn(() => ({ text: 'private-unlocked', priority: 'polite' })),
    privateAccountLocked: jest.fn(() => ({ text: 'private-locked', priority: 'polite' })),
    pinSet: jest.fn(() => ({ text: 'pin-set', priority: 'polite' })),
    pinChanged: jest.fn(() => ({ text: 'pin-changed', priority: 'polite' })),
    pinRemoved: jest.fn(() => ({ text: 'pin-removed', priority: 'polite' })),
    sessionKept: jest.fn(() => ({ text: 'session-kept', priority: 'polite' })),
  },
}));

import {
  encodeBase64,
  generateMasterKey,
  generatePinSalt,
  serializeWrappedMasterKeyPayload,
  unwrapMasterKeyWithPin,
  wrapMasterKeyWithPin,
} from '@/lib/crypto';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import {
  getOrCreate,
  updatePinSecurityMaterial,
} from '@/lib/supabase/repositories/impostazioni-utente';

const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockOnAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;
const mockSignOut = supabase.auth.signOut as jest.Mock;
const mockGetOrCreate = getOrCreate as jest.MockedFunction<typeof getOrCreate>;
const mockUpdatePinSecurityMaterial = updatePinSecurityMaterial as jest.MockedFunction<typeof updatePinSecurityMaterial>;

type AuthValue = ReturnType<typeof useAuth>;

function makeSettings(overrides: Partial<Awaited<ReturnType<typeof getOrCreate>>> = {}) {
  return {
    nomeVisualizzato: 'Mario',
    valutaDefault: 'EUR',
    pinPrivatoHash: null,
    pinKdfSalt: null,
    pinMasterKeyEncrypted: null,
    preferences: {
      display_show_balances: true,
      display_show_account_icons: true,
      display_compact_mode: false,
      display_show_categories: true,
      display_animations_enabled: true,
      display_font_size: 16,
      display_currency_display: 'symbol',
      display_number_format: 'it-IT',
      display_high_contrast: false,
      display_show_percentages: true,
      display_show_transaction_icons: true,
      display_reduce_motion: false,
      sr_verbosity: 'normal',
      sr_announce_navigation: true,
      sr_announce_filters: true,
      sr_announce_form_changes: true,
      sr_announce_shortcuts: true,
      sr_announce_balance_changes: true,
      sr_announce_budget_alerts: true,
      sr_announce_progress: true,
      sr_announce_focus_changes: true,
      sr_announce_list_position: true,
      sr_announce_delay: 0,
      sr_reduced_announcements: false,
      audio_enabled: true,
      audio_volume: 1,
      talkback_adaptations: {
        enhancedTouchTargets: false,
        simplifiedNavigation: false,
        extendedTimeouts: false,
        verboseDescriptions: false,
        highContrastMode: false,
        reducedMotion: false,
        autoFocusManagement: false,
        spatialAudio: false,
      },
      talkback_manual_override: null,
    },
    ...overrides,
  } as Awaited<ReturnType<typeof getOrCreate>>;
}

function renderAuthProvider(): { getValue: () => AuthValue; unmount: () => void } {
  let captured: AuthValue | null = null;
  let renderer: TestRenderer.ReactTestRenderer;

  function Capture(): null {
    captured = useAuth();
    return null;
  }

  act(() => {
    renderer = TestRenderer.create(
      React.createElement(AuthProvider, null, React.createElement(Capture)),
    );
  });

  return {
    getValue: () => {
      if (!captured) {
        throw new Error('AuthContext non disponibile');
      }
      return captured;
    },
    unmount: () => {
      act(() => {
        renderer.unmount();
      });
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-010' } } } });
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
  mockSignOut.mockResolvedValue({ error: null });
  mockGetOrCreate.mockResolvedValue(makeSettings());
  mockUpdatePinSecurityMaterial.mockResolvedValue(undefined);
});

describe('AuthContext PIN flows — PLAN 010', () => {
  it('setPin genera hash, salt e master key cifrata nello stesso passaggio', async () => {
    const harness = renderAuthProvider();

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await harness.getValue().setPin('482917');
    });

    expect(mockUpdatePinSecurityMaterial).toHaveBeenCalledTimes(1);
    const payload = mockUpdatePinSecurityMaterial.mock.calls[0][0];
    expect(payload.hash).toEqual(expect.any(String));
    expect(payload.salt).toEqual(expect.any(String));
    expect(payload.encryptedMasterKey).toEqual(expect.any(String));
    expect(harness.getValue().isPrivateUnlocked).toBe(true);

    harness.unmount();
  });

  it('changePin ricifra solo la master key esistente', async () => {
    const masterKey = generateMasterKey();
    const oldSalt = generatePinSalt();
    const encryptedMasterKey = serializeWrappedMasterKeyPayload(
      wrapMasterKeyWithPin(masterKey, '111111', oldSalt),
    );

    mockGetOrCreate.mockResolvedValue(
      makeSettings({
        pinPrivatoHash: await require('@/lib/crypto').hashPin('111111'),
        pinKdfSalt: encodeBase64(oldSalt),
        pinMasterKeyEncrypted: encryptedMasterKey,
      }),
    );

    const harness = renderAuthProvider();

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await harness.getValue().changePin('111111', '222222');
    });

    const updateArg = mockUpdatePinSecurityMaterial.mock.calls[0][0];
    expect(updateArg.hash).toEqual(expect.any(String));
    expect(updateArg.salt).toEqual(expect.any(String));
    expect(updateArg.encryptedMasterKey).toEqual(expect.any(String));
    expect(updateArg.encryptedMasterKey).not.toBe(encryptedMasterKey);
    expect(
      encodeBase64(
        unwrapMasterKeyWithPin(updateArg.encryptedMasterKey, '222222', require('@/lib/crypto').decodeBase64(updateArg.salt)),
      ),
    ).toBe(encodeBase64(masterKey));

    harness.unmount();
  });

  it('removePin azzera i tre campi e forza il logout globale', async () => {
    const masterKey = generateMasterKey();
    const salt = generatePinSalt();
    const encryptedMasterKey = serializeWrappedMasterKeyPayload(
      wrapMasterKeyWithPin(masterKey, '111111', salt),
    );

    mockGetOrCreate.mockResolvedValue(
      makeSettings({
        pinPrivatoHash: await require('@/lib/crypto').hashPin('111111'),
        pinKdfSalt: encodeBase64(salt),
        pinMasterKeyEncrypted: encryptedMasterKey,
      }),
    );

    const harness = renderAuthProvider();

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await harness.getValue().removePin('111111');
    });

    expect(mockUpdatePinSecurityMaterial).toHaveBeenCalledWith({
      hash: null,
      salt: null,
      encryptedMasterKey: null,
    });
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'global' });

    harness.unmount();
  });
});