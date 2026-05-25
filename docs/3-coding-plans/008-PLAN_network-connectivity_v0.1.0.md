---
tipo: coding-plan
titolo: Network connectivity — sostituzione browser detection con NetInfo
versione: 0.1.0
data: 2026-05-25
stato: DRAFT
design: docs/2-projects/008-DESIGN_network-connectivity_v0.1.0.md
dipendenze: DESIGN 001, DESIGN 002, DESIGN 007
perimetro: src/hooks/use-network-status.ts (nuovo), src/hooks/use-online-status.ts (rimosso), src/context/NetworkStatusContext.tsx (nuovo), src/context/AppDataContext.tsx, App.tsx, __tests__/use-network-status.spec.ts (nuovo)
ramo: main
---

# PLAN 008 — Network connectivity — sostituzione browser detection con NetInfo

> **Fonte di verità**: ogni decisione tecnica di questo piano è derivata
> da
> [docs/2-projects/008-DESIGN_network-connectivity_v0.1.0.md](../2-projects/008-DESIGN_network-connectivity_v0.1.0.md).
> In caso di discrepanza, il documento di design prevale.
>
> **Strategia di migrazione adottata**: **STRATEGIA A — migrazione completa**.
> Il file `src/hooks/use-online-status.ts` viene eliminato. Non è
> necessario alcun alias di compatibilità: il vecchio simbolo
> `useOnlineStatus` non è importato da nessun file in `src/**`
> (verificato via `grep -R "useOnlineStatus" src/` e
> `grep -R "use-online-status" src/`, esito: 0 occorrenze).

---

## 1. Obiettivo

Sostituire il rilevamento di connettività attualmente basato su
`navigator.onLine` e `window.addEventListener('online'|'offline')` —
non funzionante in React Native (Hermes su Android/iOS, polyfill su
Windows) — con un *connectivity contract* centralizzato basato su
`@react-native-community/netinfo`, esposto come `NetworkStatusProvider`
e hook pubblico `useNetworkStatus`.

Esito atteso al termine di PLAN 008:

- Una singola subscription NetInfo attiva nell'applicazione, montata da
  `NetworkStatusProvider` posizionato sopra `AuthProvider` (e sopra
  `AppDataProvider` quando questo verrà aggiunto a `App.tsx`).
- Hook pubblico `useNetworkStatus()` che restituisce un valore
  conforme al contratto definito in DESIGN 008 §5:
  `{ isOffline, isConnected, isInternetReachable, connectionType, isInitialized }`.
- Debounce direzionale 1000 ms applicato esclusivamente alle
  transizioni online → offline; offline → online propagato
  immediatamente.
- Fallback Fail-Safe Online-First per Windows e per qualunque
  fallimento del meccanismo di rilevamento (DESIGN 008 §7).
- Eliminazione completa di `src/hooks/use-online-status.ts`.
- Rimozione dei due check inline `navigator.onLine === false` in
  `src/context/AppDataContext.tsx` (righe 354 e 415, identificate
  in lettura Fase 0) e sostituzione con consumo di
  `useNetworkStatus().isOffline`.
- Suite di test eseguibili a copertura dei 4 scenari del contratto
  (online, offline confermato, offline incerto/captive portal,
  flapping con debounce).

Effetto utente atteso: il ramo offline-first del bootstrap descritto
in DESIGN 007 §7 Caso 4 si attiva correttamente su Android, iOS e
Windows quando la rete è genuinamente assente; il falso-positivo
"online permanente" del codice attuale viene eliminato; la captive
portal viene trattata come offline (DESIGN 008 §5).

---

## 2. Precondizioni

L'implementazione di questo piano può iniziare solo dopo che **tutte**
le precondizioni seguenti sono soddisfatte e mergiate su `main`.
Verifica già completata in Fase 0 e annotata nel prompt del committente:

| Precondizione | Stato | Verifica |
|---------------|-------|----------|
| DESIGN 001 — Fix blocchi avvio: alias `@/*` funzionante | ✅ MERGED | `grep -nE "DESIGN 001" docs/todo-master.md` → IMPLEMENTED |
| DESIGN 002 — Fix provider bootstrap: `AuthProvider` stabile | ✅ MERGED | `grep -nE "DESIGN 002" docs/todo-master.md` → IMPLEMENTED |
| DESIGN 007 — Async cache hydration: stato `REVIEWED` o successivo | ✅ REVIEWED | Frontmatter `docs/2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md` |
| DESIGN 008 — Network connectivity: stato `REVIEWED` | ✅ REVIEWED | Frontmatter `docs/2-projects/008-DESIGN_network-connectivity_v0.1.0.md` |
| Consumer del vecchio simbolo `useOnlineStatus` nel codebase | ✅ 0 trovati | `grep -R "useOnlineStatus" src/` → 0; `grep -R "use-online-status" src/` → 0 |

