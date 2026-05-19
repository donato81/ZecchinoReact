---
tipo: coding-plan
riferimento-design: docs/2-projects/003-DESIGN_fix-accessibility-engine_v1.0.0.md
versione: 1.0.0
data-estrazione: 2026-05-19
stato: READY
---

# PLAN 003 — Fix accessibility engine

## 1. Metadata

- **Reference Design:** docs/2-projects/003-DESIGN_fix-accessibility-engine_v1.0.0.md
- **Versione:** 1.0.0
- **Fase TODO-MASTER:** P1 (Fase 1 — Rimpiazza dipendenze DOM in `lib/`) e P2 (Fase 2 — Rimpiazza hook web-only)
- **Data estrazione:** 2026-05-19

---

## 2. Prerequisiti

- `002-DESIGN_fix-provider-bootstrap_v0.2.0.md` completamente implementato e verificato.
- `002-PLAN_fix-provider-bootstrap_v0.2.0.md` tutti i gate superati.
- P0 TODO-MASTER completata (P0.B1, P0.B2, P0.B3, P0.B4 PASSED).

---

## 3. Task atomici

### Task ID: 003.T1

- **File target:** `src/accessibility/types.ts` (CREATE)
- **Azione:** Creare il file con i quattro tipi condivisi tra `engine.ts`, `detection.ts` e il futuro layer `announcements/`: `AnnouncementPriority`, `Announcement`, `TalkBackState`, `TalkBackAdaptations`. Nessuna logica, solo tipi.
- **Snippet / Codice:**

```ts
// src/accessibility/types.ts
// Tipi condivisi tra engine.ts e detection.ts.
// Regola generale: NON importare direttamente da questo file fuori da
// src/accessibility/. Unica eccezione ammessa: src/announcements/types.ts
// può importare Announcement e AnnouncementPriority come `import type`
// — mai codice eseguibile. Vedi DESIGN 003 §3.1 per la motivazione completa.

// ── Tipi del motore di annuncio ────────────────────────────────────────────

/**
* Priorità di un annuncio.
* - 'polite': l'annuncio aspetta che lo screen reader finisca quello che
*   sta leggendo.
* - 'assertive': l'annuncio ha precedenza sul contenuto corrente.
*
* React Native 0.82 non espone nativamente questa distinzione tramite
* AccessibilityInfo.announceForAccessibility. Il campo è mantenuto nella
* struttura Announcement per:
* a) Documentare l'intenzione semantica del chiamante.
* b) Forward compatibility: quando React Native aggiungerà supporto nativo
*    la distinzione è già codificata nell'oggetto.
* c) Permettere agli screen reader che la supportano (Narrator su Windows)
*    di ricevere context aggiuntivo in una futura versione dell'engine.
*/
export type AnnouncementPriority = 'polite' | 'assertive'

/**
* Struttura di un annuncio pronto da pronunciare.
* Prodotta dai moduli src/announcements/, consumata da engine.ts.
* Il testo deve essere già composto e localizzato — engine.ts non esegue
* nessuna trasformazione sul testo.
*/
export interface Announcement {
  text: string
  priority: AnnouncementPriority
}

// ── Tipi del rilevamento piattaforma ──────────────────────────────────────

/**
* Stato corrente del rilevamento screen reader.
*
* CAMBIAMENTO RISPETTO ALLA VERSIONE PRECEDENTE:
* Il valore 'medium' di confidenceLevel è eliminato.
* L'API nativa AccessibilityInfo.isScreenReaderEnabled() fornisce una
* risposta binaria certa — non graduata — quindi:
* - 'high': isScreenReaderEnabled() ha restituito true.
* - 'low': stato iniziale prima che la Promise sia risolta, o nessuno
*   screen reader attivo.
* I consumatori che verificavano confidenceLevel === 'medium' devono
* essere aggiornati.
*/
export interface TalkBackState {
  /** true se lo screen reader è attivo (nativo o override manuale) */
  isEnabled: boolean
  /** true se AccessibilityInfo.isScreenReaderEnabled() ha restituito true */
  isDetected: boolean
  /**
  * 'high' = risposta certa dal sistema operativo (isEnabled è affidabile)
  * 'low' = stato iniziale prima che la Promise sia risolta, oppure
  *         nessuno screen reader attivo
  */
  confidenceLevel: 'high' | 'low'
  /** true se le adattazioni (touch target, timeout, descrizioni) sono attive */
  adaptationsActive: boolean
}

/**
* Adattamenti attivi quando uno screen reader è rilevato.
* Questo tipo è la forma client-side. Una forma compatibile esiste anche
* in src/lib/supabase/types.ts per la persistenza su DB.
* Fonte di verità: questo file. Vedi DESIGN 003 §11 — "Nota critica: migrazione TalkBackAdaptations".
*/
export interface TalkBackAdaptations {
  enhancedTouchTargets: boolean
  simplifiedNavigation: boolean
  extendedTimeouts: boolean
  verboseDescriptions: boolean
  highContrastMode: boolean
  reducedMotion: boolean
  autoFocusManagement: boolean
  // Campo mantenuto per compatibilità con la shape persistita in
  // src/lib/supabase/types.ts e nel database. Non esiste un audio
  // engine che consumi questo flag in questa fase del progetto.
  // Il default in DEFAULT_ADAPTATIONS è `true` per preservare la
  // coerenza con la shape originale persistita — non perché il flag
  // sia attivo funzionalmente. Va rivalutato quando il layer audio
  // verrà implementato.
  spatialAudio: boolean
}
```

