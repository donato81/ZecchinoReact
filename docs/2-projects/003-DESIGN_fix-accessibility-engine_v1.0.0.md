---
tipo: design
titolo: "Fix accessibility engine — layer src/accessibility/ e locales minimale"
versione: 1.0.0
data: 2026-05-18
stato: REVIEWED
sorgente: docs/0-architecture/ADR_001_sistema-annunci-accessibili.md
perimetro: >
  src/accessibility/types.ts (CREATE),
  src/accessibility/engine.ts (CREATE),
  src/accessibility/detection.ts (CREATE),
  src/locales/it.ts (CREATE — stringhe motore only),
  src/locales/index.ts (CREATE),
  src/lib/screen-reader.ts (DELETE DIFFERITO — vedi Sezione 7.3),
  src/hooks/use-screen-reader.ts (DELETE DIFFERITO — vedi Sezione 7.2 e DESIGN 004),
  src/hooks/use-talkback.ts (DELETE — vedi Sezione 7)
nota-ordine: >
  L'ordine dei file in questo elenco non è l'ordine di esecuzione.
  L'ordine operativo obbligatorio è definito dal grafo in Sezione 2.
precondizione: >
  002-DESIGN_fix-provider-bootstrap_v0.2.0.md completamente implementato
---

# DESIGN 003 — Fix accessibility engine

> **Perimetro di questo documento**: `src/accessibility/` (tre file: types,
> engine, detection), `src/locales/` (infrastruttura: it.ts + index.ts), e
> l'eliminazione di tre file legacy.
> Le stringhe di dominio finanziario, i moduli `src/announcements/`, le patch
> ai context (`AuthContext`, `AppDataContext`) appartengono al documento
> successivo.

---

## 1. Contesto e motivazione

Il repository contiene tre file che accedono all'accessibilità tramite API web
(DOM, `window`, `document`, `navigator`, `sessionStorage`) che non esistono in
React Native:

| File da eliminare | Problema principale |
|---|---|
| `src/lib/screen-reader.ts` | `HTMLDivElement`, `aria-live`, `document.body` — crashano o sono silenti in RN |
| `src/hooks/use-talkback.ts` | `window.matchMedia`, `navigator.userAgent`, `sessionStorage` — restituisce sempre `{ detected: false, confidence: 'low' }` in RN |
| `src/hooks/use-screen-reader.ts` | Aggrega `screen-reader.ts`; dipendenza da file già compromesso |

Il source of truth architetturale per la soluzione è definito in
`docs/0-architecture/ADR_001_sistema-annunci-accessibili.md` (versione 1.2.0,
stato APPROVATO). Questo documento attua la parte **motore** dell'ADR: i tre
file in `src/accessibility/` e l'infrastruttura `src/locales/`.

**Problema runtime concreto (N7 del report di diagnosi)**:
`useTalkBack()` restituisce sempre `{ isEnabled: false, confidenceLevel: 'low' }`
perché tutti gli indicatori euristici browser rimangono `false`. Le adattazioni
(touch target aumentati, timeout estesi, descrizioni verbose) non vengono mai
attivate su nessuna piattaforma, anche con screen reader attivo.

**Cambiamento architetturale rispetto alla versione precedente**:

| Prima (monolite) | Dopo (tre layer) |
|---|---|
| `screen-reader.ts` — compone testo + chiama API | `engine.ts` — solo chiama l'API nativa |
| `use-talkback.ts` — detection euristiche browser | `detection.ts` — detection con `AccessibilityInfo` |
| `use-screen-reader.ts` — aggrega il monolite | eliminato — i consumatori usano `announcements/` |
| nessun contratto Announcement | `types.ts` — contratto `Announcement { text, priority }` |

Il layer `announcements/` (moduli che compongono il testo e producono oggetti
`Announcement`) non è nel perimetro di questo documento. Viene creato nel
documento successivo.

---

## 2. Grafo delle dipendenze e ordine obbligatorio

```
STEP 1 (prerequisito di tutto):
  src/accessibility/types.ts         CREATE — nessuna dipendenza interna

STEP 2 (dipende da types.ts, parallelizzabili tra loro):
  src/accessibility/engine.ts        CREATE — importa da ./types
  src/accessibility/detection.ts     CREATE — importa da ./types, @/context/UserSettingsContext

STEP 3 (indipendente da accessibility/, parallelizzabile con step 2):
  src/locales/it.ts                  CREATE — nessuna dipendenza interna
  src/locales/index.ts               CREATE — importa da ./it

STEP 4 (dopo step 2, dopo aggiornamento import in AuthContext):
  src/hooks/use-talkback.ts          DELETE — vedi Sezione 7.1
  src/hooks/use-screen-reader.ts     DELETE — vedi Sezione 7.2

STEP 5 (DIFFERITO — non in questo documento):
  src/lib/screen-reader.ts           DELETE DIFFERITO — vedi Sezione 7.3
```