Se anche una sola precondizione fallisce: **STOP**, non scrivere alcuna
riga di codice di PLAN 008.

---

## 3. Stato atteso del codice all'inizio di questo PLAN

> Sezione descrittiva dello stato **corrente** dei file in perimetro,
> prima di qualsiasi modifica prevista da questo PLAN. I numeri di
> riga sono indicativi e possono variare di pochi offset.

### 3.1 `src/hooks/use-online-status.ts` (file da eliminare)

24 righe. Espone l'unico simbolo `useOnlineStatus()` con shape di
ritorno `{ isOffline: boolean }`:

- `getInitialOfflineState()`: guard `if (typeof navigator === 'undefined')`
  + lettura sincrona `navigator.onLine === false`. Su Hermes il guard
  non scatta perché `navigator` esiste come polyfill (DESIGN 008 §2.A).
- `useEffect` con `window.addEventListener('online'|'offline', ...)`:
  gli eventi non vengono mai emessi su React Native; `isOffline` resta
  bloccato sul valore iniziale per tutta la vita del componente.
- Cleanup: `window.removeEventListener` per entrambi gli eventi.

Nessun consumer interno (verificato Fase 0).

### 3.2 `src/context/AppDataContext.tsx` (rimozione check inline)

Due occorrenze testualmente identiche di
`if (typeof navigator !== 'undefined' && navigator.onLine === false) { ... }`:

1. **Riga 354**, dentro `loadBootstrapData` del primo `useEffect` di
   bootstrap (perimetro DESIGN 007 §7 Caso 4). Quando vera, invoca
   `await hydrateFromCache(user.id, myGen)` e `return`.
2. **Riga 415**, dentro `reloadData` di `refreshAll`. Stessa semantica
   e identica forma.

Su React Native nessuna delle due condizioni è mai vera oggi, quindi
il ramo offline-first del bootstrap non si attiva. Il sostituto deve
essere `useNetworkStatus().isOffline`, letto via hook nel body del
provider e passato come dipendenza degli `useEffect`/`useCallback`
coinvolti.

### 3.3 `App.tsx` (posizionamento provider)

Albero corrente:

```tsx
<SafeAreaProvider>
  <StatusBar ... />
  <AuthProvider>
    <AppContent />
  </AuthProvider>
</SafeAreaProvider>
```

`AppDataProvider` non è ancora montato nell'albero (situazione
documentale: il provider esiste come modulo ma il wiring in `App.tsx`
è perimetro futuro, non perimetro di PLAN 008).

`NetworkStatusProvider` deve essere posizionato **sopra `AuthProvider`**
(DESIGN 008 §4). Quando `AppDataProvider` verrà aggiunto, dovrà
necessariamente stare **sotto `NetworkStatusProvider`**. Questo
PLAN si occupa solo del primo posizionamento; il wiring di
`AppDataProvider` è fuori scope.

### 3.4 `package.json`

Dipendenza `@react-native-community/netinfo` **assente**.
T1 deve installarla.

### 3.5 Test esistenti

`grep -RE "use-online-status|useOnlineStatus|navigator\.onLine|addEventListener\(['\"]online" __tests__/` → 0 occorrenze.

Nessun test esistente referenzia il vecchio meccanismo. Nessuna
migrazione di test esistenti è richiesta da questo PLAN. T6 e T7
aggiungono solo nuovi test.

---

## 4. Perimetro

### 4.1 In scope (file toccati o creati)