- **Success Metric:** `npx tsc --noEmit` senza errori; `grep -E "^export type|^export interface" src/accessibility/types.ts` mostra esattamente 4 voci (`AnnouncementPriority`, `Announcement`, `TalkBackState`, `TalkBackAdaptations`); `grep "medium" src/accessibility/types.ts` restituisce 0 risultati.

---

### Task ID: 003.T2

- **File target:** `src/accessibility/engine.ts` (CREATE)
- **Azione:** Creare il file con la classe `ScreenReaderEngine` e il singleton `engine`. Nessun import da `src/locales/`. Nessuna composizione testo. Nessuna gestione stato. Principio fire-and-forget.
- **Dipende da:** 003.T1 (usa `import type { Announcement } from './types'`)
- **Snippet / Codice:**

```ts
// src/accessibility/engine.ts
import { AccessibilityInfo } from 'react-native'
import type { Announcement } from './types'

class ScreenReaderEngine {
  /**
  * Pronuncia un annuncio già costruito.
  *
  * Natura fire-and-forget:
  * - Il metodo non attende la pronuncia né gestisce callback.
  * - Il fallimento è sempre silenzioso: se lo screen reader non è attivo,
  *   se la piattaforma non supporta la chiamata, o se la coda è piena,
  *   non viene generata nessuna eccezione né attivato nessun fallback.
  * - L'unico gate: se announcement.text.trim() è vuoto, la chiamata
  *   a AccessibilityInfo viene saltata.
  *
  * Sul campo `priority`:
  * React Native 0.82 non espone un parametro priority in
  * announceForAccessibility. Il campo è presente nell'oggetto Announcement
  * per documentazione semantica e forward compatibility — quando RN
  * aggiungerà il supporto nativo la distinzione sarà in questo unico punto.
  *
  * Comportamento per piattaforma (RN 0.82):
  * - Android / TalkBack: pronuncia il testo; TalkBack gestisce la coda
  *   interna. La distinzione polite/assertive non è esposta.
  * - iOS / VoiceOver: pronuncia il testo; VoiceOver gestisce interruzioni
  *   in base alle sue policy interne.
  * - Windows / Narrator: vedere DESIGN 003 §10 — Rischio R1.
  *
  * @param announcement Oggetto Announcement prodotto da src/announcements/
  */
  announce(announcement: Announcement): void {
    if (!announcement.text.trim()) {
      return
    }
    if (typeof AccessibilityInfo.announceForAccessibility !== 'function') {
      // Fallback silenzioso in ambienti che non supportano l'API
      // (es. Jest/Node, versioni RN Windows senza supporto completo).
      // Coerente con il principio fire-and-forget: il fallimento è sempre
      // silenzioso e non genera eccezioni.
      if (__DEV__) {
        console.log('[engine] announceForAccessibility non disponibile:', announcement.text)
      }
      return
    }
    AccessibilityInfo.announceForAccessibility(announcement.text)
  }
}

/**
* Singleton esportato.
* Unico punto dell'app che chiama AccessibilityInfo.announceForAccessibility.
* I moduli src/announcements/ importano questo singleton per pronunciare —
* ma questo avviene nel documento successivo (DESIGN 004), non in questo.
* In questo documento nessun file chiama engine.announce() tranne il
* componente di test temporaneo del Gate 2, che va rimosso prima del commit.
*/
export const engine = new ScreenReaderEngine()
```

