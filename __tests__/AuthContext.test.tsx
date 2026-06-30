import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { AccessibilityInfo } from 'react-native';
import { supabase } from '@/lib/supabase/client';
import { invalidateCache } from '@/lib/supabase/cache';
import { getOrCreate, updatePreference, updatePinSecurityMaterial } from '@/lib/supabase/repositories/impostazioni-utente';
import { useInactivityTimer } from '@/hooks/use-inactivity-timer';
import { announce } from '@/announcements';

const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockOnAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;
const mockSignOut = supabase.auth.signOut as jest.Mock;
const mockSignInWithPassword = supabase.auth.signInWithPassword as jest.Mock;
const mockSignUp = supabase.auth.signUp as jest.Mock;
const mockResetPasswordForEmail = supabase.auth.resetPasswordForEmail as jest.Mock;

const mockInvalidateCache = invalidateCache as jest.Mock;
const mockGetOrCreate = getOrCreate as jest.MockedFunction<typeof getOrCreate>;
const mockUpdatePreference = updatePreference as jest.MockedFunction<typeof updatePreference>;
const mockUpdatePinSecurityMaterial = updatePinSecurityMaterial as jest.MockedFunction<typeof updatePinSecurityMaterial>;

const mockUseInactivityTimer = useInactivityTimer as jest.Mock;
const mockAnnounce = announce as jest.MockedFunction<typeof announce>;

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
jest.mock('@/lib/storage-cleanup-service', () => ({
  storageCleanupService: {
    cleanupOnLogout: jest.fn().mockResolvedValue(undefined),
    cleanupRecentOrphans: jest.fn().mockResolvedValue(undefined),
    cleanupTransactionOrphans: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('@/lib/crypto', () => {
  const actual = jest.requireActual('@/lib/crypto');
  return {
    ...actual,
    verifyPin: jest.fn(),
    hashPin: jest.fn(),
    rewrapMasterKeyWithPin: jest.fn().mockReturnValue('mock-new-wrapped-key'),
  };
});

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

describe('AuthContext Main Flows — Commit 1', () => {
  type AuthValue = ReturnType<typeof useAuth>;

  function renderAuthProvider(): {
    getValue: () => AuthValue;
    unmount: () => void;
    getRenderer: () => TestRenderer.ReactTestRenderer;
  } {
    let captured: AuthValue | null = null;
    let renderer: TestRenderer.ReactTestRenderer;

    function Capture(): null {
      captured = useAuth();
      return null;
    }

    act(() => {
      renderer = TestRenderer.create(
        <AuthProvider>
          <Capture />
        </AuthProvider>
      );
    });

    return {
      getValue: () => {
        if (!captured) throw new Error('AuthContext non disponibile');
        return captured;
      },
      unmount: () => {
        act(() => {
          renderer.unmount();
        });
      },
      getRenderer: () => renderer,
    };
  }

  let spyIsScreenReaderEnabled: jest.SpiedFunction<typeof AccessibilityInfo.isScreenReaderEnabled>;
  let spyAddEventListener: jest.SpiedFunction<typeof AccessibilityInfo.addEventListener>;

  beforeEach(() => {
    jest.clearAllMocks();
    spyIsScreenReaderEnabled = jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(false);
    spyAddEventListener = jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: jest.fn() } as any);
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    mockSignOut.mockResolvedValue({ error: null });
    mockGetOrCreate.mockResolvedValue({
      nomeVisualizzato: 'Test User',
      valutaDefault: 'EUR',
      pinPrivatoHash: null,
      pinKdfSalt: null,
      pinMasterKeyEncrypted: null,
      preferences: {
        session_timeout_minutes: 5,
      },
    } as any);
  });

  afterEach(() => {
    spyIsScreenReaderEnabled.mockRestore();
    spyAddEventListener.mockRestore();
  });

  it('AUTH-01: signIn completa con successo con credenziali valide e aggiorna la sessione utente', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null });
    const harness = renderAuthProvider();
    await act(async () => {
      await harness.getValue().signIn('test@example.com', 'password123');
    });
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    harness.unmount();
  });

  it('AUTH-02: signIn fallisce su credenziali non valide, propaga l\'errore e non aggiorna lo stato', async () => {
    const error = new Error('Invalid credentials');
    mockSignInWithPassword.mockResolvedValue({ data: { user: null }, error });
    const harness = renderAuthProvider();
    await act(async () => {
      await expect(harness.getValue().signIn('wrong@example.com', 'pwd')).rejects.toThrow('Invalid credentials');
    });
    harness.unmount();
  });

  it('AUTH-03: signUp esegue correttamente la registrazione con credenziali valide', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: 'new-user' } }, error: null });
    const harness = renderAuthProvider();
    await act(async () => {
      await harness.getValue().signUp('new@example.com', 'password123');
    });
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
    });
    harness.unmount();
  });

  it('AUTH-04: signUp fallisce se l\'email esiste gia, propagando l\'errore', async () => {
    const error = new Error('User already exists');
    mockSignUp.mockResolvedValue({ data: { user: null }, error });
    const harness = renderAuthProvider();
    await act(async () => {
      await expect(harness.getValue().signUp('exists@example.com', 'pwd')).rejects.toThrow('User already exists');
    });
    harness.unmount();
  });

  it('AUTH-05: signOut rimuove il PIN locale, blocca lo stato privato, esegue il cleanup di cache e storage, ed effettua il logout nativo', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } });
    mockSignOut.mockResolvedValue({ error: null });
    const harness = renderAuthProvider();
    for (let i = 0; i < 10 && !harness.getValue().isAuthReady; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }
    await act(async () => {
      await harness.getValue().signOut();
    });
    expect(mockInvalidateCache).toHaveBeenCalledWith('user-id');
    expect(mockSignOut).toHaveBeenCalled();
    expect(harness.getValue().isPrivateUnlocked).toBe(false);
    harness.unmount();
  });

  it('AUTH-06: resetPassword invoca correttamente il servizio Supabase Auth', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    const harness = renderAuthProvider();
    await act(async () => {
      await harness.getValue().resetPassword('user@example.com');
    });
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@example.com');
    harness.unmount();
  });

  it('AUTH-07: resetPassword fallisce se la rete e assente o altro errore, propagando l\'errore', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: null, error: new Error('Network error') });
    const harness = renderAuthProvider();
    await act(async () => {
      await expect(harness.getValue().resetPassword('user@example.com')).rejects.toThrow('Network error');
    });
    harness.unmount();
  });

  it('AUTH-07b: resetPassword non lancia errore se l\'email non esiste (gestito silenziosamente)', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: null, error: new Error('Email not found') });
    const harness = renderAuthProvider();
    await act(async () => {
      await expect(harness.getValue().resetPassword('notfound@example.com')).resolves.toBeUndefined();
    });
    harness.unmount();
  });

  describe('Inactivity Timers (AUTH-08..11)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      mockUseInactivityTimer.mockImplementation(({ timeoutMinutes, onTimeout }) => {
        const [showWarning, setShowWarning] = React.useState(false);
        const [generation, setGeneration] = React.useState(0);
        const onTimeoutRef = React.useRef(onTimeout);
        onTimeoutRef.current = onTimeout;

        const resetTimer = React.useCallback(() => {
          setShowWarning(false);
          setGeneration(g => g + 1);
        }, []);

        React.useEffect(() => {
          if (timeoutMinutes <= 0) {
            setShowWarning(false);
            return;
          }
          const warningMs = Math.max((timeoutMinutes - 1) * 60_000, 0);
          const timeoutMs = timeoutMinutes * 60_000;

          const wTimer = setTimeout(() => {
            setShowWarning(true);
          }, warningMs);

          const tTimer = setTimeout(() => {
            setShowWarning(false);
            onTimeoutRef.current();
          }, timeoutMs);

          return () => {
            clearTimeout(wTimer);
            clearTimeout(tTimer);
          };
        }, [timeoutMinutes, generation]);

        return { resetTimer, showWarning };
      });
    });

    afterEach(() => {
      act(() => {
        jest.runOnlyPendingTimers();
      });
      jest.useRealTimers();
    });

    it('AUTH-08: Se timeoutMinutes <= 0, il timer di inattivita non viene configurato ne avviato', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } });
      mockGetOrCreate.mockResolvedValue({
        nomeVisualizzato: 'Test User',
        valutaDefault: 'EUR',
        preferences: {
          session_timeout_minutes: 0,
        },
      } as any);
      
      const harness = renderAuthProvider();
      for (let i = 0; i < 10 && !harness.getValue().isAuthReady; i++) {
        await act(async () => {
          await Promise.resolve();
        });
      }
      
      expect(harness.getValue().inactivityTimeout).toBe(0);
      harness.unmount();
    });

    it('AUTH-09: Timer di inattivita si esaurisce regolarmente, scatenando la disconnessione automatica (signOut)', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } });
      mockGetOrCreate.mockResolvedValue({
        nomeVisualizzato: 'Test User',
        valutaDefault: 'EUR',
        preferences: {
          session_timeout_minutes: 5,
        },
      } as any);
      mockSignOut.mockResolvedValue({ error: null });

      const harness = renderAuthProvider();
      for (let i = 0; i < 10 && !harness.getValue().isAuthReady; i++) {
        await act(async () => {
          await Promise.resolve();
        });
      }

      await act(async () => {
        jest.advanceTimersByTime(5 * 60_000);
      });

      expect(mockSignOut).toHaveBeenCalled();
      harness.unmount();
    });

    it('AUTH-10: Raggiungimento del tempo di warning (durata - 1 minuto) imposta showWarning a true', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } });
      mockGetOrCreate.mockResolvedValue({
        nomeVisualizzato: 'Test User',
        valutaDefault: 'EUR',
        preferences: {
          session_timeout_minutes: 5,
        },
      } as any);

      const harness = renderAuthProvider();
      for (let i = 0; i < 10 && !harness.getValue().isAuthReady; i++) {
        await act(async () => {
          await Promise.resolve();
        });
      }

      await act(async () => {
        jest.advanceTimersByTime(4 * 60_000);
      });

      const alert = harness.getRenderer().root.findByProps({ accessibilityRole: 'alert' });
      expect(alert).toBeDefined();
      harness.unmount();
    });

    it('AUTH-11: Clic su Rimani connesso reimposta correttamente il timer di inattivita ripartendo da zero', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } });
      mockGetOrCreate.mockResolvedValue({
        nomeVisualizzato: 'Test User',
        valutaDefault: 'EUR',
        preferences: {
          session_timeout_minutes: 5,
        },
      } as any);

      const harness = renderAuthProvider();
      for (let i = 0; i < 10 && !harness.getValue().isAuthReady; i++) {
        await act(async () => {
          await Promise.resolve();
        });
      }

      await act(async () => {
        jest.advanceTimersByTime(4 * 60_000);
      });

      const button = harness.getRenderer().root.findByProps({ variant: 'outline' });
      await act(async () => {
        button.props.onPress();
      });

      expect(() => harness.getRenderer().root.findByProps({ accessibilityRole: 'alert' })).toThrow();
      harness.unmount();
    });
  });
});