| File | Operazione | Task |
|------|-----------|------|
| `package.json` / `package-lock.json` | aggiunta dipendenza `@react-native-community/netinfo` | T1 |
| `src/context/NetworkStatusContext.tsx` (nuovo) | creazione `NetworkStatusProvider` + tipo `NetworkStatus` | T2 |
| `src/hooks/use-network-status.ts` (nuovo) | creazione hook pubblico `useNetworkStatus()` | T2 |
| `src/hooks/use-online-status.ts` | **eliminazione** | T3 |
| `src/context/AppDataContext.tsx` | rimozione 2 check inline `navigator.onLine`, consumo `useNetworkStatus()` | T4 |
| `App.tsx` | inserimento `<NetworkStatusProvider>` sopra `<AuthProvider>` | T5 |
| `__tests__/use-network-status.spec.ts` (nuovo) | unit + integration test sui 6 scenari | T6 |
| `__tests__/AppDataContext.spec.ts` | conversione/aggiunta di `it.todo` esistenti che dipendono dal contratto rete | T7 |

### 4.2 Fuori scope (esplicito)

- Componenti UI per stato offline (banner, spinner, messaggi visivi):
  perimetro futuro design UI.
- Logica di fallback alla cache, hydration, `refreshAll`, `writeCache`,
  state machine bootstrap, generation counter, validazione snapshot:
  perimetro esclusivo di **DESIGN 007 / PLAN 007**.
- Modifiche al modulo `src/lib/supabase/cache.ts` o ai repository:
  invariati.
- Retry logic applicativa e gestione errori specifici Supabase.
- Wiring di `AppDataProvider` in `App.tsx`: fuori scope (oggi non è
  presente in `App.tsx`; quando verrà aggiunto, dovrà essere
  posizionato sotto `NetworkStatusProvider`; PLAN 008 non lo wira).
- Sostituzione di `sonner` (B3 del report diagnosi): design dedicato.
- Sostituzione di `downloadFile` in `handleExportCSV` (N10 del report,
  DESIGN 009): perimetro separato.
- Annunci screen reader / haptic / sound legati al cambio di stato
  rete: perimetro DESIGN 004 (annunci) o futuro UI design.

---

## 5. Invarianti

Le invarianti seguenti sono normative per PLAN 008. Sono derivate
da DESIGN 008 §11 (INV-1 … INV-5) e da DESIGN 007 §11 nella parte
producer-consumer. Ogni gate della Sezione 7 ne copre almeno una.

### INV-1 — Provenienza unica del segnale (DESIGN 008 INV-3)

`isConnected`, `isInternetReachable`, `isOffline`, `connectionType` e
`isInitialized` derivano **esclusivamente** dal context di
`NetworkStatusProvider`. Nessun componente, hook o utility può
leggere `navigator.onLine`, registrare `window.addEventListener('online'|'offline')`,
o importare direttamente l'SDK di NetInfo.

### INV-2 — Subscription unica (DESIGN 008 INV-2)

Una sola subscription NetInfo è attiva per volta nell'applicazione.
`NetworkStatusProvider` la istanzia al mount e la rilascia all'unmount.
Nessun altro consumer crea subscription proprie.

### INV-3 — Debounce direzionale (DESIGN 008 INV-4)

Il debounce è gestito centralmente nel provider, ha valore 1000 ms,
e si applica **solo alle transizioni online → offline**. Le transizioni
offline → online sono propagate immediatamente. Il debounce non è
implementato nei consumer né nel hook `useNetworkStatus`.

### INV-4 — Fail-Safe Online-First (DESIGN 008 INV-5)

Se NetInfo fallisce (eccezione al subscribe, valori `null` persistenti,
timeout di inizializzazione), `NetworkStatusProvider` imposta
`isOffline = false`, `isConnected = true`, `isInternetReachable = true`,
`connectionType = 'unknown'`, `isInitialized = true`. Non è mai
ammesso un `isOffline = true` permanente per fallimento del
meccanismo di rilevamento.

### INV-5 — Posizione nell'albero (DESIGN 008 §4)

`NetworkStatusProvider` è posizionato in `App.tsx` **sopra**
`AuthProvider`. Quando `AppDataProvider` verrà aggiunto in
`App.tsx` (perimetro futuro), dovrà obbligatoriamente stare sotto
`NetworkStatusProvider`. Questa posizione è invariante: nessun
refactor di `App.tsx` può invertire l'ordine.

### INV-6 — Boundary producer-consumer con DESIGN 007 (DESIGN 008 §8)

DESIGN 008 produce il segnale; DESIGN 007 lo consuma. PLAN 008
**non** modifica la state machine bootstrap, il generation counter,
`writeCache`, `applyDomainSnapshot`, `readCachedDomainSnapshot` o
qualsiasi altro elemento di PLAN 007. L'unica modifica a
`AppDataContext.tsx` consentita da PLAN 008 è la sostituzione dei
due check inline `navigator.onLine === false` con il consumo del
nuovo contratto.