- **Nota pre-commit obbligatoria (Gate 2):** Prima del commit, eseguire la verifica manuale Narrator su Windows descritta nel Gate 2 della Sezione 4. Il codice di test temporaneo in `App.tsx` va rimosso prima del commit.
- **Success Metric:** `npx tsc --noEmit` senza errori; `grep -E "document\.|window\.|HTMLDivElement|aria-live|aria-atomic|from 'react'" src/accessibility/engine.ts` restituisce 0 risultati.

---

### Task ID: 003.T3

- **File target:** `src/accessibility/detection.ts` (CREATE)
- **Azione:** Creare il hook `useAccessibilityDetection()` che sostituisce `useTalkBack()`. Usa esclusivamente `AccessibilityInfo` nativo — nessuna API DOM (`window`, `document`, `sessionStorage`, `navigator`, `matchMedia`, `speechSynthesis`). Espone il costante `DEFAULT_ADAPTATIONS`.
- **Dipende da:** 003.T1 (importa da `./types`); verifica preventiva che `talkBackManualOverride`, `talkBackAdaptations`, `setTalkBackAdaptations`, `setTalkBackManualOverride` siano esposti da `useUserSettings()` (vedi `src/context/UserSettingsContext.tsx` e `src/hooks/use-user-settings.ts`).
- **Verifica preventiva:**
  ```bash
  grep -E "talkBackManualOverride|talkBackAdaptations|setTalkBackAdaptations|setTalkBackManualOverride" src/context/UserSettingsContext.tsx src/hooks/use-user-settings.ts
  ```
  Se il grep non restituisce risultati, aggiungere le proprietà mancanti prima di procedere con la creazione di questo file.
- **Snippet / Codice:**

