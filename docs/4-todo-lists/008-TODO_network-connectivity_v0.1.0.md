---
tipo: todo-list
titolo: TODO operativa — Network connectivity (PLAN 008)
versione: 0.1.0
data: 2026-05-25
stato: IMPLEMENTED
plan: docs/3-coding-plans/008-PLAN_network-connectivity_v0.1.0.md
design: docs/2-projects/008-DESIGN_network-connectivity_v0.1.0.md
strategia: Strategia A — migrazione completa (file `use-online-status.ts` eliminato, 0 consumer verificati)
ramo: main
---

# TODO 008 — Network connectivity — checklist operativa

> **ATTENZIONE — leggere prima di iniziare**:
>
> 1. Fonte normativa: ogni task qui sotto deriva da
>    [PLAN 008](../3-coding-plans/008-PLAN_network-connectivity_v0.1.0.md).
>    In caso di discrepanza, **il PLAN prevale**. Aggiornare il PLAN
>    prima di divergere.
> 2. **Branch obbligatorio: `main`**. Nessun branch alternativo.
>    Eseguire `git status` prima di ogni commit.
> 3. **Non-regressione DESIGN 007**: i simboli `transitionTo`,
>    `hydrationGen`, `applyDomainSnapshot`, `readCachedDomainSnapshot`,
>    `writeCache`, `hydrateFromCache` e la state machine bootstrap
>    sono **invariati**. L'unica modifica ammessa a
>    `src/context/AppDataContext.tsx` è la sostituzione dei due check
>    inline `navigator.onLine === false` (righe 354 e 415) con il
>    consumo di `useNetworkStatus().isOffline`.
> 4. **Strategia A**: il file `src/hooks/use-online-status.ts` viene
>    **eliminato**. Nessun alias, nessun wrapper. Verifica preliminare
>    di assenza consumer **obbligatoria** prima di T3 (vedi NOTA 4).
> 5. **Fail-Safe Online-First**: il provider non deve mai propagare
>    `isOffline = true` per un fallimento del meccanismo di
>    rilevamento (INV-4 del PLAN). Il caso "NetInfo non risponde" è
>    trattato come online.
> 6. **Debounce direzionale**: solo online → offline. La direzione
>    inversa è immediata. Mai applicare debounce simmetrico.

---

## Snapshot

- **Data apertura**: 2026-05-25
- **Branch**: `main`
- **Stato attuale**: DRAFT (in attesa di esecuzione T1)
- **Tasks**: 8 (T1 → T8)
- **Gate**: 8 (G1 → G8) — vedi PLAN 008 §7
- **Invarianti**: 7 (INV-1 → INV-7) — vedi PLAN 008 §5

---

## Precondizioni di gate (verifica una tantum)

| # | Precondizione | Comando di verifica | Esito atteso | Status |
|---|--------------|---------------------|--------------|--------|
| P1 | DESIGN 001 MERGED | `grep -n "DESIGN 001" docs/todo-master.md` | IMPLEMENTED | [x] VERIFIED — 2026-05-25 — confermato da utente |
| P2 | DESIGN 002 MERGED | `grep -n "DESIGN 002" docs/todo-master.md` | IMPLEMENTED | [x] VERIFIED — 2026-05-25 — confermato da utente |
| P3 | DESIGN 007 REVIEWED+ | Frontmatter `docs/2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md` | `stato: REVIEWED` o successivo | [x] VERIFIED — 2026-05-25 — stato: REVIEWED (comando Select-String confermato) |
| P4 | DESIGN 008 REVIEWED | Frontmatter `docs/2-projects/008-DESIGN_network-connectivity_v0.1.0.md` | `stato: REVIEWED` | [x] |
| P5 | Consumer di `useOnlineStatus` = 0 | `grep -R "useOnlineStatus" src/`; `grep -R "use-online-status" src/` | 0 occorrenze entrambi | [x] (verificato Fase 0) |
| P6 | Branch corrente = `main` | `git branch --show-current` | `main` | [x] VERIFIED — 2026-05-25 — comando git branch --show-current: main |
| P7 | Working tree pulito | `git status --short` | (vuoto) o solo file di lavoro autorizzati | [x] VERIFIED — 2026-05-25 — file di lavoro rimosso dal tracciamento Git |

> Se anche una sola precondizione non è soddisfatta: **STOP**, risolvere
> e ripetere la verifica. Non passare a T1.

---

## Stato Task (riassunto tabellare)