### INV-7 — Semantica `isOffline` (DESIGN 008 §5)

`isOffline = true` se e solo se almeno una di:
`isConnected === false || isConnected === null || isInternetReachable === false`.
`isOffline = false` se e solo se contemporaneamente:
`isConnected === true && (isInternetReachable === true || isInternetReachable === null)`.
Il caso `isInternetReachable === null` è online-first (non determinato).
Il caso captive portal (`isConnected = true`, `isInternetReachable = false`)
è trattato come `isOffline = true`.

---

## 6. Task in sequenza

I task vanno eseguiti nell'ordine indicato. Ogni task ha un criterio
di validazione locale (vedi anche gate Sezione 7).

### T1 — Installazione e verifica `@react-native-community/netinfo`

- **File**: `package.json`, `package-lock.json`.
- **Azione**:
  1. Verificare il `min_engine_version` compatibile con la versione di
     React Native installata (RN 0.74+ è il target attuale del progetto).
  2. Installare la libreria: `npm install @react-native-community/netinfo`.
  3. Per iOS: documentare la necessità di `bundle exec pod install`
     (esecuzione manuale da parte del maintainer, fuori dall'agente).
  4. Per Android: nessuna azione manuale richiesta su RN 0.74+ con
     autolinking.
  5. Verificare l'import in TypeScript: `import NetInfo from '@react-native-community/netinfo'`
     deve compilare senza errori.
- **Gate di accettazione T1**:
  - `node -p "require('./package.json').dependencies['@react-native-community/netinfo']"`
    restituisce una stringa di versione non `undefined`.
  - `npx tsc --noEmit` exit code 0 (o entro baseline ≤ 3, vedi Gate G1).
  - Annotazione manuale `pod install` documentata in TODO 008.

### T2 — Creazione `NetworkStatusProvider` e hook `useNetworkStatus`

- **File**:
  - `src/context/NetworkStatusContext.tsx` (nuovo).
  - `src/hooks/use-network-status.ts` (nuovo).
- **Azione**:
  1. Definire il tipo del contratto:
     ```ts
     export type NetworkStatus = {
       isOffline: boolean
       isConnected: boolean
       isInternetReachable: boolean
       connectionType: string
       isInitialized: boolean
     }
     ```
  2. Creare `NetworkStatusContext = createContext<NetworkStatus | null>(null)`.
  3. Implementare `NetworkStatusProvider({ children })` che:
     - All'avvio inizializza lo stato con `{ isConnected: false, isInternetReachable: false, isOffline: false, connectionType: 'unknown', isInitialized: false }`.
     - Esegue `NetInfo.addEventListener(callback)` dentro un
       `useEffect(() => { ... return unsubscribe }, [])`. Il subscribe
       deve essere avvolto in `try/catch`: in caso di eccezione,
       applicare Fail-Safe Online-First (vedi INV-4) e loggare
       `console.warn('[NetworkStatusProvider] NetInfo subscribe failed', error)`.
     - Avvia un timer di inizializzazione (1500 ms): se entro il
       timeout non è arrivato alcun evento NetInfo, applicare
       Fail-Safe Online-First.
     - Sull'evento NetInfo, traduce i campi `isConnected` e
       `isInternetReachable` nel contratto. Calcola `isOffline`
       secondo la semantica INV-7. Imposta `isInitialized = true`
       al primo evento ricevuto.
     - Applica debounce 1000 ms **solo** alle transizioni
       online → offline: registra un `setTimeout` quando il nuovo
       stato è offline e il precedente era online; se entro il
       timer arriva un evento online, cancella il timer. La
       transizione offline → online è immediata.
     - Cleanup completo all'unmount: invocazione di `unsubscribe`
       restituita da NetInfo + cancellazione di tutti i timer
       attivi (`clearTimeout` del debounce e del timer di
       inizializzazione).
     - **Nessun `setState` dopo l'unmount**: usare un ref
       `isMountedRef = useRef(true)` impostato a `false` nel cleanup,
       e fare guard prima di ogni `setState`.
  4. Implementare `useNetworkStatus()`:
     ```ts
     export function useNetworkStatus(): NetworkStatus {
       const ctx = useContext(NetworkStatusContext)
       if (ctx === null) {
         throw new Error('useNetworkStatus must be used within NetworkStatusProvider')
       }
       return ctx
     }
     ```
- **Gate di accettazione T2**:
  - I due file esistono e sono importabili via alias `@/context/NetworkStatusContext`
    e `@/hooks/use-network-status`.
  - Il tipo `NetworkStatus` espone esattamente i 5 campi del contratto.
  - `grep -nE "NetInfo\.addEventListener|NetInfo\.fetch" src/context/NetworkStatusContext.tsx`
    restituisce occorrenze solo dentro `useEffect` con cleanup.
  - `grep -RnE "import NetInfo from" src/` → solo
    `src/context/NetworkStatusContext.tsx`.
  - `npx tsc --noEmit` exit code 0 (entro baseline).

### T3 — Eliminazione `src/hooks/use-online-status.ts`

- **File**: `src/hooks/use-online-status.ts` (eliminazione).
- **Azione**:
  1. Ripetere il censimento pre-eliminazione:
     ```bash
     grep -R "use-online-status" src/
     grep -R "useOnlineStatus" src/
     ```
     Entrambi devono restituire 0 occorrenze. Se anche una sola
     occorrenza è trovata: **STOP**, aggiornare prima i consumer
     identificati.
  2. Eliminare il file `src/hooks/use-online-status.ts`.
  3. Riverificare `npx tsc --noEmit` per assenza di import rotti.
- **Gate di accettazione T3**:
  - Il file `src/hooks/use-online-status.ts` non esiste più.
  - `grep -R "useOnlineStatus" src/` → 0 occorrenze.
  - `grep -R "use-online-status" src/` → 0 occorrenze.
  - `npx tsc --noEmit` exit code 0 (entro baseline).

### T4 — Rimozione check inline `navigator.onLine` in `AppDataContext.tsx`

- **File**: `src/context/AppDataContext.tsx`.
- **Azione**:
  1. Importare il nuovo hook nel body del provider:
     `import { useNetworkStatus } from '@/hooks/use-network-status'`.
  2. Nel body di `AppDataProvider`, dopo `useAuth()`:
     `const { isOffline, isInitialized: isNetworkInitialized } = useNetworkStatus()`.
  3. Sostituire il check di riga **354** (dentro `loadBootstrapData`):
     - Da: `if (typeof navigator !== 'undefined' && navigator.onLine === false) { ... }`
     - A: `if (isOffline) { await hydrateFromCache(user.id, myGen); return }`
  4. Sostituire il check di riga **415** (dentro `reloadData`):
     - Da: stessa forma testuale.
     - A: `if (isOffline) { await hydrateFromCache(userId, myGen); return }`
  5. Aggiungere `isOffline` come dipendenza degli `useCallback` /
     `useEffect` toccati, **solo dove TypeScript / `react-hooks/exhaustive-deps`
     lo richiede**, senza ampliare il perimetro alle altre logiche.
  6. **Attesa di `isInitialized`**: nel primo `useEffect` di bootstrap,
     se `!isNetworkInitialized`, fare early return prima di leggere
     `isOffline`. Lo stato `HYDRATING` resta corretto durante l'attesa
     (DESIGN 008 §8).
  7. **Non toccare** nessun altro elemento del file: la state machine,
     `transitionTo`, `hydrationGen`, `applyDomainSnapshot`,
     `readCachedDomainSnapshot`, `hydrateFromCache`, `writeCache`,
     le validazioni strutturali, le costanti messaggio offline restano
     **invariate** (INV-6).
- **Gate di accettazione T4**:
  - `grep -n "navigator.onLine" src/context/AppDataContext.tsx` → 0 occorrenze.
  - `grep -n "useNetworkStatus" src/context/AppDataContext.tsx` → ≥ 1 occorrenza.
  - `grep -nE "transitionTo|hydrationGen|applyDomainSnapshot|readCachedDomainSnapshot"
    src/context/AppDataContext.tsx` → conteggio invariato rispetto allo
    stato pre-PLAN 008.
  - `npx tsc --noEmit` exit code 0 (entro baseline).

### T5 — Posizionamento `NetworkStatusProvider` in `App.tsx`

- **File**: `App.tsx`.
- **Azione**: modificare l'albero dei provider:
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
  Import: `import { NetworkStatusProvider } from '@/context/NetworkStatusContext'`.
- **Gate di accettazione T5**:
  - In `App.tsx`, `<NetworkStatusProvider>` appare **prima** (più in alto
    nell'albero) di `<AuthProvider>`.
  - `grep -n "NetworkStatusProvider" App.tsx` → ≥ 2 occorrenze
    (import + apertura tag).
  - `npx tsc --noEmit` exit code 0 (entro baseline).
  - L'app si compila e Metro non segnala errori a freddo
    (`npx react-native start --reset-cache`, verifica manuale del
    maintainer su almeno una piattaforma target).

### T6 — Redazione test (unit + integrazione)

- **File**: `__tests__/use-network-status.spec.ts` (nuovo).
- **Azione**: creare la suite di test eseguibili che copre i
  **4 scenari obbligatori** dichiarati in DESIGN 008 e nel TODO 008:
  1. **Online**: provider riceve evento NetInfo con
     `isConnected = true`, `isInternetReachable = true` →
     `isOffline === false`, `isConnected === true`,
     `isInternetReachable === true`, `isInitialized === true`.
  2. **Offline confermato**: `isConnected = false`,
     `isInternetReachable = false` → `isOffline === true`.
  3. **Offline incerto / captive portal**: `isConnected = true`,
     `isInternetReachable = false` → `isOffline === true`
     (semantica INV-7).
  4. **Flapping con debounce**: una transizione online → offline
     seguita entro 500 ms da online → online **non** deve propagare
     l'offline ai consumer. Una transizione online → offline che
     resta tale per > 1000 ms **deve** propagarsi.
  5. **Fail-Safe Online-First**: se `NetInfo.addEventListener` lancia
     una eccezione, `isOffline === false`, `isInitialized === true`,
     `connectionType === 'unknown'`, e `console.warn` viene invocato.
  6. **Cleanup**: unmount del provider invoca la funzione restituita
     da `NetInfo.addEventListener` e nessun `setState` viene chiamato
     dopo l'unmount (verifica via spy su `setState` o su mock di
     React state).
- **Infrastruttura mock richiesta**:
  - `jest.mock('@react-native-community/netinfo', () => ({ default: { addEventListener: jest.fn(() => unsubscribe), fetch: jest.fn() } }))`.
  - Utility `triggerNetInfo(state)` per simulare eventi dal mock.
  - Uso di `jest.useFakeTimers()` per il debounce.
  - `react-test-renderer` (già usato in `__tests__/App.test.tsx`) o
    `@testing-library/react-native` se disponibile.
- **Gate di accettazione T6**:
  - `npx jest __tests__/use-network-status.spec.ts` exit code 0.
  - Almeno 6 test eseguibili e passanti (uno per scenario).
  - Numero di `it.todo` residui = 0 (i 4 scenari obbligatori non
    possono restare `it.todo`).

### T7 — Conversione `it.todo` in test eseguibili (consumer-side)

- **File**: `__tests__/AppDataContext.spec.ts`.
- **Azione**: verificare se il file spec contiene `it.todo` che
  dipendono dal contratto rete (es. simulazione `navigator.onLine = false`
  che dopo PLAN 008 va sostituita con il mock di `useNetworkStatus`).
  Per ogni `it.todo` di questo tipo:
  1. Convertirlo in `it(...)` eseguibile.
  2. Sostituire il mock di `navigator.onLine` con un mock di
     `useNetworkStatus` che restituisce `{ isOffline: true, ... }`.
  3. Verificare che il test passi.
  Se nessun `it.todo` esistente dipende dal contratto rete, T7 si
  riduce a una constatazione documentale ("nessuna conversione
  necessaria") da annotare nel commit message. PLAN 008 **non**
  introduce nuovi `it.todo` né nuovi scenari su `AppDataContext.spec.ts`
  oltre a quanto già previsto da PLAN 007.
- **Dipende da**: T6 completato (l'infrastruttura mock di
  `useNetworkStatus` è la stessa usata in T6).
- **Gate di accettazione T7**:
  - `grep -nE "it\.todo|test\.todo" __tests__/AppDataContext.spec.ts`:
    nessun `it.todo` residuo dipendente dal contratto rete.
  - `npx jest __tests__/AppDataContext.spec.ts` exit code 0.

### T8 — Esecuzione full suite e verifica gate

- **File**: `__tests__/` (intera directory).
- **Azione**: eseguire la suite completa e verificare assenza di
  regressioni.
  ```bash
  npx jest
  npx tsc --noEmit
  ```
- **Dipende da**: T7 completato.
- **Gate di accettazione T8**: tutti i test esistenti passano +
  i nuovi test di T6 passano + `npx tsc --noEmit` entro baseline ≤ 3.

---

## 7. Gate di chiusura del PLAN

Prima di dichiarare PLAN 008 completato, verificare che **tutti** i
gate seguenti siano superati.

### GATE G1 — Compilazione TypeScript pulita

```bash
npx tsc --noEmit
```

Exit code 0 oppure conteggio errori ≤ 3 (baseline verificata il
2026-05-25, aggiornata da 8; precedente stima PLAN 007 NOTA 1
non rifletteva il valore reale). I file nuovi
`src/context/NetworkStatusContext.tsx` e
`src/hooks/use-network-status.ts` non devono contribuire errori
aggiuntivi rispetto alla baseline.

### GATE G2 — Assenza di `navigator.onLine` in `src/**`

```bash
grep -RnE "navigator\.onLine" src/
```

Esito atteso: **0 occorrenze**. Copre **INV-1**.

### GATE G3 — Assenza di `window.addEventListener('online'|'offline')`

```bash
grep -RnE "addEventListener\(['\"](online|offline)['\"]" src/
```

Esito atteso: **0 occorrenze**. Copre **INV-1**.

### GATE G4 — Subscription NetInfo unica

```bash
grep -RnE "NetInfo\.addEventListener|NetInfo\.fetch" src/
```

Esito atteso: occorrenze **solo** in `src/context/NetworkStatusContext.tsx`.
Nessuna occorrenza in altri file. Copre **INV-1** e **INV-2**.

### GATE G5 — Eliminazione `use-online-status.ts`

```bash
test ! -f src/hooks/use-online-status.ts && echo OK
grep -R "useOnlineStatus" src/
grep -R "use-online-status" src/
```

Esito atteso: file inesistente; 0 occorrenze di entrambi i grep.

### GATE G6 — Posizione provider in `App.tsx`

Verifica manuale che `<NetworkStatusProvider>` sia un ancestor di
`<AuthProvider>` nell'albero JSX di `App.tsx`. Strumentale:

```bash
grep -nE "NetworkStatusProvider|AuthProvider" App.tsx
```

L'ordine di apertura dei tag deve essere `NetworkStatusProvider`
prima di `AuthProvider`. Copre **INV-5**.

### GATE G7 — Boundary DESIGN 007 preservato

Verifica statica sui simboli di PLAN 007 in `AppDataContext.tsx`:

```bash
grep -cE "transitionTo|hydrationGen|applyDomainSnapshot|readCachedDomainSnapshot|writeCache" src/context/AppDataContext.tsx
```

Il conteggio deve essere **invariato** rispetto al commit di chiusura
di PLAN 007 (riferimento: tag o commit più recente che chiude PLAN 007
su `main`). Copre **INV-6**.

### GATE G8 — Suite test verde

```bash
npx jest
```

Exit code 0. Nessuna regressione sui test preesistenti
(`__tests__/crypto/*.test.ts`, `__tests__/ExportService.test.ts`,
`__tests__/App.test.tsx`, `__tests__/AppDataContext.spec.ts`).
I nuovi test di T6 passano (≥ 6 test eseguibili).

### Copertura INVARIANTI ↔ Task/Gate

| Invariante | Task | Gate |
|------------|------|------|
| INV-1 (provenienza unica del segnale) | T2, T3, T4 | G2, G3, G4 |
| INV-2 (subscription unica) | T2 | G4 |
| INV-3 (debounce direzionale 1000 ms) | T2 | G8 (test scenario 4) |
| INV-4 (Fail-Safe Online-First) | T2 | G8 (test scenario 5) |
| INV-5 (posizione provider) | T5 | G6 |
| INV-6 (boundary DESIGN 007) | T4 | G7 |
| INV-7 (semantica `isOffline`) | T2 | G8 (test scenari 1-3) |

---

## 8. Debiti tecnici registrati

### DT-008-01 — Timeout di inizializzazione fisso a 1500 ms

- **Titolo**: Timeout di inizializzazione NetInfo non configurabile.
- **Descrizione**: T2 fissa a 1500 ms il timeout oltre il quale, in
  assenza di eventi NetInfo, viene applicato il Fail-Safe Online-First.
  Il valore è una scelta operativa derivata dall'analisi qualitativa
  della latenza tipica di NetInfo all'avvio su Windows; non è
  derivato da misure empiriche.
- **Rischio**: in scenari di avvio lentissimo (dispositivo embedded,
  emulatore congestionato) il timeout può scattare prima di un evento
  reale, causando una transizione fittizia online → online → (evento
  reale) potenzialmente offline. Il debounce direzionale e la
  successiva propagazione dell'evento reale risolvono il rumore, ma
  l'effetto resta visibile nei test diagnostici.
- **Stato**: non gestito in PLAN 008. Rinviato a un eventuale PLAN
  futuro che parametrizzi il timeout via env o setting utente.

### DT-008-02 — Telemetria Fail-Safe non centralizzata

- **Titolo**: Logging del Fail-Safe Online-First limitato a `console.warn`.
- **Descrizione**: in caso di attivazione del Fail-Safe (INV-4), il
  provider logga via `console.warn` ma non emette eventi verso un
  layer di telemetria centralizzato. Diagnosi a posteriori basata su
  log di sviluppo.
- **Stato**: non gestito. Rinviato al PLAN che introdurrà il modulo
  di telemetria operativa.

### DT-008-03 — Wiring `AppDataProvider` non incluso

- **Titolo**: `AppDataProvider` non è ancora montato in `App.tsx`.
- **Descrizione**: PLAN 008 garantisce che, **quando**
  `AppDataProvider` verrà aggiunto a `App.tsx`, dovrà stare sotto
  `NetworkStatusProvider`. Il wiring effettivo è fuori scope (oggi
  `App.tsx` è ancora il boilerplate React Native con solo
  `AuthProvider`). Senza il wiring, il consumo di `useNetworkStatus`
  dentro `AppDataContext.tsx` (T4) non è attivo runtime, ma il
  codice compila e la suite test esercita il provider via mock.
- **Stato**: non gestito. Rinviato al PLAN che integrerà
  `AppDataProvider` in `App.tsx`.

---

## 9. Fuori perimetro

Riproduzione esplicita degli elementi fuori scope, già elencati in
Sezione 4.2. Sono ripresi fedelmente da DESIGN 008 §10:

- Bootstrap lifecycle, state machine dei dati di dominio, hydration,
  fallback cache, `refreshAll`, `writeCache`, `applyDomainSnapshot`:
  perimetro esclusivo di **DESIGN 007 / PLAN 007**.
- Modifiche a `src/lib/supabase/cache.ts` o ai repository CRUD.
- Componenti UI per stato offline (banner, spinner, messaggi visivi).
- Sostituzione di `sonner` (B3 del report diagnosi).
- Sostituzione di `downloadFile` (N10 del report, DESIGN 009).
- Wiring di `AppDataProvider` in `App.tsx` (DT-008-03).
- Retry logic applicativa e gestione errori specifici Supabase.
- Telemetria centralizzata del Fail-Safe (DT-008-02).
- Annunci screen reader del cambio di stato rete.

---

## 10. Validation log

| Data | Blocco | Agente | Esito | Note |
|------|--------|--------|-------|------|
| 2026-05-25 | Pre-flight P1-P7 | Copilot | ✅ COMPLETATO | Sessione: pre-flight PLAN 008 — baseline TS aggiornata da 8 a 3 |

---

## 11. Riferimenti

- DESIGN: [docs/2-projects/008-DESIGN_network-connectivity_v0.1.0.md](../2-projects/008-DESIGN_network-connectivity_v0.1.0.md)
- PLAN 007 (boundary): [docs/3-coding-plans/007-PLAN_async-cache-hydration_v0.1.0.md](007-PLAN_async-cache-hydration_v0.1.0.md)
- TODO 007 (boundary): [docs/4-todo-lists/007-TODO_async-cache-hydration_v0.1.0.md](../4-todo-lists/007-TODO_async-cache-hydration_v0.1.0.md)
- DESIGN 001 (precondizione): [docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md](../2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md)
- DESIGN 002 (precondizione): [docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md](../2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md)
- File perimetro hook (nuovo): [src/hooks/use-network-status.ts](../../src/hooks/use-network-status.ts)
- File perimetro provider (nuovo): [src/context/NetworkStatusContext.tsx](../../src/context/NetworkStatusContext.tsx)
- File perimetro consumer: [src/context/AppDataContext.tsx](../../src/context/AppDataContext.tsx)
- File da eliminare: [src/hooks/use-online-status.ts](../../src/hooks/use-online-status.ts)
- File entry app: [App.tsx](../../App.tsx)
