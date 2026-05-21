---
tipo: design
titolo: "Fix accessibility engine — layer src/accessibility/ e locales minimale"
versione: 1.0.0
data: 2026-05-18
data-ultima-revisione: 2026-05-21
stato: CORRETTO — IN ATTESA DI IMPLEMENTAZIONE
stato-revisione: VALIDATO
governance-version: 1.0.0
autore: donny-81
revisore: Consiglio AI (Perplexity, Claude, ChatGPT, DeepSeek, Gemini)
sorgente: docs/0-architecture/ADR_001_sistema-annunci-accessibili.md
perimetro: >
  src/accessibility/types.ts (CREATE),
  src/accessibility/engine.ts (CREATE),
  src/accessibility/detection.ts (CREATE),
  src/locales/it.ts (CREATE — stringhe motore only),
  src/locales/index.ts (CREATE),
  src/context/AuthContext.tsx (PATCH — solo riga di import: sostituzione
    useTalkBack → useAccessibilityDetection, in coordinazione con la
    deletion di use-talkback.ts. T6 è precondizione funzionale di T7),
  src/lib/screen-reader.ts (DELETE DIFFERITO — vedi Sezione 7.3),
  src/hooks/use-screen-reader.ts (DELETE DIFFERITO — vedi Sezione 7.2 e DESIGN 004),
  src/hooks/use-talkback.ts (DELETE — vedi Sezione 7)
nota-ordine: >
  L'ordine dei file in questo elenco non è l'ordine di esecuzione.
  L'ordine operativo obbligatorio è definito dal grafo in Sezione 2.
precondizione: >
  002-DESIGN_fix-provider-bootstrap_v0.2.0.md completamente implementato
dipendenze-a-monte: >
  Questo design dipende da: DESIGN 002 (fix provider bootstrap) e,
  transitivamente, DESIGN 001 (fix blocchi di avvio). L'implementazione
  di DESIGN 003 può iniziare solo dopo la chiusura formale dei cicli
  DESIGN 001 e DESIGN 002.
dipendenze-a-valle: >
  DESIGN 004 (announcements layer) dipende dal contratto pubblico
  definito in DESIGN 003. In particolare il tipo TalkBackState e l'hook
  useAccessibilityDetection() devono esistere e superare i test prima
  che DESIGN 004 possa essere implementato.
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