| Task | Titolo | File principali | Status | Commit |
|------|--------|-----------------|--------|--------|
| T1 | Installazione NetInfo | `package.json`, `package-lock.json` | [x] | — |
| T2 | Provider + hook | `src/context/NetworkStatusContext.tsx`, `src/hooks/use-network-status.ts` | [x] | — |
| T3 | Eliminazione vecchio hook | `src/hooks/use-online-status.ts` (rimosso) | [x] | — |
| T4 | Sostituzione check inline | `src/context/AppDataContext.tsx` (righe 354 e 415) | [x] | — |
| T5 | Posizionamento provider | `App.tsx` | [x] | — |
| T6 | Test nuovi (4 scenari + fail-safe + cleanup) | `__tests__/use-network-status.spec.ts` | [x] | — |
| T7 | Conversione `it.todo` consumer | `__tests__/AppDataContext.spec.ts` | [x] (nessuna conversione necessaria, vedi NOTA T7) | — |
| T8 | Full suite + tsc baseline | `__tests__/**`, `jest.config.js` | [x] | — |

> **NOTA T7**: nessuno degli `it.todo` presenti in
> `__tests__/AppDataContext.spec.ts` dipende specificamente dal
> contratto rete del PLAN 008 — sono scenari di state machine
> bootstrap già etichettati come "fuori scope PLAN 007" (riga 13)
> perché richiedono l'introduzione di `@testing-library/react`.
> Annotazione lasciata in cima al file di test.
>
> **NOTA iOS**: per Android l'autolinking di NetInfo avviene al
> prossimo build; per iOS il maintainer deve eseguire
> `cd ios && bundle exec pod install && cd ..` prima del primo
> `npm run ios`. macOS non disponibile in sessione, comando NON
> eseguito.
>
> **NOTA Jest globale**: `jest.config.js` è stato esteso con un
> `moduleNameMapper` su `@react-native-community/netinfo` puntato al
> mock ufficiale `node_modules/.../jest/netinfo-mock.js`. Necessario
> perché `__tests__/App.test.tsx` monta l'App reale che ora include
> `NetworkStatusProvider`. Il test dedicato
> `__tests__/use-network-status.spec.ts` sovrascrive il mock con un
> `jest.mock` locale per esporre l'utility `triggerNetInfo`.

---

## Task atomici dettagliati

### T1 — Installazione `@react-native-community/netinfo`

- [ ] Verificare versione React Native installata:
      `node -p "require('./package.json').dependencies['react-native']"`.
- [ ] Verificare compatibilità NetInfo con quella RN (consultare CHANGELOG
      ufficiale NetInfo se necessario).
- [ ] Eseguire `npm install @react-native-community/netinfo`.
- [ ] Verificare che `package.json` ora contenga la dipendenza:
      `node -p "require('./package.json').dependencies['@react-native-community/netinfo']"`.
- [ ] **Annotazione manuale per maintainer**: per iOS, eseguire
      `cd ios && bundle exec pod install && cd ..`. Per Android, nessuna
      azione (autolinking RN 0.74+).
- [ ] Verificare TypeScript: `npx tsc --noEmit` exit code 0 (entro
      baseline ≤ 3 errori; vedi NOTA 1).

> **NOTA QA T1**: la libreria NetInfo non deve essere importata in nessun
> file applicativo in T1. L'unico import previsto è in T2 dentro
> `NetworkStatusContext.tsx`. Eventuali import precoci in altri file
> sono una violazione di INV-1.

### T2 — Creazione `NetworkStatusProvider` + `useNetworkStatus`

- [ ] Creare `src/context/NetworkStatusContext.tsx`.
- [ ] Definire e **esportare** il tipo `NetworkStatus`:
      `{ isOffline, isConnected, isInternetReachable, connectionType, isInitialized }`.
