import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, View, Text } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import {
  WrappedMasterKeyPayloadError,
  decodeBase64,
  generateMasterKey,
  generatePinSalt,
  hashPin,
  rewrapMasterKeyWithPin,
  serializeWrappedMasterKeyPayload,
  unwrapMasterKeyWithPin,
  verifyPin,
  wrapMasterKeyWithPin,
  encodeBase64,
} from '@/lib/crypto';
import { supabase } from '@/lib/supabase/client';
import { invalidateCache } from '@/lib/supabase/cache';
import {
  getOrCreate,
  updatePinSecurityMaterial,
  updatePreference,
} from '@/lib/supabase/repositories/impostazioni-utente';
import type { UserSettings } from '@/lib/supabase/types';
import { soundSystem } from '@/lib/sound-system';
import { hapticSystem } from '@/lib/haptic-system';
import { Button } from '@/components/ui/button';
import { ActivityDetectorView } from '@/components/ActivityDetectorView';
import { useInactivityTimer } from '@/hooks/use-inactivity-timer';
import { useAccessibilityDetection } from '@/accessibility/detection';
import { announce, auth } from '@/announcements';
import { t } from '@/announcements/_utils/t';
import { storageCleanupService } from '@/lib/storage-cleanup-service';

// Shim temporaneo — rimpiazzare con react-native-toast-message nella fase UI
const sonnerNotify = {
  success: (message: string) => console.log('[toast:success]', message),
  error: (message: string) => console.error('[toast:error]', message),
};

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  completeOnboarding: () => void;
  inactivityTimeout: number;
  userSettings: UserSettings | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isPrivateEnabled: boolean;
  isPrivateUnlocked: boolean;
  setIsPrivateUnlocked: (v: boolean) => void;
  showPrivatePinDialog: boolean;
  setShowPrivatePinDialog: (v: boolean) => void;
  setInactivityTimeout: (minutes: number) => Promise<void>;
  unlockPrivate: (pin: string) => Promise<void>;
  lockPrivate: () => void;
  setPin: (pin: string) => Promise<void>;
  changePin: (oldPin: string, newPin: string) => Promise<void>;
  removePin: (pin: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [inactivityTimeoutState, setInactivityTimeoutState] = useState(5);
  const [isPrivateUnlocked, setIsPrivateUnlocked] = useState(false);
  const [showPrivatePinDialog, setShowPrivatePinDialog] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [privatePinHashCache, setPrivatePinHashCache] = useState<
    string | null | undefined
  >(undefined);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  const { talkBackState } = useAccessibilityDetection();

  const loadUserSettings = useCallback(async () => {
    try {
      const settings = await getOrCreate();
      setNeedsOnboarding(!settings.nomeVisualizzato);
      setInactivityTimeoutState(
        settings.preferences.session_timeout_minutes ?? 5,
      );
      setPrivatePinHashCache(settings.pinPrivatoHash ?? null);
      setUserSettings(settings);
    } catch {
      setNeedsOnboarding(false);
      setInactivityTimeoutState(5);
      setPrivatePinHashCache(null);
      setUserSettings(null);
    }
  }, []);

  const syncPinSecurityState = useCallback(
    (next: {
      hash: string | null;
      salt: string | null;
      encryptedMasterKey: string | null;
    }) => {
      setPrivatePinHashCache(next.hash);
      setUserSettings(prev =>
        prev
          ? {
              ...prev,
              pinPrivatoHash: next.hash,
              pinKdfSalt: next.salt,
              pinMasterKeyEncrypted: next.encryptedMasterKey,
            }
          : prev,
      );
    },
    [],
  );

  const performSignOut = useCallback(
    async (scope: 'local' | 'global' = 'local') => {
      if (user?.id) {
        await storageCleanupService.cleanupOnLogout(user.id);
        invalidateCache(user.id);
      }
      const { error } = await supabase.auth.signOut(
        scope === 'global' ? { scope: 'global' } : undefined,
      );
      if (error) throw error;
      setIsPrivateUnlocked(false);
      setShowPrivatePinDialog(false);
    },
    [user?.id],
  );

  const getPinSecurityMaterial = useCallback(() => {
    const pinPrivatoHash = privatePinHashCache ?? null;
    const pinKdfSalt = userSettings?.pinKdfSalt ?? null;
    const pinMasterKeyEncrypted = userSettings?.pinMasterKeyEncrypted ?? null;

    if (!pinPrivatoHash || !pinKdfSalt || !pinMasterKeyEncrypted) {
      throw new Error(t('pin_non_configurato'));
    }

    return {
      pinPrivatoHash,
      pinKdfSalt,
      pinMasterKeyEncrypted,
    };
  }, [
    privatePinHashCache,
    userSettings?.pinKdfSalt,
    userSettings?.pinMasterKeyEncrypted,
  ]);

  const signOut = useCallback(async () => {
    await performSignOut('local');
  }, [performSignOut]);

  const { resetTimer, showWarning } = useInactivityTimer({
    timeoutMinutes: isAuthenticated ? inactivityTimeoutState : 0,
    onTimeout: () => {
      void signOut();
    },
  });

  useEffect(() => {
    let active = true;

    void supabase.auth
      .getSession()
      .then(async ({ data: { session: currentSession } }) => {
        if (!active) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsAuthenticated(!!currentSession);

        if (currentSession) {
          await loadUserSettings();
        }

        setIsAuthReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsAuthenticated(!!currentSession);
      setIsAuthReady(true);

      if (currentSession) {
        if (event === 'SIGNED_IN') {
          void storageCleanupService
            .cleanupRecentOrphans(currentSession.user.id)
            .catch(() => undefined);
        }
        void loadUserSettings();
      } else {
        setIsPrivateUnlocked(false);
        setNeedsOnboarding(false);
        setPrivatePinHashCache(undefined);
        setUserSettings(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadUserSettings]);

  useEffect(() => {
    let active = true;

    void AccessibilityInfo.isScreenReaderEnabled().then(enabled => {
      if (active) {
        setIsScreenReaderActive(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      enabled => {
        setIsScreenReaderActive(enabled);
      },
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!email) return;

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('email') && message.includes('not')) {
        return;
      }
      throw error;
    }
  }, []);

  const setInactivityTimeout = useCallback(
    async (minutes: number) => {
      setInactivityTimeoutState(minutes);
      await updatePreference('session_timeout_minutes', minutes);
      resetTimer();
    },
    [resetTimer],
  );

  const isPrivateEnabled = Boolean(
    privatePinHashCache &&
      userSettings?.pinKdfSalt &&
      userSettings?.pinMasterKeyEncrypted,
  );

  const unlockPrivate = useCallback(
    async (pin: string) => {
      if (!isPrivateEnabled || !privatePinHashCache) {
        soundSystem.play('pin-error');
        hapticSystem.pinError();
        announce(auth.pinNotConfigured());
        if (!isScreenReaderActive) {
          sonnerNotify.error(t('pin_non_configurato'));
        }
        throw new Error(t('pin_non_configurato'));
      }

      const isValid = await verifyPin(pin, privatePinHashCache);
      if (!isValid) {
        soundSystem.play('pin-error');
        hapticSystem.pinError();
        announce(auth.pinInvalid());
        if (!isScreenReaderActive) {
          sonnerNotify.error(t('pin_non_valido'));
        }
        throw new Error(t('pin_non_valido'));
      }

      setIsPrivateUnlocked(true);
      setShowPrivatePinDialog(false);
      soundSystem.play('private-unlock');
      hapticSystem.privateUnlock();
      announce(auth.privateUnlocked());
      if (!isScreenReaderActive) {
        sonnerNotify.success(t('conto_privato_sbloccato'));
      }
    },
    [isPrivateEnabled, isScreenReaderActive, privatePinHashCache],
  );

  const lockPrivate = useCallback(() => {
    setIsPrivateUnlocked(false);
    announce(auth.privateAccountLocked());
  }, []);

  const setPin = useCallback(
    async (pin: string) => {
      if (isPrivateEnabled) {
        throw new Error(t('pin_gia_configurato'));
      }

      const pinSalt = generatePinSalt();
      const encodedSalt = encodeBase64(pinSalt);
      const masterKey = generateMasterKey();
      const hash = await hashPin(pin);
      const encryptedMasterKey = serializeWrappedMasterKeyPayload(
        wrapMasterKeyWithPin(masterKey, pin, pinSalt),
      );

      await updatePinSecurityMaterial({
        hash,
        salt: encodedSalt,
        encryptedMasterKey,
      });
      syncPinSecurityState({
        hash,
        salt: encodedSalt,
        encryptedMasterKey,
      });
      setIsPrivateUnlocked(true);
      soundSystem.play('private-unlock');
      hapticSystem.privateUnlock();
      announce(auth.pinSet());
      if (!isScreenReaderActive) {
        sonnerNotify.success(t('pin_configurato'));
      }
    },
    [isPrivateEnabled, isScreenReaderActive, syncPinSecurityState],
  );

  const changePin = useCallback(
    async (oldPin: string, newPin: string) => {
      const material = getPinSecurityMaterial();

      const isValid = await verifyPin(oldPin, material.pinPrivatoHash);
      if (!isValid) {
        soundSystem.play('pin-error');
        hapticSystem.pinError();
        throw new Error(t('pin_non_valido'));
      }

      const oldSalt = decodeBase64(material.pinKdfSalt);
      const newSalt = generatePinSalt();
      const encodedNewSalt = encodeBase64(newSalt);
      let rewrappedMasterKey: string;
      try {
        rewrappedMasterKey = rewrapMasterKeyWithPin(
          material.pinMasterKeyEncrypted,
          oldPin,
          oldSalt,
          newPin,
          newSalt,
        );
      } catch (error) {
        if (error instanceof WrappedMasterKeyPayloadError) {
          throw new Error(t('errore_generico'));
        }
        throw error;
      }

      const newHash = await hashPin(newPin);

      await updatePinSecurityMaterial({
        hash: newHash,
        salt: encodedNewSalt,
        encryptedMasterKey: rewrappedMasterKey,
      });
      syncPinSecurityState({
        hash: newHash,
        salt: encodedNewSalt,
        encryptedMasterKey: rewrappedMasterKey,
      });
      soundSystem.play('private-unlock');
      hapticSystem.privateUnlock();
      announce(auth.pinChanged());
      if (!isScreenReaderActive) {
        sonnerNotify.success(t('pin_modificato'));
      }
    },
    [getPinSecurityMaterial, isScreenReaderActive, syncPinSecurityState],
  );

  const removePin = useCallback(
    async (pin: string) => {
      const material = getPinSecurityMaterial();

      const isValid = await verifyPin(pin, material.pinPrivatoHash);
      if (!isValid) {
        soundSystem.play('pin-error');
        hapticSystem.pinError();
        throw new Error(t('pin_non_valido'));
      }

      await updatePinSecurityMaterial({
        hash: null,
        salt: null,
        encryptedMasterKey: null,
      });
      syncPinSecurityState({
        hash: null,
        salt: null,
        encryptedMasterKey: null,
      });
      setIsPrivateUnlocked(false);
      soundSystem.play('dialog-close');
      announce(auth.pinRemoved());
      if (!isScreenReaderActive) {
        sonnerNotify.success(t('pin_rimosso'));
      }
      await performSignOut('global');
    },
    [
      getPinSecurityMaterial,
      isScreenReaderActive,
      performSignOut,
      syncPinSecurityState,
    ],
  );

  const completeOnboarding = useCallback(() => {
    setNeedsOnboarding(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      isAuthReady,
      isAuthenticated,
      needsOnboarding,
      completeOnboarding,
      inactivityTimeout: inactivityTimeoutState,
      userSettings,
      signIn,
      signUp,
      signOut,
      resetPassword,
      isPrivateEnabled,
      isPrivateUnlocked,
      setIsPrivateUnlocked,
      showPrivatePinDialog,
      setShowPrivatePinDialog,
      setInactivityTimeout,
      unlockPrivate,
      lockPrivate,
      setPin,
      changePin,
      removePin,
    }),
    [
      changePin,
      completeOnboarding,
      inactivityTimeoutState,
      isAuthReady,
      isAuthenticated,
      isPrivateEnabled,
      isPrivateUnlocked,
      lockPrivate,
      needsOnboarding,
      removePin,
      resetPassword,
      session,
      setPin,
      setInactivityTimeout,
      showPrivatePinDialog,
      signIn,
      signOut,
      signUp,
      unlockPrivate,
      user,
      userSettings,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {isAuthenticated ? (
        <ActivityDetectorView onActivity={resetTimer}>
          {children}
        </ActivityDetectorView>
      ) : (
        children
      )}
      {showWarning && isAuthenticated ? (
        <View
          accessibilityRole="alert"
          accessibilityLabel={t('sessione_scadenza_avviso')}
        >
          <Text>{t('sessione_scadenza_testo')}</Text>
          <View>
            <Button
              variant="outline"
              onPress={() => {
                resetTimer();
                announce(auth.sessionKept());
              }}
            >
              {t('sessione_rimani_connesso')}
            </Button>
            <Button
              variant="destructive"
              onPress={() => {
                void signOut();
              }}
            >
              {t('sessione_esci_ora')}
            </Button>
          </View>
        </View>
      ) : null}
    </AuthContext.Provider>
  );
}