```ts
// src/accessibility/detection.ts
import { useState, useEffect, useCallback } from 'react'
import { AccessibilityInfo } from 'react-native'
import { useUserSettings } from '@/context/UserSettingsContext'
import type { TalkBackState, TalkBackAdaptations } from './types'

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
}

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
  } = useUserSettings()

  const [talkBackState, setTalkBackState] = useState<TalkBackState>({
    isEnabled: false,
    isDetected: false,
    confidenceLevel: 'low',
    adaptationsActive: false,
  })

  const adaptations = talkBackAdaptations ?? DEFAULT_ADAPTATIONS
  const manualOverride = talkBackManualOverride

  useEffect(() => {
    let isMounted = true

    // Lettura asincrona dello stato iniziale dallo screen reader nativo.
    // Finestra di incertezza accettata: al primo mount esiste un brevissimo
    // istante (<100ms tipicamente) in cui isEnabled è false anche se lo
    // screen reader è attivo. Il listener screenReaderChanged corregge lo
    // stato quando la risposta arriva. Non va compensata con meccanismi
    // di pre-idratazione o valori iniziali ottimistici.
    void AccessibilityInfo.isScreenReaderEnabled().then((nativeEnabled) => {
      if (!isMounted) return
      const isEnabled = manualOverride !== null ? Boolean(manualOverride) : nativeEnabled
      setTalkBackState({
        isEnabled,
        isDetected: nativeEnabled,
        // L'API nativa fornisce una risposta binaria certa:
        // 'high' se lo screen reader è attivo, 'low' altrimenti.
        confidenceLevel: nativeEnabled ? 'high' : 'low',
        adaptationsActive: isEnabled,
      })
    })

    // Listener reattivo: risponde ai cambiamenti durante la sessione
    // senza riavvio dell'app.
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (nativeEnabled: boolean) => {
        if (!isMounted) return
        const isEnabled = manualOverride !== null ? Boolean(manualOverride) : nativeEnabled
        setTalkBackState({
          isEnabled,
          isDetected: nativeEnabled,
          confidenceLevel: nativeEnabled ? 'high' : 'low',
          adaptationsActive: isEnabled,
        })
      }
    )

    return () => {
      isMounted = false
      // Verifica difensiva: subscription.remove potrebbe non essere una
      // funzione su versioni di react-native-windows precedenti a RN 0.65.
      // Coerente con il Rischio R2 di DESIGN 003 §10.
      if (typeof subscription.remove === 'function') {
        subscription.remove()
      }
    }
  }, [manualOverride])

  // ── Controllo manuale ───────────────────────────────────────────────────

  // ATTENZIONE al naming: enableTalkBack e disableTalkBack NON abilitano
  // né disabilitano lo screen reader del sistema operativo.
  // Modificano esclusivamente l'override locale React e lo stato delle
  // adattazioni. Il nome è mantenuto perché semanticamente descrittivo
  // per i futuri consumatori che arriveranno nel documento successivo —
  // cambiarlo richiederebbe aggiornare l'API pubblica del hook.
  const enableTalkBack = useCallback((manual: boolean = false) => {
    if (manual) {
      setTalkBackManualOverride(true).catch(console.error)
    }
    setTalkBackState(prev => ({ ...prev, isEnabled: true, adaptationsActive: true }))
  }, [setTalkBackManualOverride])

  const disableTalkBack = useCallback((manual: boolean = false) => {
    if (manual) {
      setTalkBackManualOverride(false).catch(console.error)
    }
    setTalkBackState(prev => ({ ...prev, isEnabled: false, adaptationsActive: false }))
  }, [setTalkBackManualOverride])

  /**
  * Nuovo comportamento di resetDetection (DIVERSO dall'originale):
  * 1. Cancella l'override manuale chiamando setTalkBackManualOverride(null).
  * 2. Rilegge lo stato reale dallo screen reader nativo tramite
  *    AccessibilityInfo.isScreenReaderEnabled().
  * 3. Aggiorna lo stato con la risposta nativa.
  *
  * NON chiama detectTalkBack() — quella funzione non esiste più.
  * NON resetta semplicemente le adattazioni come nel file originale.
  */
  const resetDetection = useCallback(async () => {
    await setTalkBackManualOverride(null)
    const nativeEnabled = await AccessibilityInfo.isScreenReaderEnabled()
    setTalkBackState({
      isEnabled: nativeEnabled,
      isDetected: nativeEnabled,
      confidenceLevel: nativeEnabled ? 'high' : 'low',
      adaptationsActive: nativeEnabled,
    })
  }, [setTalkBackManualOverride])

  // ── Gestione adattamenti ────────────────────────────────────────────────

  const updateAdaptation = useCallback(
    (key: keyof TalkBackAdaptations, value: boolean) => {
      setTalkBackAdaptations({ ...adaptations, [key]: value }).catch(console.error)
    },
    [adaptations, setTalkBackAdaptations]
  )

  const resetAdaptations = useCallback(() => {
    setTalkBackAdaptations(DEFAULT_ADAPTATIONS).catch(console.error)
  }, [setTalkBackAdaptations])

  // ── Funzioni utilitarie (logica invariata, sorgente dati aggiornata) ───

  const getTouchTargetSize = useCallback(() => {
    if (!talkBackState.adaptationsActive || !adaptations.enhancedTouchTargets) return 44
    return 56
  }, [talkBackState.adaptationsActive, adaptations])

  const getAnimationDuration = useCallback(
    (baseMs: number) => {
      if (!talkBackState.adaptationsActive || !adaptations.reducedMotion) return baseMs
      return Math.min(baseMs * 0.5, 100)
    },
    [talkBackState.adaptationsActive, adaptations]
  )

  const getTimeout = useCallback(
    (baseMs: number) => {
      if (!talkBackState.adaptationsActive || !adaptations.extendedTimeouts) return baseMs
      return baseMs * 2
    },
    [talkBackState.adaptationsActive, adaptations]
  )

  const shouldUseVerboseDescriptions = useCallback(() => {
    return talkBackState.adaptationsActive && (adaptations.verboseDescriptions ?? true)
  }, [talkBackState.adaptationsActive, adaptations])

  const shouldSimplifyNavigation = useCallback(() => {
    return talkBackState.adaptationsActive && (adaptations.simplifiedNavigation ?? true)
  }, [talkBackState.adaptationsActive, adaptations])

  const shouldAutoManageFocus = useCallback(() => {
    return talkBackState.adaptationsActive && (adaptations.autoFocusManagement ?? true)
  }, [talkBackState.adaptationsActive, adaptations])

  const getAriaDescription = useCallback(
    (brief: string, verbose: string) => {
      return shouldUseVerboseDescriptions() ? verbose : brief
    },
    [shouldUseVerboseDescriptions]
  )

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
  }
}
```