- [ ] Creare il context `NetworkStatusContext = createContext<NetworkStatus | null>(null)`.
- [ ] Implementare `NetworkStatusProvider({ children })`:
  - [ ] Stato iniziale: `{ isOffline: false, isConnected: false, isInternetReachable: false, connectionType: 'unknown', isInitialized: false }`.
  - [ ] `useEffect` con `NetInfo.addEventListener(handler)` in `try/catch`.
  - [ ] Su eccezione subscribe → Fail-Safe Online-First +
        `console.warn('[NetworkStatusProvider] NetInfo subscribe failed', error)`.
  - [ ] Timer di inizializzazione 1500 ms: se nessun evento entro il
        timeout → Fail-Safe Online-First + warning.
  - [ ] Handler eventi: calcolo `isOffline` secondo INV-7
        (captive portal = offline; `isInternetReachable === null` =
        online-first).
  - [ ] Debounce 1000 ms **solo** sulla direzione online → offline
        (vedi NOTA 2).
  - [ ] `isInitialized = true` al primo evento NetInfo ricevuto.
  - [ ] `isMountedRef = useRef(true)` + guard prima di ogni `setState`.
  - [ ] Cleanup: `unsubscribe()` + `clearTimeout` di tutti i timer
        attivi + `isMountedRef.current = false`.
- [ ] Creare `src/hooks/use-network-status.ts`:
  - [ ] `useContext(NetworkStatusContext)` + throw se `null` (vedi NOTA 3).
- [ ] Verifica TypeScript: `npx tsc --noEmit` entro baseline.
- [ ] Verifica `grep -RnE "import NetInfo from" src/`:
      esattamente 1 occorrenza in `src/context/NetworkStatusContext.tsx`.

> **NOTA QA T2**: non re-implementare il debounce in `useNetworkStatus`
> né in nessun consumer. Il debounce è una proprietà del **provider**
> (INV-3). Se un consumer ha bisogno di una "vista" del segnale,
> deve consumare il context grezzo via hook, mai trasformarlo
> ulteriormente.

### T3 — Eliminazione `src/hooks/use-online-status.ts`

- [ ] **Verifica preliminare obbligatoria** (vedi NOTA 4):
      `grep -R "useOnlineStatus" src/` → 0 occorrenze;
      `grep -R "use-online-status" src/` → 0 occorrenze.
      Se anche una sola occorrenza è trovata: **STOP**, aggiornare prima
      i consumer.
- [ ] Eliminare il file `src/hooks/use-online-status.ts`
      (in VS Code: tasto destro → Delete; in shell: `git rm src/hooks/use-online-status.ts`).
- [ ] Verifica post-eliminazione: `test ! -f src/hooks/use-online-status.ts && echo OK`.
- [ ] `npx tsc --noEmit` entro baseline.

### T4 — Sostituzione check inline `navigator.onLine` in `AppDataContext.tsx`

- [ ] Aggiungere import: `import { useNetworkStatus } from '@/hooks/use-network-status'`.
- [ ] Nel body di `AppDataProvider`, dopo `useAuth()`, aggiungere:
      `const { isOffline, isInitialized: isNetworkInitialized } = useNetworkStatus()`.
- [ ] **Riga 354** (oggi `if (typeof navigator !== 'undefined' && navigator.onLine === false) { ... }`
      dentro `loadBootstrapData`): sostituire con
      `if (isOffline) { await hydrateFromCache(user.id, myGen); return }`.
- [ ] **Riga 415** (stessa forma, dentro `reloadData`): sostituire con
      `if (isOffline) { await hydrateFromCache(userId, myGen); return }`.
- [ ] Nel primo `useEffect` di bootstrap, aggiungere early return
      `if (!isNetworkInitialized) return` **prima** di leggere `isOffline`
      (vedi NOTA 5).
- [ ] Aggiornare le dipendenze dei `useCallback`/`useEffect` toccati
      includendo `isOffline` e `isNetworkInitialized` **solo dove
      `react-hooks/exhaustive-deps` lo richiede**. Non ampliare il
      perimetro alle altre logiche.
- [ ] Verifica `grep -n "navigator.onLine" src/context/AppDataContext.tsx`
      → 0 occorrenze.
- [ ] Verifica non-regressione DESIGN 007: il numero di occorrenze di
      `transitionTo|hydrationGen|applyDomainSnapshot|readCachedDomainSnapshot`
      in `AppDataContext.tsx` resta **invariato** rispetto al commit
      precedente (vedi NOTA 6).
- [ ] `npx tsc --noEmit` entro baseline.

### T5 — Posizionamento provider in `App.tsx`

- [ ] Aggiungere import:
      `import { NetworkStatusProvider } from '@/context/NetworkStatusContext'`.
- [ ] Modificare albero JSX:
      ```tsx
      <SafeAreaProvider>
        <StatusBar ... />
        <NetworkStatusProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </NetworkStatusProvider>
      </SafeAreaProvider>
      ```
- [ ] Verifica visiva manuale: `<NetworkStatusProvider>` è ancestor di
      `<AuthProvider>`.