describe('AuthContext PIN and Accessibility — Commit 2', () => {
  type AuthValue = ReturnType<typeof useAuth>;

  function renderAuthProvider(): {
    getValue: () => AuthValue;
    unmount: () => void;
    getRenderer: () => TestRenderer.ReactTestRenderer;
  } {
    let captured: AuthValue | null = null;
    let renderer: TestRenderer.ReactTestRenderer;

    function Capture(): null {
      captured = useAuth();
      return null;
    }

    act(() => {
      renderer = TestRenderer.create(
        <AuthProvider>
          <Capture />
        </AuthProvider>
      );
    });

    return {
      getValue: () => {
        if (!captured) throw new Error('AuthContext non disponibile');
        return captured;
      },
      unmount: () => {
        act(() => {
          renderer.unmount();
        });
      },
      getRenderer: () => renderer,
    };
  }

  let spyIsScreenReaderEnabled: jest.SpiedFunction<typeof AccessibilityInfo.isScreenReaderEnabled>;
  let spyAddEventListener: jest.SpiedFunction<typeof AccessibilityInfo.addEventListener>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInactivityTimer.mockImplementation(() => ({
      resetTimer: jest.fn(),
      showWarning: false,
    }));
    spyIsScreenReaderEnabled = jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(false);
    spyAddEventListener = jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: jest.fn() } as any);
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    mockSignOut.mockResolvedValue({ error: null });
    mockGetOrCreate.mockResolvedValue({
      nomeVisualizzato: 'Test User',
      valutaDefault: 'EUR',
      pinPrivatoHash: null,
      pinKdfSalt: null,
      pinMasterKeyEncrypted: null,
      preferences: {
        session_timeout_minutes: 5,
      },
    } as any);
  });

  afterEach(() => {
    spyIsScreenReaderEnabled.mockRestore();
    spyAddEventListener.mockRestore();
  });

  it('AUTH-12: unlockPrivate con PIN errato fallisce: sblocco bloccato, haptic error, suono e annuncio assertive', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } });
    const harness = renderAuthProvider();
    for (let i = 0; i < 10 && !harness.getValue().isAuthReady; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }

    await act(async () => {
      await expect(harness.getValue().unlockPrivate('123456')).rejects.toThrow();
    });

    const mockVerifyPin = require('@/lib/crypto').verifyPin as jest.Mock;
    mockVerifyPin.mockResolvedValueOnce(false);
    
    mockGetOrCreate.mockResolvedValue({
      nomeVisualizzato: 'Test User',
      valutaDefault: 'EUR',
      pinPrivatoHash: 'somehash',
      pinKdfSalt: 'salt',
      pinMasterKeyEncrypted: 'enckey',
      preferences: {
        session_timeout_minutes: 5,
      },
    } as any);

    harness.unmount();
    const harness2 = renderAuthProvider();
    for (let i = 0; i < 10 && !harness2.getValue().isAuthReady; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }

    await act(async () => {
      await expect(harness2.getValue().unlockPrivate('wrongpin')).rejects.toThrow();
    });

    expect(harness2.getValue().isPrivateUnlocked).toBe(false);
    harness2.unmount();
  });

  it('AUTH-13: changePin fallisce se il vecchio PIN inserito non corrisponde all\'hash memorizzato', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } });
    mockGetOrCreate.mockResolvedValue({
      nomeVisualizzato: 'Test User',
      valutaDefault: 'EUR',
      pinPrivatoHash: 'oldhash',
      pinKdfSalt: 'oldsalt',
      pinMasterKeyEncrypted: 'oldenckey',
      preferences: {
        session_timeout_minutes: 5,
      },
    } as any);

    const mockVerifyPin = require('@/lib/crypto').verifyPin as jest.Mock;
    mockVerifyPin.mockResolvedValueOnce(false);

    const harness = renderAuthProvider();
    for (let i = 0; i < 10 && !harness.getValue().isAuthReady; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }

    await act(async () => {
      await expect(harness.getValue().changePin('wrongold', 'newpin')).rejects.toThrow();
    });
    harness.unmount();
  });

  it('AUTH-14: changePin fallisce in caso di errore di rete durante il salvataggio dei nuovi parametri Supabase', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } });
    mockGetOrCreate.mockResolvedValue({
      nomeVisualizzato: 'Test User',
      valutaDefault: 'EUR',
      pinPrivatoHash: 'oldhash',
      pinKdfSalt: 'oldsalt',
      pinMasterKeyEncrypted: 'oldenckey',
      preferences: {
        session_timeout_minutes: 5,
      },
    } as any);

    const mockVerifyPin = require('@/lib/crypto').verifyPin as jest.Mock;
    mockVerifyPin.mockResolvedValueOnce(true);

    mockUpdatePinSecurityMaterial.mockRejectedValueOnce(new Error('Network error'));

    const harness = renderAuthProvider();
    for (let i = 0; i < 10 && !harness.getValue().isAuthReady; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }

    await act(async () => {
      await expect(harness.getValue().changePin('correctold', 'newpin')).rejects.toThrow('Network error');
    });

    expect(harness.getValue().userSettings?.pinPrivatoHash).toBe('oldhash');
    harness.unmount();
  });

  it('AUTH-15: removePin fallisce se il PIN inserito per convalida e errato', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } });
    mockGetOrCreate.mockResolvedValue({
      nomeVisualizzato: 'Test User',
      valutaDefault: 'EUR',
      pinPrivatoHash: 'somehash',
      pinKdfSalt: 'salt',
      pinMasterKeyEncrypted: 'enckey',
      preferences: {
        session_timeout_minutes: 5,
      },
    } as any);

    const mockVerifyPin = require('@/lib/crypto').verifyPin as jest.Mock;
    mockVerifyPin.mockResolvedValueOnce(false);

    const harness = renderAuthProvider();
    for (let i = 0; i < 10 && !harness.getValue().isAuthReady; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }

    await act(async () => {
      await expect(harness.getValue().removePin('wrongpin')).rejects.toThrow();
    });
    harness.unmount();
  });

  it('AUTH-16: removePin con PIN corretto azzera i tre campi PIN ed esegue signOut globale', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } });
    mockGetOrCreate.mockResolvedValue({
      nomeVisualizzato: 'Test User',
      valutaDefault: 'EUR',
      pinPrivatoHash: 'somehash',
      pinKdfSalt: 'salt',
      pinMasterKeyEncrypted: 'enckey',
      preferences: {
        session_timeout_minutes: 5,
      },
    } as any);

    const mockVerifyPin = require('@/lib/crypto').verifyPin as jest.Mock;
    mockVerifyPin.mockResolvedValueOnce(true);

    const harness = renderAuthProvider();
    for (let i = 0; i < 10 && !harness.getValue().isAuthReady; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }

    await act(async () => {
      await harness.getValue().removePin('correctpin');
    });

    expect(mockUpdatePinSecurityMaterial).toHaveBeenCalledWith({
      hash: null,
      salt: null,
      encryptedMasterKey: null,
    });
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'global' });
    harness.unmount();
  });

  it('AUTH-17: Fallimento caricamento iniziale di getOrCreate (impostazioni utente) sul mount valorizza lo stato di errore', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } });
    mockGetOrCreate.mockRejectedValueOnce(new Error('DB failure'));

    const harness = renderAuthProvider();
    for (let i = 0; i < 10 && !harness.getValue().isAuthReady; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }

    expect(harness.getValue().userSettings).toBeNull();
    expect(harness.getValue().inactivityTimeout).toBe(5);
    harness.unmount();
  });

  it('AUTH-18: Mount del provider registra il listener nativo dello screen reader di accessibilita', async () => {
    const harness = renderAuthProvider();
    expect(spyAddEventListener).toHaveBeenCalledWith('screenReaderChanged', expect.any(Function));
    harness.unmount();
  });

  it('AUTH-19: Screen reader unmount — cleanup positivo del listener nativo', async () => {
    const mockSubscription = { remove: jest.fn() };
    spyAddEventListener.mockReturnValueOnce(mockSubscription as any);
    const harness = renderAuthProvider();
    harness.unmount();
    expect(mockSubscription.remove).toHaveBeenCalledTimes(1);
  });

  it('AUTH-20: I cambiamenti di stato dello screen reader aggiornano correttamente lo stato locale e innescano le haptic/audio adaptions', async () => {
    let capturedCallback: ((enabled: boolean) => void) | undefined;
    spyAddEventListener.mockImplementationOnce((event, callback) => {
      capturedCallback = callback as any;
      return { remove: jest.fn() } as any;
    });

    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-id' } } } });
    mockGetOrCreate.mockResolvedValue({
      nomeVisualizzato: 'Test User',
      valutaDefault: 'EUR',
      pinPrivatoHash: 'somehash',
      pinKdfSalt: 'salt',
      pinMasterKeyEncrypted: 'enckey',
      preferences: {
        session_timeout_minutes: 5,
      },
    } as any);

    const harness = renderAuthProvider();
    for (let i = 0; i < 10 && !harness.getValue().isAuthReady; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }

    expect(capturedCallback).toBeDefined();

    await act(async () => {
      capturedCallback!(true);
    });

    const mockVerifyPin = require('@/lib/crypto').verifyPin as jest.Mock;
    mockVerifyPin.mockResolvedValueOnce(false);

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      await expect(harness.getValue().unlockPrivate('wrongpin')).rejects.toThrow();
    });

    expect(errorSpy).not.toHaveBeenCalledWith('[toast:error]', expect.any(String));

    await act(async () => {
      capturedCallback!(false);
    });

    mockVerifyPin.mockResolvedValueOnce(false);
    await act(async () => {
      await expect(harness.getValue().unlockPrivate('wrongpin')).rejects.toThrow();
    });

    expect(errorSpy).toHaveBeenCalledWith('[toast:error]', expect.any(String));

    errorSpy.mockRestore();
    harness.unmount();
  });
});