- **Success Metric:** `npx tsc --noEmit` senza errori; `grep -E "window\.matchMedia|sessionStorage|speechSynthesis|navigator\.maxTouchPoints|navigator\.userAgent|document\.body|recheckInterval|detectTalkBack|'medium'" src/accessibility/detection.ts` restituisce 0 risultati; `grep "useTalkBack" src/accessibility/detection.ts` restituisce 0 risultati; `grep "from.*engine" src/accessibility/detection.ts` restituisce 0 risultati.

---

### Task ID: 003.T4

- **File target:** `src/locales/it.ts` (CREATE)
- **Azione:** Creare il file con l'oggetto `it` vuoto e i tipi `Strings` e `StringKey`. Le stringhe di dominio verranno aggiunte nel PLAN 004. Nessun import esterno.
- **Snippet / Codice:**

```ts
// src/locales/it.ts
//
// Infrastruttura del sistema di localizzazione — passo 3 (accessibility engine).
//
// In questo passo il file definisce i tipi Strings e StringKey e l'oggetto it,
// inizialmente vuoto. Le stringhe di dominio (auth, conti, movimenti, budget,
// obiettivi, export, template, form, toggle, card, audio, periodo, help)
// vengono aggiunte nel documento di design successivo dedicato a
// src/announcements/ quando ogni modulo dichiarerà le proprie chiavi.
//
// Regola di import invariante:
// NON importare questo file direttamente.
// Tutti i file dell'app importano SOLO da src/locales/index.ts.

export const it = {
  // Stringhe verranno aggiunte dal documento successivo (announcements/).
  // Formato entry: chiave_area_evento: 'Testo in italiano con {placeholder}',
  //
  // Esempio (non aggiungere qui — documento successivo):
  //   navigazione_schermata: 'Navigazione a {schermata}',
  //   errore_generico: 'Si è verificato un errore.',
} as const

export type Strings = typeof it
export type StringKey = keyof Strings
```

- **Success Metric:** `npx tsc --noEmit` senza errori; `grep -r "from.*locales/it" src/ --include="*.ts" --include="*.tsx"` restituisce 0 risultati (nessun import diretto da `it.ts`). In questa fase `StringKey` è `never` — comportamento atteso e corretto.

---

### Task ID: 003.T5

- **File target:** `src/locales/index.ts` (CREATE)
- **Azione:** Creare il punto di accesso unico per le stringhe localizzate. Lingua fissa italiano (il selettore dinamico verrà aggiunto nel passo 4 di un documento futuro).
- **Dipende da:** 003.T4
- **Snippet / Codice:**

```ts
// src/locales/index.ts
//
// Punto di accesso unico per le stringhe localizzate.
// TUTTI i file dell'app importano SOLO da questo modulo, mai da it.ts.
//
// Passo 3: lingua fissa italiano.
// Passo 4: la costante `strings` verrà sostituita con una funzione che
//          legge la lingua attiva da UserSettingsContext e seleziona
//          il dizionario corrispondente.
//
// Pattern di import corretto in tutti i file consumatori:
//   import { strings } from '@/locales/index'
//   import type { StringKey } from '@/locales/index'

import { it } from './it'
import type { Strings, StringKey } from './it'

const strings: Strings = it

export { strings }
export type { Strings, StringKey }
```

- **Success Metric:** `npx tsc --noEmit` senza errori; `grep -E "^export" src/locales/index.ts` mostra `export { strings }` e `export type { Strings, StringKey }`.

---

### Task ID: 003.T6

