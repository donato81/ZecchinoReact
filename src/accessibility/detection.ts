// src/accessibility/detection.ts
import { useState, useEffect, useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useUserSettings } from '@/context/UserSettingsContext';
import type { TalkBackState, TalkBackAdaptations } from './types';

/**
 * Adattamenti di default applicati quando lo screen reader è rilevato.
 * Valori ottimizzati per massima accessibilità al primo mount.
 * L'utente può sovrascrivere i singoli valori tramite updateAdaptation()
 * e le modifiche vengono persistite in UserSettings (Supabase).
 */
export const DEFAULT_ADAPTATIONS: TalkBackAdaptations = {
  enhancedTouchTargets: true,
  simplifiedNavigation: true,
  extendedTimeouts: true,
  verboseDescriptions: true,
  highContrastMode: false,
  reducedMotion: true,
  autoFocusManagement: true,
  spatialAudio: true,
};

/**
 * Hook per il rilevamento dello screen reader e il calcolo delle adattazioni.
 *
 * Sostituisce src/hooks/use-talkback.ts.
 * Import da aggiornare: `from '@/hooks/use-talkback'` → `from '@/accessibility/detection'`
 * Funzione da rinominare: `useTalkBack()` → `useAccessibilityDetection()`
 *
 * NON usa: window, document, navigator, sessionStorage, matchMedia,
 * speechSynthesis, userAgent, maxTouchPoints, addEventListener DOM.
 * Usa SOLO: AccessibilityInfo.isScreenReaderEnabled() e
 *           AccessibilityInfo.addEventListener('screenReaderChanged', ...).
 */