- [ ] Verifica strumentale: `grep -nE "NetworkStatusProvider|AuthProvider" App.tsx`
      mostra `NetworkStatusProvider` con numero di riga inferiore a
      `AuthProvider`.
- [ ] `npx tsc --noEmit` entro baseline.

### T6 — Suite test `__tests__/use-network-status.spec.ts`

- [ ] Creare il file.
- [ ] Setup mock: `jest.mock('@react-native-community/netinfo', ...)` con
      handler `addEventListener` che cattura il callback e ne consente
      l'invocazione manuale.
- [ ] Setup `jest.useFakeTimers()`.
- [ ] **Scenario 1 — Online**: callback invocato con
      `{ isConnected: true, isInternetReachable: true }` →
      `result.current.isOffline === false`, `result.current.isInitialized === true`.
- [ ] **Scenario 2 — Offline confermato**: callback con
      `{ isConnected: false, isInternetReachable: false }` →
      `result.current.isOffline === true`.
- [ ] **Scenario 3 — Offline incerto (captive portal)**: callback con
      `{ isConnected: true, isInternetReachable: false }` →
      `result.current.isOffline === true` (INV-7).
- [ ] **Scenario 4 — Flapping con debounce**:
  - sub-test a) online → offline → online entro 500 ms →
    `isOffline` non passa mai a `true`;
  - sub-test b) online → offline e attesa 1100 ms →
    `isOffline === true` dopo il timer.
- [ ] **Scenario 5 — Fail-Safe Online-First**: `addEventListener` mock
      lancia eccezione → `isOffline === false`, `isInitialized === true`,
      `connectionType === 'unknown'`, `console.warn` invocato.
- [ ] **Scenario 6 — Cleanup**: unmount del provider invoca la funzione
      `unsubscribe` mock; verificare via spy che nessun `setState`
      avvenga dopo l'unmount (es. invocando il callback NetInfo dopo
      unmount non deve causare warning React).
- [ ] Eseguire `npx jest __tests__/use-network-status.spec.ts`: exit 0.
- [ ] Verifica: 0 `it.todo` residui nel file.

> **NOTA QA T6**: i 4 scenari obbligatori (1, 2, 3, 4) derivano da
> DESIGN 008 §5 e §6. Gli scenari 5 e 6 derivano rispettivamente da
> INV-4 e dalla regola "no `setState` after unmount". Non comprimere
> i 4 scenari obbligatori in test unici.

### T7 — Conversione `it.todo` in `__tests__/AppDataContext.spec.ts`

- [ ] `grep -nE "it\.todo|test\.todo" __tests__/AppDataContext.spec.ts`
      per censire i `it.todo` esistenti.
- [ ] Per ogni `it.todo` che dipende dal contratto rete (es. simulazione
      offline tramite `navigator.onLine = false` o stub equivalente):
  - [ ] Convertirlo in `it(...)` eseguibile.
  - [ ] Mockare `@/hooks/use-network-status` con
        `jest.mock('@/hooks/use-network-status', () => ({ useNetworkStatus: () => ({ isOffline: true, isConnected: false, isInternetReachable: false, connectionType: 'none', isInitialized: true }) }))`.
  - [ ] Verificare che il flusso offline-first di `loadBootstrapData`
        sia esercitato (chiamata a `hydrateFromCache`).
- [ ] Se nessun `it.todo` esistente dipende dal contratto rete:
      annotare nel commit message "T7: nessuna conversione necessaria"
      e procedere a T8.
- [ ] `npx jest __tests__/AppDataContext.spec.ts`: exit 0.

> **NOTA QA T7**: PLAN 008 **non** introduce nuovi `it.todo` né nuovi
> scenari su `AppDataContext.spec.ts` oltre a quanto già previsto da
> PLAN 007. T7 è una conversione, non una creazione.

> **[NOTA T7]** Esito da compilare a conclusione del task:
> indicare "zero anomalie" oppure elenco anomalie rilevate.

### T8 — Full suite + verifica baseline tsc

- [ ] `npx jest` (intera suite). Exit code 0.
- [ ] `npx tsc --noEmit`. Errori ≤ baseline (3). I nuovi file non
      contribuiscono errori aggiuntivi.
- [ ] Verifica manuale che la suite di crypto, ExportService e App.test
      continuino a passare (non-regressione).
- [ ] Verifica tutti gli 8 gate di chiusura (sezione "Gate di chiusura"
      sotto).