- **File target:** `src/context/AuthContext.tsx` e qualsiasi altro file rilevato dal grep (PATCH — solo import e chiamata hook)
- **Azione:** Aggiornare i consumatori di `useTalkBack` sostituendo l'import e il nome del hook. Eseguire prima il grep di verifica per identificare tutti i file da aggiornare.
- **Grep di verifica pre-patch:**
  ```bash
  grep -rn "from.*use-talkback\|useTalkBack" src/ --include="*.ts" --include="*.tsx"
  ```
- **Sostituzioni da applicare in ogni file trovato:**

  | Import attuale | Import aggiornato |
  |---|---|
  | `import { useTalkBack } from '@/hooks/use-talkback'` | `import { useAccessibilityDetection } from '@/accessibility/detection'` |
  | `useTalkBack(` | `useAccessibilityDetection(` |

- **Success Metric:** Il grep di verifica post-patch restituisce 0 risultati:
  ```bash
  grep -r "from.*use-talkback\|useTalkBack" src/ --include="*.ts" --include="*.tsx"
  # deve restituire 0 risultati
  ```

---

### Task ID: 003.T7

- **File target:** `src/hooks/use-talkback.ts` (DELETE)
- **Azione:** Eliminare il file dopo aver verificato che nessun consumatore lo importa più (003.T6 completato).
- **Dipende da:** 003.T6
- **Sequenza operativa:**
  1. Eseguire il grep di verifica:
     ```bash
     grep -r "from.*use-talkback\|useTalkBack" src/ --include="*.ts" --include="*.tsx"
     # deve restituire 0 risultati prima di procedere
     ```
  2. Se il grep restituisce 0 risultati: procedere con la deletion.
  3. Se il grep restituisce risultati: completare 003.T6 per quei file prima di procedere.
- **Success Metric:**
  ```bash
  test ! -f src/hooks/use-talkback.ts && echo "OK" || echo "ERRORE: file ancora presente"
  grep -r "from.*use-talkback\|useTalkBack" src/
  # entrambi devono restituire esito positivo/0 risultati
  ```

---

### Task ID: 003.T8

- **File target:** `src/hooks/use-screen-reader.ts` (VERIFICA — non eliminare)
- **Azione:** Eseguire il grep di verifica per documentare i consumatori esistenti. **NON eliminare il file** — la deletion è differita al gate finale del PLAN 004 dopo la migrazione dei context.
- **Grep di verifica:**
  ```bash
  grep -rn "from.*use-screen-reader\|useScreenReader\|useAnnouncePage" src/ --include="*.ts" --include="*.tsx"
  ```
- **Esito atteso:** Il grep restituisce risultati in `AuthContext.tsx` e `AppDataContext.tsx` — questo è **atteso e corretto** in questa fase. Non procedere con la deletion.
- **Azione da documentare:** Annotare i file trovati dal grep nel commit message o in un commento TODO per il PLAN 004.
- **Success Metric:** Il grep è stato eseguito e i risultati documentati. Il file `use-screen-reader.ts` è **ancora presente** (non eliminato).

---

## 4. Gate di validazione

### Gate 1 — `accessibility/types.ts` creato (post-003.T1)

```bash
npx tsc --noEmit
```
Nessun errore.

```bash
grep -E "^export type|^export interface" src/accessibility/types.ts
```
Deve mostrare 4 voci: `AnnouncementPriority`, `Announcement`, `TalkBackState`, `TalkBackAdaptations`.

```bash
grep "medium" src/accessibility/types.ts
# Deve restituire 0 risultati
```

---

### Gate 2 — `accessibility/engine.ts` creato (post-003.T2)

```bash
npx tsc --noEmit
```
Nessun errore.

```bash
grep -E "document\.|window\.|HTMLDivElement|aria-live|aria-atomic|from 'react'" src/accessibility/engine.ts
# Deve restituire 0 risultati
```

**Verifica funzionale manuale (con screen reader attivo) — obbligatoria prima del commit:**

Aggiungere temporaneamente in `App.tsx`:
```ts
import { engine } from '@/accessibility/engine'
engine.announce({ text: 'Test engine ZecchinoReact', priority: 'polite' })
```
Eseguire l'app. Criterio di successo: Narrator deve pronunciare per intero
"Test engine ZecchinoReact" entro 3 secondi dal mount. Se Narrator non pronuncia,
il Rischio R1 di DESIGN 003 §10 si è materializzato — aggiungere guard
`Platform.OS !== 'windows'` e aprire issue su `react-native-windows`.