export function useAccessibilityDetection() {
  const {
    talkBackAdaptations,
    talkBackManualOverride,
    setTalkBackAdaptations,
    setTalkBackManualOverride,
  } = useUserSettings();

  const [talkBackState, setTalkBackState] = useState<TalkBackState>({
    isEnabled: false,
    isDetected: false,
    confidenceLevel: 'low',
    adaptationsActive: false,
  });

  const adaptations = talkBackAdaptations ?? DEFAULT_ADAPTATIONS;
  const manualOverride = talkBackManualOverride;

  useEffect(() => {
    let isMounted = true;

    // Lettura asincrona dello stato iniziale dallo screen reader nativo.
    // Finestra di incertezza accettata: al primo mount esiste un brevissimo
    // istante (<100ms tipicamente) in cui isEnabled è false anche se lo
    // screen reader è attivo. Il listener screenReaderChanged corregge lo
    // stato quando la risposta arriva. Non va compensata con meccanismi
    // di pre-idratazione o valori iniziali ottimistici.
    void AccessibilityInfo.isScreenReaderEnabled().then(nativeEnabled => {
      if (!isMounted) return;
      const isEnabled =
        manualOverride !== null ? Boolean(manualOverride) : nativeEnabled;
      setTalkBackState({
        isEnabled,
        isDetected: nativeEnabled,
        // L'API nativa fornisce una risposta binaria certa:
        // 'high' se lo screen reader è attivo, 'low' altrimenti.
        confidenceLevel: nativeEnabled ? 'high' : 'low',
        adaptationsActive: isEnabled,
      });
    });

    // Listener reattivo: risponde ai cambiamenti durante la sessione
    // senza riavvio dell'app.
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (nativeEnabled: boolean) => {
        if (!isMounted) return;
        const isEnabled =
          manualOverride !== null ? Boolean(manualOverride) : nativeEnabled;
        setTalkBackState({
          isEnabled,
          isDetected: nativeEnabled,
          confidenceLevel: nativeEnabled ? 'high' : 'low',
          adaptationsActive: isEnabled,
        });
      },
    );

    return () => {
      isMounted = false;
      // Verifica difensiva: subscription.remove potrebbe non essere una
      // funzione su versioni di react-native-windows precedenti a RN 0.65.
      // Coerente con il Rischio R2 di DESIGN 003 §10.
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, [manualOverride]);

  // ── Controllo manuale ───────────────────────────────────────────────────

  // ATTENZIONE al naming: enableTalkBack e disableTalkBack NON abilitano
  // né disabilitano lo screen reader del sistema operativo.
  // Modificano esclusivamente l'override locale React e lo stato delle
  // adattazioni. Il nome è mantenuto perché semanticamente descrittivo
  // per i futuri consumatori che arriveranno nel documento successivo —
  // cambiarlo richiederebbe aggiornare l'API pubblica del hook.
  const enableTalkBack = useCallback(
    (manual: boolean = false) => {
      if (manual) {
        setTalkBackManualOverride(true).catch(console.error);
      }
      setTalkBackState(prev => ({
        ...prev,
        isEnabled: true,
        adaptationsActive: true,
      }));
    },
    [setTalkBackManualOverride],
  );

  const disableTalkBack = useCallback(
    (manual: boolean = false) => {
      if (manual) {
        setTalkBackManualOverride(false).catch(console.error);
      }
      setTalkBackState(prev => ({
        ...prev,
        isEnabled: false,
        adaptationsActive: false,
      }));
    },
    [setTalkBackManualOverride],
  );

  /**
   * Cancella l'override manuale e rilegge lo stato reale dallo screen reader
   * nativo tramite AccessibilityInfo.isScreenReaderEnabled().
   *
   * DIVERSO dall'originale use-talkback.ts:
   * - NON chiama detectTalkBack() — quella funzione non esiste più.
   * - NON resetta semplicemente le adattazioni come nel file originale.
   * - Chiama setTalkBackManualOverride(null) per cancellare l'override.
   * - Rilegge il valore nativo e aggiorna lo stato.
   */
  const resetDetection = useCallback(async () => {
    await setTalkBackManualOverride(null);
    const nativeEnabled = await AccessibilityInfo.isScreenReaderEnabled();
    setTalkBackState({
      isEnabled: nativeEnabled,
      isDetected: nativeEnabled,
      confidenceLevel: nativeEnabled ? 'high' : 'low',
      adaptationsActive: nativeEnabled,
    });
  }, [setTalkBackManualOverride]);

  // ── Gestione adattamenti ────────────────────────────────────────────────

  const updateAdaptation = useCallback(
    (key: keyof TalkBackAdaptations, value: boolean) => {
      setTalkBackAdaptations({ ...adaptations, [key]: value }).catch(
        console.error,
      );
    },
    [adaptations, setTalkBackAdaptations],
  );

  const resetAdaptations = useCallback(() => {
    setTalkBackAdaptations(DEFAULT_ADAPTATIONS).catch(console.error);
  }, [setTalkBackAdaptations]);

  // ── Funzioni utilitarie (logica invariata, sorgente dati aggiornata) ───

  const getTouchTargetSize = useCallback(() => {
    if (!talkBackState.adaptationsActive || !adaptations.enhancedTouchTargets)
      return 44;
    return 56;
  }, [talkBackState.adaptationsActive, adaptations]);

  const getAnimationDuration = useCallback(
    (baseMs: number) => {
      if (!talkBackState.adaptationsActive || !adaptations.reducedMotion)
        return baseMs;
      return Math.min(baseMs * 0.5, 100);
    },
    [talkBackState.adaptationsActive, adaptations],
  );

  const getTimeout = useCallback(
    (baseMs: number) => {
      if (!talkBackState.adaptationsActive || !adaptations.extendedTimeouts)
        return baseMs;
      return baseMs * 2;
    },
    [talkBackState.adaptationsActive, adaptations],
  );

  const shouldUseVerboseDescriptions = useCallback(() => {
    return (
      talkBackState.adaptationsActive &&
      (adaptations.verboseDescriptions ?? true)
    );
  }, [talkBackState.adaptationsActive, adaptations]);

  const shouldSimplifyNavigation = useCallback(() => {
    return (
      talkBackState.adaptationsActive &&
      (adaptations.simplifiedNavigation ?? true)
    );
  }, [talkBackState.adaptationsActive, adaptations]);

  const shouldAutoManageFocus = useCallback(() => {
    return (
      talkBackState.adaptationsActive &&
      (adaptations.autoFocusManagement ?? true)
    );
  }, [talkBackState.adaptationsActive, adaptations]);

  const getAriaDescription = useCallback(
    (brief: string, verbose: string) => {
      return shouldUseVerboseDescriptions() ? verbose : brief;
    },
    [shouldUseVerboseDescriptions],
  );

  // ── Return ───────────────────────────────────────────────────────────────

  return {
    talkBackState,
    adaptations,
    enableTalkBack,
    disableTalkBack,
    resetDetection,
    updateAdaptation,
    resetAdaptations,
    getTouchTargetSize,
    getAnimationDuration,
    getTimeout,
    shouldUseVerboseDescriptions,
    shouldSimplifyNavigation,
    shouldAutoManageFocus,
    getAriaDescription,
  };
}