STEP 4a (dopo step 2 — precondizione funzionale di STEP 4b):
  src/context/AuthContext.tsx        PATCH — solo riga di import
                                     (sostituzione useTalkBack →
                                     useAccessibilityDetection)
                                     Task PLAN: 003.T6
                                     Dipende da: 003.T3 (il contratto
                                     sostitutivo deve esistere prima
                                     di aggiornare l'import)

STEP 4b (dopo STEP 4a — la deletion non può precedere il PATCH):
  src/hooks/use-talkback.ts          DELETE — vedi Sezione 7.1
                                     Task PLAN: 003.T7
                                     Dipende da: 003.T6
  src/hooks/use-screen-reader.ts     VERIFICA con grep — DELETE DIFFERITA
                                     a DESIGN 004 (vedi §7.2)

STEP 5 (DIFFERITO — non in questo documento):
  src/lib/screen-reader.ts           DELETE DIFFERITO — vedi Sezione 7.3
```

**Dipendenza esplicita T6 → T3 (formalizzata in questo grafo):**
T6 (patch import in `AuthContext.tsx`) non può essere eseguito se T3
(definizione di `detection.ts` con il nuovo contratto
`useAccessibilityDetection`) non è ancora stato completato. La sequenza
obbligatoria è T3 → T6 → T7. Violare quest'ordine produce un errore di
modulo non risolto (`Cannot find module '@/accessibility/detection'`).
La precedenza commit-per-commit è verificata nella Sezione 5 del PLAN 003.

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

> **Implementazione estratta nel coding plan:** [003-PLAN_fix-accessibility-engine_v1.0.0.md](../3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md) — Task **003.T1**

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

> **Implementazione estratta nel coding plan:** [003-PLAN_fix-accessibility-engine_v1.0.0.md](../3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md) — Task **003.T2**

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

> **Implementazione estratta nel coding plan:** [003-PLAN_fix-accessibility-engine_v1.0.0.md](../3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md) — Task **003.T3**

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

### 5.7 Contratto pubblico dell'hook `useAccessibilityDetection()`

Questa sottosezione è la **fonte di verità architetturale** dell'API
pubblica esposta da `detection.ts`. Il codice TypeScript completo vive
nel PLAN (Task 003.T3); qui si formalizza il contratto che i layer a
valle — in particolare DESIGN 004 (`announcements/` e provider
applicativi) — devono assumere come stabile.

#### Firma

```ts
function useAccessibilityDetection(): UseAccessibilityDetectionReturn
```

Hook React puro. Non accetta argomenti. Va invocato all'interno di un
componente React montato sotto `UserSettingsProvider` (dipendenza
verticale documentata in §5.1).

#### Valore di ritorno

```ts
interface UseAccessibilityDetectionReturn {
  // Stato di rilevamento aggregato (nativo + override manuale).
  talkBackState: TalkBackState

  // Adattazioni correnti (touch target, timeout, animazioni,
  // descrizioni verbose). Derivate da TalkBackAdaptations utente.
  adaptations: TalkBackAdaptations

  // Override manuale (solo per sviluppo/testing).
  // Imposta isEnabled e adaptationsActive a true, ignorando il valore nativo.
  enableTalkBack: () => void

  // Override manuale opposto: forza isEnabled e adaptationsActive a false.
  disableTalkBack: () => void

  // Cancella l'override manuale e rilegge il valore nativo da
  // AccessibilityInfo.isScreenReaderEnabled().
  resetDetection: () => void

  // Aggiorna una singola chiave di adattazione (es. touchTargetSize).
  updateAdaptation: <K extends keyof TalkBackAdaptations>(
    key: K,
    value: TalkBackAdaptations[K]
  ) => void

  // Ripristina tutte le adattazioni ai valori di default.
  resetAdaptations: () => void

  // Funzioni utilitarie pure derivate da talkBackState + adaptations.
  // La logica è invariata rispetto a use-talkback.ts.
  getTouchTargetSize: () => number
  getAnimationDuration: (base: number) => number
  getTimeout: (base: number) => number
  shouldUseVerboseDescriptions: () => boolean
}
```

#### Comportamento atteso

- **Stato iniziale al mount**: `talkBackState.confidenceLevel === 'low'`
  finché la prima `AccessibilityInfo.isScreenReaderEnabled()` non risolve
  (tipicamente <100ms, vedi R4 in §10). Subito dopo il primo aggiornamento
  asincrono il valore passa a `'high'`.
- **Reattività in sessione**: il listener `screenReaderChanged` aggiorna
  `talkBackState.isEnabled` al volo (vedi §5.5). Comportamento simmetrico
  in attivazione e disattivazione, su tutte e tre le piattaforme.
- **Precedenza override**: se l'utente ha impostato `talkBackManualOverride`
  in `UserSettings`, questo sovrascrive `isEnabled` e `adaptationsActive`
  ma non `isDetected` né `confidenceLevel`.
- **Pure functions**: tutte le funzioni utilitarie sono pure e derivate
  solo da `talkBackState` e `adaptations`. Nessuna chiamata a I/O, nessun
  side effect.
- **Cleanup**: alla smontatura il listener viene rimosso con
  `subscription.remove()` e nessun aggiornamento di stato avviene
  dopo l'unmount.

#### Stabilità del contratto e dipendenza di DESIGN 004

**Questo contratto è la dipendenza primaria di DESIGN 004.** Tutti i
moduli `announcements/` e i provider applicativi (`AuthContext.tsx`
e altri) consumeranno `useAccessibilityDetection()` con la firma
documentata sopra. Modifiche breaking a questa API obbligano DESIGN 004
a riallineare ogni consumer.

Variazioni ammesse senza breaking change:
- aggiunta di nuove chiavi opzionali al ritorno
- aggiunta di nuove funzioni utilitarie

Variazioni che richiedono coordinamento esplicito con DESIGN 004:
- modifica della firma di funzioni esistenti
- rimozione di chiavi dal ritorno
- modifica della shape di `TalkBackState` o `TalkBackAdaptations`

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

> **Implementazione estratta nel coding plan:** [003-PLAN_fix-accessibility-engine_v1.0.0.md](../3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md) — Task **003.T4**

### 6.3 `src/locales/index.ts`

> **Implementazione estratta nel coding plan:** [003-PLAN_fix-accessibility-engine_v1.0.0.md](../3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md) — Task **003.T5**

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

> **Comandi e gate estratti nel coding plan:** [003-PLAN_fix-accessibility-engine_v1.0.0.md](../3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md) — Tasks **003.T6**, **003.T7**

### 7.2 `src/hooks/use-screen-reader.ts`

**Motivazione**: eliminato senza equivalente diretto nella nuova architettura.
I consumatori di `useScreenReader()` migrano ai moduli `src/announcements/`
nel documento successivo.

**Sequenza di eliminazione**:
`screens/` e `components/` sono vuoti — non esistono consumatori reali
di `useScreenReader()` in questa fase del progetto. Il file può essere
eliminato in questo documento dopo aver verificato con il comando seguente
che nessun file lo importa:
> **Comando e procedura estratti nel coding plan:** [003-PLAN_fix-accessibility-engine_v1.0.0.md](../3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md) — Task **003.T8**

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

> **Comandi di validazione completi estratti nel coding plan:** [003-PLAN_fix-accessibility-engine_v1.0.0.md](../3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md) — Sezione **§4 Gate di completamento**

I gate verificano nell'ordine:

1. **Gate 1** — `accessibility/types.ts` creato: compilazione TypeScript, grep 4 tipi esportati, forward-compatibility `'medium'` assente.
2. **Gate 2** — `accessibility/engine.ts` creato: compilazione TypeScript, grep dipendenze DOM/React assenti, verifica funzionale manuale Narrator (Windows) e TalkBack (Android).
3. **Gate 3** — `accessibility/detection.ts` creato: compilazione TypeScript, grep dipendenze browser rimosse, verifica invariante ADR_001, verifica funzionale manuale.
4. **Gate 4** — `locales/it.ts` e `locales/index.ts` creati: compilazione TypeScript, grep import diretti (0 risultati).
5. **Gate 5** — `use-talkback.ts` eliminato: file assente, grep import (0 risultati).
6. **Gate 6** — `use-screen-reader.ts` verificato con grep — consumatori documentati (deletion differita a DESIGN 004).
7. **Gate finale** — build pulito: `npx tsc --noEmit`, `npm run lint`.

---
## 9. Cosa NON viene affrontato in questo documento

| Ambito | Motivazione | Documento previsto |
|---|---|---|
| `src/announcements/` (tutti i moduli) | Layer futuro che usa engine.ts | Documento successivo |
| Stringhe di dominio in `locales/it.ts` | Aggiunte da ogni modulo announcements/ | Documento successivo |
| Integrazione architetturale di `detection.ts` nei provider applicativi (mount completo, consumo di `talkBackState`/`adaptations` lato UI) | Fuori perimetro engine | Documento successivo (DESIGN 004) |
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
| R7 | `src/lib/screen-reader.ts` contiene `initializeLiveRegions()` senza guard DOM (`document.createElement`, `aria-live`, `document.body`). Il file è browser-bound e incompatibile con React Native. Per tutta la durata di DESIGN 003 il file rimane fisicamente presente (deletion differita, vedi §7.3) e qualsiasi path runtime che invoca `useScreenReader().announce*()` produce `ReferenceError: document is not defined` con crash dell'albero React. | Alta | Alto | Il file viene rimosso e riscritto come parte del flusso DESIGN 003 + DESIGN 004; nessun nuovo consumer di `screen-reader.ts` viene introdotto in questo documento. **Nota operativa attiva, obbligatoria per tutta la durata di DESIGN 003**: non testare i path PIN e sblocco conto privato (`unlockPrivate`, `setPin`, `changePin`, `removePin`) finché DESIGN 003 non è completato. La nota rimane attiva fino al gate finale di DESIGN 004. Dipendenza: ciclo DESIGN 003 + DESIGN 004. |

---

## 11. Note per Agent-Plan

### Sequenza commit raccomandata

> **Sequenza commit estratta nel coding plan:** [003-PLAN_fix-accessibility-engine_v1.0.0.md](../3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md) — Sezione **Sezione 5 (Sequenza commit)**

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

### Nota critica: detection.ts è codice quasi-orfano in questo documento

`src/accessibility/detection.ts` viene creato in questo documento e viene
esposto come modulo importabile. L'unico consumer applicativo in questo
documento è la singola riga di import in `src/context/AuthContext.tsx`
(Task 003.T6), strettamente necessaria per consentire la deletion di
`use-talkback.ts` (Task 003.T7) senza rompere la build. Nessun altro
file importa `useAccessibilityDetection()` al termine di questo documento.

Questo è intenzionale e corretto.

L'integrazione architetturale completa di `detection.ts` nei React Provider
(consumo runtime di `talkBackState`/`adaptations`, propagazione alle UI,
attivazione delle adattazioni) avviene nel documento successivo destinato
a `src/announcements/`. Qui ci limitiamo alla sostituzione minimale
dell'import — non viene introdotto alcun nuovo comportamento applicativo.

Agent-Plan non deve tentare di montare consumer aggiuntivi di
`detection.ts` nei context per "vederlo funzionare" oltre la singola
sostituzione di import — farlo violerebbe il perimetro e anticiperebbe
lavoro che appartiene al documento successivo.

Il modulo è verificabile autonomamente tramite un componente di test
temporaneo montato in `App.tsx` (come descritto nel Gate 3 della Sezione 8),
che va rimosso dopo la verifica prima del commit.

### Nota critica: import chain da `useUserSettings`

`detection.ts` importa `useUserSettings` da `@/context/UserSettingsContext`.
Verificare che `talkBackManualOverride` e le sue setter siano presenti in
`UserSettings` e esposte da `useUserSettings()`. Se non fossero presenti:
aggiungerle prima di creare `detection.ts` (blocco di questo commit).

Eseguire prima (grep estratto nel coding plan — vedere [003-PLAN_fix-accessibility-engine_v1.0.0.md](../3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md), Task **003.T3**):

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