**Verificare anche su Android con TalkBack attivo.**

Rimuovere il codice temporaneo di test prima del commit.

---

### Gate 3 — `accessibility/detection.ts` creato (post-003.T3)

```bash
npx tsc --noEmit
```
Nessun errore.

```bash
grep -E "window\.matchMedia|sessionStorage|speechSynthesis|navigator\.maxTouchPoints|navigator\.userAgent|document\.body|recheckInterval|detectTalkBack|'medium'" src/accessibility/detection.ts
# Deve restituire 0 risultati
```

```bash
grep "useTalkBack" src/accessibility/detection.ts
# Deve restituire 0 risultati
```

```bash
grep "from.*engine" src/accessibility/detection.ts
# Deve restituire 0 risultati — invariante ADR_001
```

**Verifica funzionale manuale:** con screen reader attivo, montare un componente
che usa `useAccessibilityDetection()` e verificare che:
- `talkBackState.isEnabled === true`
- `talkBackState.isDetected === true`
- `talkBackState.confidenceLevel === 'high'`
- `talkBackState.adaptationsActive === true`
- `getTouchTargetSize()` restituisce `56`

---

### Gate 4 — `locales/it.ts` e `locales/index.ts` creati (post-003.T4 + 003.T5)

```bash
npx tsc --noEmit
```
Nessun errore.

```bash
grep -r "from.*locales/it" src/ --include="*.ts" --include="*.tsx"
# Deve restituire 0 risultati — nessun import diretto da it.ts
```

```bash
grep -E "^export" src/locales/index.ts
# Deve mostrare: export { strings }, export type { Strings, StringKey }
```

---

### Gate 5 — `use-talkback.ts` eliminato (post-003.T7)

```bash
test ! -f src/hooks/use-talkback.ts && echo "OK" || echo "ERRORE: file ancora presente"
```

```bash
grep -r "from.*use-talkback\|useTalkBack" src/ --include="*.ts" --include="*.tsx"
# Deve restituire 0 risultati
```

---

### Gate 6 — `use-screen-reader.ts` verificato (post-003.T8)

```bash
grep -rn "from.*use-screen-reader\|useScreenReader\|useAnnouncePage" src/ --include="*.ts" --include="*.tsx"
# Atteso: risultati in AuthContext.tsx e AppDataContext.tsx
# NON eliminare il file — documenta i risultati
```

---

### Gate finale — build pulita

```bash
npx tsc --noEmit
# Zero errori TypeScript su tutto il progetto
```

```bash
npm run lint
# Zero warning sui file creati o modificati
```

---

## 5. Sequenza commit raccomandata

```
commit 1: feat(accessibility): aggiungi accessibility/types.ts
  - src/accessibility/types.ts (CREATE)
  - GATE 1

commit 2: feat(accessibility): aggiungi accessibility/engine.ts
  - src/accessibility/engine.ts (CREATE)
  - GATE 2: eseguire DOPO la creazione del file e PRIMA di fare il commit.
    Sequenza obbligatoria: 1) crea il file, 2) esegui la verifica manuale
    Narrator su Windows, 3) solo se la verifica passa, esegui il commit.

commit 3: feat(accessibility): aggiungi accessibility/detection.ts
  - src/accessibility/detection.ts (CREATE)
  - GATE 3

commit 4: feat(locales): aggiungi infrastruttura locales
  - src/locales/it.ts (CREATE)
  - src/locales/index.ts (CREATE)
  - GATE 4

commit 5: refactor(accessibility): aggiorna import useTalkBack → useAccessibilityDetection
  - src/context/AuthContext.tsx (PATCH — solo import e chiamata)
  - [altri file trovati dal grep di 003.T6]

commit 6: chore(accessibility): elimina use-talkback.ts
  - src/hooks/use-talkback.ts (DELETE)
  - GATE 5

commit 7: chore(accessibility): verifica consumatori use-screen-reader.ts
  - Solo grep di verifica (003.T8) — nessuna modifica
  - GATE 6
  - NOTA: use-screen-reader.ts NON viene eliminato qui
  - La deletion è differita al gate finale del PLAN 004

commit 8: DIFFERITO al PLAN 004 — elimina screen-reader.ts e use-screen-reader.ts
```