---

## Note operative

### NOTA 1 — Baseline TypeScript

La baseline corrente di `npx tsc --noEmit` su `main` è ≤ 3 errori
(verificata il 2026-05-25; il valore precedente di 8 era una stima
derivata da PLAN 007 NOTA 1 non basata su misurazione reale).
PLAN 008 non deve aumentarla. I file
nuovi `src/context/NetworkStatusContext.tsx` e
`src/hooks/use-network-status.ts` devono compilare senza errori.

### NOTA 2 — Implementazione debounce direzionale

Schema di riferimento (pseudocodice da adattare in T2):

```ts
const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
const lastEmittedOfflineRef = useRef<boolean>(false)

function applyState(next: NetworkStatus) {
  if (next.isOffline === lastEmittedOfflineRef.current) {
    setState(next) // pari direzione, no debounce su altri campi
    return
  }
  if (next.isOffline === false) {
    // offline -> online: immediato
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    lastEmittedOfflineRef.current = false
    setState(next)
    return
  }
  // online -> offline: debounce 1000ms
  if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
  debounceTimerRef.current = setTimeout(() => {
    if (!isMountedRef.current) return
    lastEmittedOfflineRef.current = true
    setState(next)
    debounceTimerRef.current = null
  }, 1000)
}
```

Il pseudocodice è indicativo; l'implementazione deve passare i test
di T6 (in particolare gli scenari 4a/4b).

### NOTA 3 — Throw su context `null`

`useNetworkStatus` deve sollevare un errore esplicito se invocato fuori
dal provider. Questo è preferibile al "default safe value" perché un
consumer fuori dal provider è un bug di wiring che va scoperto in
sviluppo, non mascherato in produzione (DESIGN 008 §4).

### NOTA 4 — Verifica consumer pre-eliminazione (Strategia A)

La Strategia A assume zero consumer esterni di `useOnlineStatus`.
La verifica è stata eseguita in Fase 0 (esito: 0 occorrenze). Va
**ripetuta** immediatamente prima di T3 per intercettare eventuali
commit intermedi che abbiano reintrodotto consumer durante
l'esecuzione di T1-T2.

### NOTA 5 — Attesa `isInitialized`

Durante la finestra di inizializzazione del provider (~ primi 50-150 ms
del bootstrap), `isInitialized === false`. In quella finestra, leggere
`isOffline` è prematuro: potrebbe restituire il valore iniziale
(`false`) che non rappresenta lo stato reale. Per questo T4 richiede
un early return `if (!isNetworkInitialized) return` prima del check su
`isOffline` dentro il primo `useEffect` di bootstrap. Lo stato
`HYDRATING` resta corretto: l'`useEffect` verrà rieseguito quando
`isNetworkInitialized` passa a `true` (essendo nelle dipendenze).

### NOTA 6 — Verifica non-regressione DESIGN 007

Prima di T4, eseguire:

```bash
grep -cE "transitionTo|hydrationGen|applyDomainSnapshot|readCachedDomainSnapshot|writeCache" src/context/AppDataContext.tsx
```

Annotare il valore N nel commit message di chiusura T4. Dopo T4
ri-eseguire lo stesso grep: il valore deve essere identico (eventuale
variazione ≤ 0). Se variazione > 0, PLAN 008 ha sconfinato in
perimetro DESIGN 007: rollback e ripetizione.

### NOTA 7 — Mock NetInfo nei test

Il mock di `@react-native-community/netinfo` va dichiarato a livello
file di test (`jest.mock(...)` in cima). Esempio minimo:

```ts
let netInfoHandler: ((state: any) => void) | null = null
const unsubscribe = jest.fn()

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn((handler) => {
      netInfoHandler = handler
      return unsubscribe
    }),
    fetch: jest.fn(),
  },
}))

function triggerNetInfo(state: { isConnected: boolean | null; isInternetReachable: boolean | null; type?: string }) {
  if (netInfoHandler) netInfoHandler(state)
}
```

### NOTA 8 — Commit message convention

Ogni task T1-T8 genera **un commit dedicato** sul branch `main`.
Esempio:

- T1: `chore(deps): install @react-native-community/netinfo (PLAN 008 T1)`
- T2: `feat(network): add NetworkStatusProvider and useNetworkStatus hook (PLAN 008 T2)`
- T3: `refactor(network): remove deprecated use-online-status hook (PLAN 008 T3)`
- T4: `refactor(app-data): replace navigator.onLine with useNetworkStatus (PLAN 008 T4)`
- T5: `feat(app): wire NetworkStatusProvider above AuthProvider (PLAN 008 T5)`
- T6: `test(network): add 6-scenario coverage for useNetworkStatus (PLAN 008 T6)`
- T7: `test(app-data): convert it.todo to executable network-mock tests (PLAN 008 T7)`
- T8: `chore(plan-008): close PLAN 008 — full suite green, gates verified`

---

## Log Validazione

| Data | Blocco | Agente | Esito | Note |
|------|--------|--------|-------|------|
| 2026-05-25 | Pre-flight P1-P7 | Copilot | ✅ COMPLETATO | Sessione: pre-flight PLAN 008 — Agente: Copilot — tutte le precondizioni verificate, baseline TS aggiornata da 8 a 3 |
| 2026-05-25 | Esecuzione T1-T8 | Copilot | ✅ COMPLETATO | Autonomia concessa fino a G8. T1 NetInfo ^12.0.1 installato; T2 Provider+hook creati; T3 hook deprecato rimosso (git rm); T4 due check `navigator.onLine` sostituiti con `isOffline` da `useNetworkStatus`; T5 `NetworkStatusProvider` montato sopra `AuthProvider`; T6 7 test verdi (6 scenari + split 4a/4b); T7 nessuna conversione necessaria; T8 7/7 suite verdi, 26 test, 39 todo preservati. TSC = 3 (baseline). `jest.config.js` esteso con `moduleNameMapper` su NetInfo mock ufficiale. iOS pod install RICHIESTO al maintainer (non eseguito, macOS non disponibile). |

---

## Gate di chiusura

Rispecchia PLAN 008 §7. Spuntare solo dopo verifica strumentale.

- [x] **G1** — `npx tsc --noEmit` exit code 0 o errori ≤ baseline (3). → 3 errori = baseline.
- [x] **G2** — `grep -RnE "navigator\.onLine" src/` → 0 occorrenze (INV-1).
- [x] **G3** — `grep -RnE "addEventListener\(['\"](online|offline)['\"]" src/` → 0 occorrenze (INV-1).
- [x] **G4** — `grep -RnE "NetInfo\.addEventListener|NetInfo\.fetch" src/`
              → solo in `src/context/NetworkStatusContext.tsx` (INV-1, INV-2).
- [x] **G5** — `test ! -f src/hooks/use-online-status.ts`;
              `grep -R "useOnlineStatus" src/` → 0;
              `grep -R "use-online-status" src/` → 0.
- [x] **G6** — `App.tsx`: `NetworkStatusProvider` ancestor di
              `AuthProvider` (INV-5).
- [x] **G7** — Boundary DESIGN 007: conteggio simboli PLAN 007 in
              `AppDataContext.tsx` invariato (INV-6). Nessuna delle 5
              keyword PLAN 007 (`transitionTo`, `hydrationGen`,
              `applyDomainSnapshot`, `readCachedDomainSnapshot`,
              `writeCache`) è stata rimossa o rinominata; il T4 ha
              aggiunto solo `useNetworkStatus` + early-return
              `if (!isNetworkInitialized) return` + sostituzione dei
              due controlli `navigator.onLine` con `isOffline`.
- [x] **G8** — `npx jest` exit code 0; nuovi test T6 ≥ 6 passanti
              (7 verdi: 6 scenari + split 4a/4b).

---

## Riferimenti

- PLAN: [docs/3-coding-plans/008-PLAN_network-connectivity_v0.1.0.md](../3-coding-plans/008-PLAN_network-connectivity_v0.1.0.md)
- DESIGN 008: [docs/2-projects/008-DESIGN_network-connectivity_v0.1.0.md](../2-projects/008-DESIGN_network-connectivity_v0.1.0.md)
- DESIGN 007 (boundary): [docs/2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md](../2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md)
- PLAN 007 (boundary): [docs/3-coding-plans/007-PLAN_async-cache-hydration_v0.1.0.md](../3-coding-plans/007-PLAN_async-cache-hydration_v0.1.0.md)
- TODO 007: [docs/4-todo-lists/007-TODO_async-cache-hydration_v0.1.0.md](007-TODO_async-cache-hydration_v0.1.0.md)
- API docs: [docs/api.md](../api.md)
- CHANGELOG: [CHANGELOG.md](../../CHANGELOG.md)