**Invariante ADR_001 sul flusso di dipendenze:**

```
announcements/    →   accessibility/engine.ts  →  react-native
    (layer futuro)          ▲
                    accessibility/types.ts
                            ▲
                    accessibility/detection.ts  →  @/context/UserSettingsContext
```

`engine.ts` e `detection.ts` non si importano a vicenda.
`locales/` non importa da `accessibility/`.
Nessun modulo in `accessibility/` importa da `src/lib/`, `src/hooks/`, o
`src/context/` tranne `detection.ts` che usa `useUserSettings`.

---

## 3. `src/accessibility/types.ts`

### 3.1 Ruolo

Contratto condiviso tra `engine.ts`, `detection.ts` e, in futuro, tutti i
moduli `announcements/`. La regola generale è che nessun file fuori da
`src/accessibility/` importa direttamente da questo file.

**Unica eccezione ammessa**: `src/announcements/types.ts` potrà importare
`Announcement` e `AnnouncementPriority` direttamente da
`@/accessibility/types` — esclusivamente come import di tipo (`import type`),
non di codice eseguibile. Questa eccezione è necessaria perché i moduli
`announcements/` devono conoscere il contratto `Announcement` per costruire
gli oggetti, ma non possono ottenerlo passando da `engine.ts` (proibito
dall'ADR_001 regola 1). Tutti gli altri file fuori da `src/accessibility/`
usano i re-export di `engine.ts` o `detection.ts`.

### 3.2 Codice TypeScript completo

```ts
// src/accessibility/types.ts
// Tipi condivisi tra engine.ts e detection.ts.
// Regola generale: NON importare direttamente da questo file fuori da
// src/accessibility/. Unica eccezione ammessa: src/announcements/types.ts
// può importare Announcement e AnnouncementPriority come `import type`
// — mai codice eseguibile. Vedi Sezione 3.1 per la motivazione completa.

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
* Fonte di verità: questo file. Vedi Sezione 11 — "Nota critica: migrazione `TalkBackAdaptations`".
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

### 3.3 Scope esplicito

**Incluso:**
- `AnnouncementPriority` — tipo base dell'engine
- `Announcement` — contratto engine/announcements
- `TalkBackState` — stato rilevamento (senza `'medium'`)
- `TalkBackAdaptations` — shape adattamenti (fonte di verità client-side)

**Escluso:**
- Nessuna logica, solo tipi
- `DEFAULT_ADAPTATIONS` — appartiene a `detection.ts` (valore runtime, non tipo)
- Tipi di dominio finanziario — appartengono a `src/lib/types.ts`

---

## 4. `src/accessibility/engine.ts`

### 4.1 Ruolo

Punto unico di accesso all'API nativa `AccessibilityInfo.announceForAccessibility`.
Riceve oggetti `Announcement` già costruiti da `announcements/` e li pronuncia.
Non compone testo, non accede a locales, non gestisce stato.

**Principio fire-and-forget**: `announce()` non restituisce Promise, non gestisce
callback, non rileva se l'annuncio è stato effettivamente pronunciato.
L'unico gate è la stringa vuota — se `text.trim()` è vuota la chiamata viene
saltata silenziosamente. Qualsiasi altro fallimento (screen reader non attivo,
piattaforma non supportata, coda screen reader piena) è accettato in silenzio.
Questo non è un bug: gli annunci sono best-effort per natura.

### 4.2 Codice TypeScript completo

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
  * - Windows / Narrator: vedere Sezione 10 — Rischio R1.
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
* ma questo avviene nel documento successivo, non in questo.
* In questo documento nessun file chiama engine.announce() tranne il
* componente di test temporaneo del Gate 2, che va rimosso prima del commit.
*/
export const engine = new ScreenReaderEngine()
```

### 4.3 Scope esplicito

**Incluso:**
- Classe `ScreenReaderEngine` con metodo `announce(announcement: Announcement)`
- Gate stringa vuota (unico check interno)
- Singleton `engine` esportato

**Escluso — invariante architetturale:**
- Nessuna logica di composizione testo (appartiene ad `announcements/`)
- Nessun import da `src/locales/` (il testo arriva già costruito)
- Nessuna gestione stato (appartiene a `detection.ts`)
- Nessuna logica di priorità (non esposta da RN 0.82)
- Nessun retry, nessun fallback, nessun callback
- Nessun import da `src/lib/`, `src/context/`, `src/hooks/`

**Nota architetturale — stateless obbligatorio:**
`engine.ts` non deve mai mantenere stato interno. Nessuna queue,
nessun debounce, nessun retry, nessun contatore. Qualsiasi logica
che richieda stato appartiene a un layer diverso. Violare questa
regola rompe l'invariante dell'ADR_001.

---

## 5. `src/accessibility/detection.ts`

### 5.1 Ruolo

Hook React `useAccessibilityDetection()` che rileva lo stato dello screen reader tramite
l'API nativa `AccessibilityInfo` e calcola le adattazioni correnti.

**Non emette annunci vocali**. `detection.ts` non importa `engine.ts` né
`src/locales/`. La sua unica responsabilità è rispondere a domande booleane:
"lo screen reader è attivo?", "quanto deve essere grande il touch target?",
"quanto dura il timeout?".

**Sostituisce `src/hooks/use-talkback.ts`**: tutta la detection euristiche
browser (`window.matchMedia`, `navigator.userAgent`, `sessionStorage`, ecc.)
viene rimossa. Viene usata esclusivamente l'API nativa.

**Nota architetturale — dipendenza da `UserSettingsContext`:**
`detection.ts` dipende da `UserSettingsContext` per leggere e scrivere
`talkBackManualOverride` e `talkBackAdaptations`. Questa dipendenza
introduce un coupling verticale tra il layer `accessibility/` e un
context applicativo. È accettata come compromesso temporaneo consapevole
per evitare un refactor cross-layer fuori perimetro in questo documento.
Non è un errore architetturale da correggere ora — va rivalutata in un
documento futuro dedicato all'inversione delle dipendenze dei layer.

### 5.2 Analisi del problema eliminato

La detection browser in `use-talkback.ts` restituiva sempre
`{ isEnabled: false, confidenceLevel: 'low' }` perché le seguenti API non
esistono in React Native:

| API usata nel file legacy | Stato in RN |
|---|---|
| `window.matchMedia(...)` | `window` è parzialmente polyfillato ma `matchMedia` non esiste |
| `navigator.userAgent` | stringa vuota |
| `'ontouchstart' in window` | non affidabile in RN |
| `navigator.maxTouchPoints` | non disponibile |
| `window.speechSynthesis.getVoices()` | non esiste |
| `sessionStorage.getItem(...)` | `sessionStorage` non esiste → `ReferenceError` |
| `document.body.setAttribute(...)` | `document` non esiste |
| `document.body.classList.add(...)` | non esiste |
| `window.addEventListener('focus', ...)` | non affidabile in RN |

**Effetto**: `adaptationsActive` era sempre `false`. Touch target a 44px anche
con TalkBack attivo. Timeout mai raddoppiati. Descrizioni mai verbose.

### 5.3 Soluzione: `AccessibilityInfo` nativo

```
useAccessibilityDetection()
  │
  ├─ [mount] AccessibilityInfo.isScreenReaderEnabled()
  │    └── Promise<boolean> → setTalkBackState({ isEnabled, isDetected,
  │         confidenceLevel: 'high'/'low', adaptationsActive })
  │
  ├─ AccessibilityInfo.addEventListener('screenReaderChanged', handler)
  │    └── handler(nativeEnabled: boolean) → aggiorna stato
  │         cleanup: subscription.remove()  [firma RN ≥ 0.65]
  │
  ├─ manualOverride da useUserSettings():
  │    se non null → sovrascrive il valore nativo in isEnabled e
  │    adaptationsActive; non tocca isDetected né confidenceLevel
  │
  └─ funzioni utilitarie (getTouchTargetSize, getAnimationDuration,
      getTimeout, shouldUseVerboseDescriptions, ...) invariate nella
      logica — cambiate solo le sorgenti dati dello stato
```

### 5.4 Codice TypeScript completo

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
      // Coerente con il Rischio R2 della Sezione 10.
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
  // Il suo significato reale è "forza override locale attivo"
  // e "forza override locale disattivo".
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

### 5.5 Note sul comportamento

**Attivazione/disattivazione in sessione**: il hook è reattivo. Quando
l'utente attiva TalkBack da Impostazioni di accessibilità durante la sessione,
il listener `screenReaderChanged` riceve `true`, lo stato si aggiorna al
prossimo render React e le adattazioni si attivano senza riavvio dell'app.
Il comportamento è simmetrico alla disattivazione. Identico su tutte e tre le
piattaforme (Android, iOS, Windows).

**Override manuale**: `talkBackManualOverride !== null` sovrascrive `isEnabled`
e `adaptationsActive`, ma non tocca `isDetected` né `confidenceLevel`. Utile
per testare le adattazioni in sviluppo senza attivare uno screen reader reale.

**Rimozione side effect DOM**: il `useEffect` del file originale impostava
attributi su `document.body` (`data-talkback`, `data-talkback-confidence`) e
classi CSS. In React Native questi meccanismi non hanno equivalenti: le
adattazioni vengono applicate dai componenti consumatori tramite le funzioni
utilitarie esportate. I side effect DOM sono rimossi completamente senza
sostituzione.

**Cleanup corretto**: alla smontatura del componente `isMounted` diventa
`false` e `subscription.remove()` rimuove il listener. Nessun aggiornamento
di stato avviene dopo l'unmount.

### 5.6 Scope esplicito

**Incluso:**
- Eliminazione di tutta la detection browser (`window.matchMedia`,
  `sessionStorage`, `speechSynthesis`, `navigator.maxTouchPoints`,
  `navigator.userAgent`, `document.body.*`)
- Eliminazione di `detectTalkBack()` — non esiste nella versione riscritta
- Eliminazione di `recheckInterval` (setInterval 30s) — sostituito dal
  listener reattivo `screenReaderChanged`
- Rinomina export: `useTalkBack()` → `useAccessibilityDetection()`
- Aggiornamento tipo `confidenceLevel`: eliminato `'medium'`
- Nuovo comportamento `resetDetection` (cancella override + rilegge nativo)

**Escluso:**
- Nessuna modifica alla logica delle funzioni utilitarie
- La logica di `DEFAULT_ADAPTATIONS` è invariata rispetto all'implementazione
  originale in `use-talkback.ts` — i valori e le chiavi sono identici
- Nessuna emissione di annunci vocali (appartiene ad `announcements/`)
- Nessun import da `src/locales/`

**Nota architetturale — prevenzione scope inflation:**
Le funzioni esportate da `detection.ts` devono restare pure e derivate
esclusivamente da `TalkBackState` e `adaptations`. Non aggiungere in
futuro logica di dominio, chiamate a repository, o dipendenze da layer
applicativi. Se una funzione richiede informazioni oltre a `TalkBackState`
e `adaptations`, appartiene a un layer diverso.

---

## 6. `src/locales/it.ts` e `src/locales/index.ts`

### 6.1 Ruolo dell'infrastruttura locales

In questo passo vengono creati i file `src/locales/` come infrastruttura
strutturale. L'engine (`engine.ts`) riceve testo già costruito — non importa
locales. La detection (`detection.ts`) non emette annunci — non importa locales.

I file locales vengono creati ora per:
1. Stabilire la struttura dei tipi (`Strings`, `StringKey`) che i moduli
  `announcements/` useranno nel documento successivo.
2. Definire la regola di import invariante (tutti passano da `index.ts`).
3. Definire `index.ts` come selettore lingua minimale (lingua fissa italiano
  nel passo 3 — il selettore dinamico da `UserSettingsContext` arriva nel
  passo 4).

**Le stringhe di dominio finanziario** (conti, movimenti, budget, obiettivi,
export, template, form, toggle, card, audio, periodo, PIN, autenticazione)
**non appartengono a questo documento**. Vengono aggiunte al file `it.ts`
man mano che ogni modulo `announcements/` viene scritto nel documento
successivo.

### 6.2 `src/locales/it.ts`

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

### 6.3 `src/locales/index.ts`

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

### 6.4 Scope esplicito

**Incluso:**
- Tipi `Strings` (typeof it) e `StringKey` (keyof Strings)
- Oggetto `it` con `as const` per inferenza dei tipi letterali
- `index.ts` come selettore lingua (lingua fissa italiano nel passo 3)
- Regola di import invariante documentata nei commenti

**Escluso esplicitamente:**
- Stringhe di autenticazione (`auth_*`, `private_*`)
- Stringhe di navigazione schermata
- Stringhe di conti, movimenti, budget, obiettivi
- Stringhe di export, template, form, toggle, card
- Stringhe audio, periodo, help
- Selettore lingua dinamico da `UserSettingsContext` (passo 4)

---

## 7. File da eliminare

### 7.1 `src/hooks/use-talkback.ts`

**Motivazione**: sostituito completamente da `src/accessibility/detection.ts`.
Tutta la detection euristiche browser è rimossa. Il hook `useTalkBack()` è
rinominato in `useAccessibilityDetection()` ed esposto da `detection.ts`.

**Consumatori che devono aggiornare l'import prima della deletion**:

| File consumatore | Import attuale | Import aggiornato |
|---|---|---|
| `src/context/AuthContext.tsx` | `import { useTalkBack } from '@/hooks/use-talkback'` | `import { useAccessibilityDetection } from '@/accessibility/detection'` |
| Altri file se presenti | `from '@/hooks/use-talkback'` | `from '@/accessibility/detection'` |

Eseguire prima della deletion:
```bash
grep -r "from.*use-talkback\|useTalkBack" src/ --include="*.ts" --include="*.tsx"
```
I file trovati devono aggiornare import e chiamata prima che `use-talkback.ts`
venga eliminato. La regola di aggiornamento è universale per tutti i file
trovati dal grep, indipendentemente dal file:
- `from '@/hooks/use-talkback'` → `from '@/accessibility/detection'`
- `useTalkBack(` → `useAccessibilityDetection(`

**Gate di verifica post-deletion**:
```bash
grep -r "from.*use-talkback\|useTalkBack" src/
# deve restituire 0 risultati
```

### 7.2 `src/hooks/use-screen-reader.ts`

**Motivazione**: eliminato senza equivalente diretto nella nuova architettura.
I consumatori di `useScreenReader()` migrano ai moduli `src/announcements/`
nel documento successivo.

**Sequenza di eliminazione**:
`screens/` e `components/` sono vuoti — non esistono consumatori reali
di `useScreenReader()` in questa fase del progetto. Il file può essere
eliminato in questo documento dopo aver verificato con il comando seguente
che nessun file lo importa:
```bash
grep -r "from.*use-screen-reader\|useScreenReader\|useAnnouncePage" src/ --include="*.ts" --include="*.tsx"
```
Se il comando restituisce zero risultati, procedere direttamente con
la deletion. Se restituisce risultati, aggiornare gli import nei file
trovati prima di procedere con la deletion.

### 7.3 `src/lib/screen-reader.ts` — DIFFERITO

**Motivazione**: sostituito da `engine.ts` (per la chiamata nativa) e dai
moduli `src/announcements/` (per la composizione del testo). La classe
`ScreenReaderAnnouncer` con i suoi 36 metodi viene smantellata — ogni metodo
diventa una funzione in un modulo `announcements/` specifico.

**Perché la deletion è differita**: questo file ha consumatori diretti
(`AuthContext.tsx`, `AppDataContext.tsx`, e tramite `use-screen-reader.ts`
anche componenti UI) che non vengono migrati in questo documento. Eliminarlo
ora romperebbe la build. La deletion avviene nel documento successivo
(announcements/) dopo che tutti i consumatori sono stati migrati.

**Nessuna modifica al file** in questo documento — rimane invariato e
funzionante fino alla migration completa.

**Dipendenza esplicita**: l'eliminazione di `screen-reader.ts` è un gate
del documento successivo, non di questo. Agent-Plan deve sequenziarla di
conseguenza.

---

## 8. Criteri di validazione per file

### Gate 1 — `accessibility/types.ts` creato

```bash
npx tsc --noEmit
```
Nessun errore. I tipi `AnnouncementPriority`, `Announcement`, `TalkBackState`,
`TalkBackAdaptations` sono esportati.

```bash
grep -E "^export type|^export interface" src/accessibility/types.ts
```
Deve mostrare 4 voci: `AnnouncementPriority`, `Announcement`, `TalkBackState`,
`TalkBackAdaptations`.

Verifica forward compatibility:
```bash
# Il tipo non deve contenere 'medium'
grep "medium" src/accessibility/types.ts
# Deve restituire 0 risultati
```

### Gate 2 — `accessibility/engine.ts` creato

```bash
npx tsc --noEmit
```
Nessun errore.

```bash
grep -E "document\.|window\.|HTMLDivElement|aria-live|aria-atomic|from 'react'" src/accessibility/engine.ts
# Deve restituire 0 risultati
```

**Verifica funzionale manuale (con screen reader attivo)**:
Aggiungere temporaneamente in `App.tsx`:
```ts
import { engine } from '@/accessibility/engine'
engine.announce({ text: 'Test engine ZecchinoReact', priority: 'polite' })
```
Eseguire l'app. Criterio di successo: Narrator deve pronunciare per intero
la stringa "Test engine ZecchinoReact" entro 3 secondi dal mount del
componente. Una pronuncia parziale o assente indica che il Rischio R1
si è materializzato.

Verifica prioritaria su **Windows con Narrator attivo** (piattaforma
primaria di sviluppo). Se Narrator non pronuncia il testo, il Rischio R1
della Sezione 10 si è materializzato — aggiungere guard `Platform.OS`
prima di procedere al documento successivo.

Verificare anche su Android con TalkBack attivo.

Rimuovere il codice temporaneo di test dopo la verifica.

### Gate 3 — `accessibility/detection.ts` creato

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
# Deve restituire 0 risultati — il hook è rinominato useAccessibilityDetection
```

```bash
# Verifica invariante ADR_001: detection.ts non importa da engine.ts
grep "from.*engine" src/accessibility/detection.ts
# Deve restituire 0 risultati
# Se restituisce risultati, la regola di separazione dell'ADR_001 è violata
```

**Verifica funzionale manuale**: con screen reader attivo (TalkBack su Android,
VoiceOver su iOS, Narrator su Windows), montare un componente che usa
`useAccessibilityDetection()` e verificare che:
- `talkBackState.isEnabled === true`
- `talkBackState.isDetected === true`
- `talkBackState.confidenceLevel === 'high'`
- `talkBackState.adaptationsActive === true`
- `getTouchTargetSize()` restituisce `56`

### Gate 4 — `locales/it.ts` e `locales/index.ts` creati

```bash
npx tsc --noEmit
# Nessun errore di tipo sui due file
```

```bash
grep -r "from.*locales/it" src/ --include="*.ts" --include="*.tsx"
# Deve restituire 0 risultati
# Nessun file importa it.ts direttamente — tutti passano da index.ts
```

```bash
grep -E "^export" src/locales/index.ts
# Deve mostrare: export { strings }, export type { Strings, StringKey }
```

Verifica che il tipo `StringKey` sia `never` in questa fase (oggetto it vuoto):

Crea un file temporaneo `src/locales/locales-verify.ts` con il contenuto
seguente. Dopo aver verificato che TypeScript non segnala errori, elimina
il file prima di procedere al commit. Non includere mai questo file in un
commit.

```ts
// Test TypeScript da aggiungere temporaneamente e rimuovere dopo:
import type { StringKey } from '@/locales/index'
type Verifica = StringKey extends never ? true : false
// Verifica deve essere true — oggetto it è vuoto, StringKey è never
```

Questo è il comportamento atteso in questo passo: `StringKey` diventa un tipo
concreto non vuoto solo dopo che le stringhe vengono aggiunte nel documento
successivo.

### Gate 5 — `use-talkback.ts` eliminato

```bash
test ! -f src/hooks/use-talkback.ts && echo "OK" || echo "ERRORE: file ancora presente"
```

```bash
grep -r "from.*use-talkback\|useTalkBack" src/ --include="*.ts" --include="*.tsx"
# Deve restituire 0 risultati
```

### Gate 6 — `use-screen-reader.ts` eliminato

```bash
test ! -f src/hooks/use-screen-reader.ts && echo "OK" || echo "ERRORE: file ancora presente"
```

```bash
grep -r "from.*use-screen-reader\|useScreenReader\|useAnnouncePage" src/ --include="*.ts" --include="*.tsx"
# Deve restituire 0 risultati
```

### Gate finale — build pulito

```bash
npx tsc --noEmit
# Zero errori TypeScript su tutto il progetto
```

```bash
npm run lint
# Zero warning sui file creati o modificati
```

---

## 9. Cosa NON viene affrontato in questo documento

| Ambito | Motivazione | Documento previsto |
|---|---|---|
| `src/announcements/` (tutti i moduli) | Layer futuro che usa engine.ts | Documento successivo |
| Stringhe di dominio in `locales/it.ts` | Aggiunte da ogni modulo announcements/ | Documento successivo |
| Patch `AuthContext.tsx` (import detection) | Fuori perimetro engine | Documento successivo |
| Patch `AppDataContext.tsx` | Fuori perimetro engine | Documento successivo |
| Eliminazione `screen-reader.ts` | Dipende da migration announcements/ | Documento successivo |
| Funzionalità haptic (`use-haptic.ts`) | Layer separato | Documento futuro |
| Funzionalità audio (`sound-system.ts`) | Layer separato | Documento futuro |
| Navigazione e focus management | Fuori perimetro engine | Documento futuro |
| Supporto multilingual (passo 4) | `locales/index.ts` lingua dinamica | Documento futuro |
| `UserSettingsContext` — struttura | Non modificato | Documento futuro |
| Test automatici (Jest) | Fuori perimetro design | Piano separato |

---

## 10. Rischi e dipendenze

| # | Rischio | Probabilità | Impatto | Mitigazione |
|---|---|---|---|---|
| R1 | `AccessibilityInfo.announceForAccessibility` non disponibile o silente su Windows con Narrator | Bassa | Alta | Verificare manualmente (Gate 2) prima di procedere al documento successivo. Se Narrator non pronuncia: aggiungere guard `Platform.OS !== 'windows'` in `engine.announce()` e aprire issue su `react-native-windows`. Contingency: in assenza di supporto Windows, engine su Windows è no-op documentato. |
| R2 | `AccessibilityInfo.addEventListener('screenReaderChanged', ...)` su react-native-windows può restituire un oggetto diverso dalla firma moderna RN, oppure non emettere mai eventi quando Narrator viene attivato o disattivato durante la sessione. Conseguenza possibile: lo stato iniziale è corretto ma non si aggiorna mai a runtime su Windows. | Bassa-Media | Media | Già mitigato parzialmente: la firma `subscription.remove()` è quella moderna RN ≥ 0.65. Verificare nel Gate 3 che `subscription.remove` sia una funzione prima di chiamarla. Verificare manualmente su Windows che attivando e disattivando Narrator durante la sessione lo stato `talkBackState.isEnabled` si aggiorni correttamente. Se il listener non emette eventi: aggiungere un polling di fallback con `AccessibilityInfo.isScreenReaderEnabled()` ogni 5 secondi SOLO su `Platform.OS === 'windows'`, documentandolo come workaround Windows-specifico. |
| R3 | `TalkBackAdaptations` attualmente definito in `src/lib/supabase/types.ts` e importato da `use-talkback.ts` | Certa | Bassa | Vedere Sezione 11 — nota migrazione TalkBackAdaptations. La duplicazione temporanea è accettata durante la transition. |
| R4 | Finestra di incertezza al primo mount (detection.ts) | Certa | Bassa | Documentata e accettata in §5.5. Durata tipica <100ms. Il listener corregge lo stato senza intervento manuale. |
| R5 | `screen-reader.ts` non può essere eliminato finché `announcements/` non è completo | Certa | Nulla (se la sequenza è rispettata) | La deletion è esplicitamente differita al documento successivo (Sezione 7.3). Agent-Plan deve sequenziare correttamente. |
| R6 | Consumatori di `use-screen-reader.ts` presenti al momento della deletion | Molto bassa | Media | `screens/` e `components/` sono vuoti in questa fase — il grep di Sezione 7.2 è una misura precauzionale, non la gestione di un rischio concreto. Se inaspettatamente il grep restituisce risultati, aggiornare quegli import prima di procedere. |

---

## 11. Note per Agent-Plan

### Sequenza commit raccomandata

```
commit 1: feat(accessibility): aggiungi accessibility/types.ts
  - src/accessibility/types.ts (CREATE)

commit 2: feat(accessibility): aggiungi accessibility/engine.ts
  - src/accessibility/engine.ts (CREATE)
  - GATE 2: eseguire DOPO la creazione del file e PRIMA di fare il commit.
    Sequenza obbligatoria: 1) crea il file, 2) esegui la verifica manuale
    Narrator su Windows descritta nel Gate 2 della Sezione 8,
    3) solo se la verifica passa, esegui il commit.

commit 3: feat(accessibility): aggiungi accessibility/detection.ts
  - src/accessibility/detection.ts (CREATE)

commit 4: feat(locales): aggiungi infrastruttura locales
  - src/locales/it.ts (CREATE)
  - src/locales/index.ts (CREATE)

commit 5: refactor(accessibility): aggiorna import useTalkBack → useAccessibilityDetection
  - src/context/AuthContext.tsx (PATCH — solo import e chiamata)
  - [altri file trovati dal grep di Sezione 7.1]

commit 6: chore(accessibility): elimina use-talkback.ts
  - src/hooks/use-talkback.ts (DELETE)
  - GATE 5: verificare che grep restituisca 0 risultati

commit 7: chore(accessibility): verifica consumatori use-screen-reader.ts
  - Eseguire grep di verifica (§7.2)
  - ATTESO: grep restituisce risultati in AuthContext.tsx e
    AppDataContext.tsx — questi file importano useScreenReader
  - NON eliminare use-screen-reader.ts in questo commit
  - Documentare i risultati del grep
  - La deletion è differita al gate finale del DESIGN 004
    dopo la migrazione dei context al layer announcements/
  - GATE 6: verificare con grep e documentare i consumatori trovati

commit 8: DIFFERITO al documento successivo: elimina screen-reader.ts
```

### Nota critica: migrazione `TalkBackAdaptations`

`TalkBackAdaptations` è attualmente definito in `src/lib/supabase/types.ts`.
Il nuovo file `accessibility/types.ts` ne definisce una versione identica.

> ⚠️ **SCELTA ADOTTATA: Opzione B** — duplicazione temporanea accettata.
> Consolidazione nel documento successivo. Non implementare Opzione A in
> questo documento.

Opzioni per la migration (scegliere una):
- **Opzione A** (raccomandata): aggiornare `src/lib/supabase/types.ts` per
  importare e re-esportare il tipo da `@/accessibility/types`. I repository
  che usano il tipo DB (`DbImpostazioni`, ecc.) continuano a funzionare.
- **Opzione B**: mantenere la duplicazione temporanea durante la transition
  e rimuovere la copia in `supabase/types.ts` quando tutti i consumatori
  diretti sono migrati.

**Scelta adottata: Opzione B.** La definizione di `TalkBackAdaptations` in `accessibility/types.ts` è temporaneamente     duplicata rispetto a `src/lib/supabase/types.ts`. Questa duplicazione è intenzionale e temporanea — la consolidazione in una  singola fonte di verità verrà eseguita nel documento successivo dedicato alla migrazione dei consumatori verso `announcements/`.

In entrambi i casi `detection.ts` deve importare da `@/accessibility/types`,
non da `@/lib/supabase/types`.

### Nota critica: detection.ts è codice orfano in questo documento

`src/accessibility/detection.ts` viene creato in questo documento ma non
viene montato da nessun Context o componente dell'app. Nessun file importa
`useAccessibilityDetection()` al termine di questo documento.

Questo è intenzionale e corretto.

L'integrazione di `detection.ts` nei React Provider dell'app
(in particolare `AuthContext.tsx`) avviene nel documento successivo
destinato a `src/announcements/`. In quel documento `AuthContext` sostituirà
l'import di `useTalkBack` con `useAccessibilityDetection`.

Agent-Plan non deve tentare di integrare `detection.ts` nei context
per "vederlo funzionare" in questo documento — farlo violerebbe il
perimetro e potrebbe rompere la build.

Il modulo è verificabile autonomamente tramite un componente di test
temporaneo montato in `App.tsx` (come descritto nel Gate 3 della Sezione 8),
che va rimosso dopo la verifica prima del commit.

### Nota critica: import chain da `useUserSettings`

`detection.ts` importa `useUserSettings` da `@/context/UserSettingsContext`.
Verificare che `talkBackManualOverride` e le sue setter siano presenti in
`UserSettings` e esposte da `useUserSettings()`. Se non fossero presenti:
aggiungerle prima di creare `detection.ts` (blocco di questo commit).

Eseguire prima:
```bash
grep -E "talkBackManualOverride|talkBackAdaptations|setTalkBackAdaptations|setTalkBackManualOverride" src/context/UserSettingsContext.tsx src/hooks/use-user-settings.ts
```

### Nota critica: engine.ts non deve essere chiamato direttamente

`src/accessibility/engine.ts` viene creato e reso disponibile in questo
documento, ma non deve essere chiamato da nessun file dell'app al termine
di questo documento.

Il solo punto autorizzato a chiamare `engine.announce()` è
`src/announcements/index.ts`, che viene costruito nel documento successivo.

Agent-Plan non deve tentare di collegare `engine.ts` a nessun context,
hook o componente in questo documento — farlo violerebbe l'invariante
dell'ADR_001 (regole 2 e 3) e anticiperebbe lavoro che appartiene al
documento successivo.

L'unica chiamata a `engine` ammessa in questo documento è quella
temporanea di test nel Gate 2 della Sezione 8, che va rimossa prima
del commit.

### Source of truth

Tutte le decisioni architetturali di questo documento derivano da:
`docs/0-architecture/ADR_001_sistema-annunci-accessibili.md` (versione 1.2.0).
In caso di conflitto tra questo documento e ADR_001, prevale ADR_001.

---

## 12. Contraddizioni rilevate

### C1 — `screen-reader.ts` nel perimetro DELETE ma con consumatori non migrati

**Problema**: questo documento dichiara `src/lib/screen-reader.ts` come file
da eliminare. Tuttavia `screen-reader.ts` è importato da `AuthContext.tsx`,
`AppDataContext.tsx` e `use-screen-reader.ts`. La migration di questi consumatori
al layer `announcements/` non è nel perimetro di questo documento.

**Risoluzione adottata**: la deletion di `screen-reader.ts` è documentata
come differita alla Sezione 7.3 (commit 8 in Sezione 11). Il file rimane
invariato e funzionante finché tutti i consumatori non sono migrati.
Agent-Plan deve sequenziare la deletion come parte del documento successivo.

**Nota**: se la deletion fosse eseguita ora rompererebbe la build — non farlo.

### C2 — `use-screen-reader.ts`: deletion differita al DESIGN 004

**Contesto**: durante l'analisi del perimetro del DESIGN 004 è emerso
che `src/context/AuthContext.tsx` e `src/context/AppDataContext.tsx`
importano entrambi `useScreenReader` da `use-screen-reader.ts`.
Eliminare il file in questo documento romperebbe la build perché
i context non verrebbero migrati al nuovo sistema `announcements/`
fino al DESIGN 004.

**Risoluzione adottata**: la deletion di `use-screen-reader.ts` è
differita al DESIGN 004. Il file rimane fisicamente presente e
funzionante fino a quando entrambi i context non sono stati migrati
al layer `announcements/`. La deletion diventa il gate finale del
DESIGN 004, non di questo documento.

**Azione nel DESIGN 003**: il Gate 6 va eseguito con grep di verifica.
Se il grep restituisce risultati nei context files — atteso — non
procedere con la deletion. Documentare i risultati e lasciare il file
intatto per il DESIGN 004.

### C3 — Regola di import di `accessibility/types.ts` vs necessità di `announcements/`

**Problema**: la Sezione 3.1 stabilisce che nessun file fuori da
`src/accessibility/` deve importare direttamente da `accessibility/types.ts`.
Tuttavia i moduli `announcements/` hanno bisogno del tipo `Announcement`
per costruire oggetti. Non possono ottenerlo da `engine.ts` (proibito
dall'ADR_001 regola 1 — `announcements/` non importa da `accessibility/`
tranne `index.ts`). Questo crea una contraddizione tra la regola generale
e la necessità pratica del layer futuro.

**Risoluzione adottata**: la Sezione 3.1 è stata aggiornata per dichiarare
esplicitamente una eccezione mirata: `src/announcements/types.ts` potrà
importare `Announcement` e `AnnouncementPriority` da `accessibility/types.ts`
esclusivamente come `import type` — nessun codice eseguibile. Questo rispetta
lo spirito dell'ADR_001 (nessuna dipendenza su `engine.ts`) pur permettendo
la condivisione del contratto di tipo tra i due layer adiacenti.
