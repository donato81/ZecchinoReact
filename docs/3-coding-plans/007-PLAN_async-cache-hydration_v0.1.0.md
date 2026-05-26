---
tipo: plan
titolo: Async cache hydration — bootstrap lifecycle AppDataContext
versione: 0.1.0
data: 2026-05-23
stato: IMPLEMENTED
design: docs/2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md
perimetro: src/context/AppDataContext.tsx
ramo: main
---

# PLAN 007 — Async cache hydration — bootstrap lifecycle AppDataContext

> **Fonte di verità**: ogni decisione tecnica di questo piano è derivata
> da
> [docs/2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md](../2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md).
> In caso di discrepanza, il documento di design prevale.
>
> **Nota di collocazione**: il prompt di stesura indicava il path
> `docs/2-projects/007-PLAN_...`. La convenzione del progetto colloca i
> coding plan in `docs/3-coding-plans/` (vedi 004, 005, 006). Si applica
> la convenzione.

---

## 1. Obiettivo

Riformulare il bootstrap dei dati di dominio di `AppDataContext` come
state machine esplicita e correggere l'uso sincrono delle API
asincrone del modulo cache. Esito atteso:

- `readCachedDomainSnapshot` e `hydrateFromCache` diventano
  effettivamente asincrone con `await` su tutte le chiamate a
  `readCache` e `isCacheStale`.
- Lo snapshot candidato è validato strutturalmente (`Array`, non
  `undefined`, non `Promise`) prima di transitare in `CACHE-READY`.
- La state machine a sei stati (IDLE, HYDRATING, CACHE-READY,
  REMOTE-SYNC, READY, ERROR) governa univocamente i valori esposti
  ai consumer (`isLoading`, `isDataReady`, `error`).
- `refreshAll` rispetta l'invariante "una sola hydration alla volta"
  anche sotto React 18 Strict Mode double-invoke.
- `writeCache` è fail-soft: nessun crash, nessun `unhandled promise
  rejection`.

Effetto utente atteso: scompare lo scenario in cui la UI dichiara di
essere pronta (`isDataReady = true`) con collezioni `undefined`; la
distinzione fra "vuoto legittimo" (Caso A del DESIGN §6) e "hydration
fallita" (Caso B) è preservata.

---

## 2. Precondizioni

L'implementazione di questo piano può iniziare solo dopo che **entrambe**
le precondizioni seguenti sono soddisfatte e mergiate su `main`. Sono
le precondizioni dichiarate dal DESIGN 007 §1 e §12.

- **DESIGN 001 — Fix blocchi avvio** ([001-DESIGN_fix-blocchi-avvio_v0.1.0.md](../2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md))
  completamente implementato. `@react-native-async-storage/async-storage`
  installato alla versione corretta della serie 2.x: senza questa
  primitiva il modulo `src/lib/supabase/cache.ts` non opera a runtime e
  la riscrittura asincrona di `readCachedDomainSnapshot` non avrebbe
  base operativa (fix B5 del report diagnosi).
- **DESIGN 002 — Fix provider bootstrap** ([002-DESIGN_fix-provider-bootstrap_v0.2.0.md](../2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md))
  completamente implementato. `AuthProvider` deve essere stabile e
  montabile senza crash; `AppDataProvider` consuma `useAuth()` per
  leggere `isAuthenticated` e `user?.id`.

Verifica veloce delle precondizioni:

```bash
# Stato dei DESIGN nel ledger principale
grep -nE "DESIGN 001|DESIGN 002" docs/todo-master.md

# AsyncStorage installato (versione 2.x)
node -p "require('./package.json').dependencies['@react-native-async-storage/async-storage']"

# AppDataProvider e AuthContext montabili senza errori sintattici
npx tsc --noEmit
```

Se anche una sola verifica fallisce: STOP, non scrivere alcuna riga di
codice di PLAN 007.

---

## 3. Stato atteso di `AppDataContext.tsx` all'inizio di questo PLAN

> Sezione descrittiva dello stato CORRENTE del file `src/context/AppDataContext.tsx`,
> prima di qualsiasi modifica prevista da questo PLAN. Riferimento
> diretto al codice letto in Fase 0 di stesura. I numeri di riga sono
> indicativi e possono variare di pochi offset.

### 3.1 Struttura del file

Il file contiene, nell'ordine:

1. Import (React, tipi di dominio, helper, sound/haptic system,
   layer `@/announcements`, shim `toast`, repository CRUD, modulo
   cache, `useAuth`, `RepositoryError`).
2. Definizione del tipo `AppDataContextValue` (~62 chiavi: dati,
   flag `isLoading`, `error`, `isDataReady`, varianti `safe*`, azioni
   CRUD, handler legacy, stato dialog).
3. `createContext<AppDataContextValue | null>(null)`.
4. Tipo `DomainSnapshot` e costanti messaggio offline
   (`OFFLINE_CACHE_MESSAGE`, `OFFLINE_STALE_CACHE_MESSAGE`,
   `OFFLINE_FIRST_ACCESS_MESSAGE`).
5. `loadDomainSnapshot()` — funzione modulo, **già asincrona e
   corretta** (usa `Promise.all` su 5 `getAll*()`).
6. `AppDataProvider({ children })` — componente provider con stato,
   callback e due `useEffect`.
7. Azioni CRUD (`addAccount`, `updateAccount`, …) — **fuori scope di
   questo PLAN**.
8. Handler legacy (`handleSaveAccount`, `handleSaveTransaction`, …) e
   `checkBudgetNotifications` — **fuori scope di questo PLAN**.
9. `<AppDataContext.Provider value={...}>` (~riga 676) e export
   `useAppData` (~riga 738).

### 3.2 Funzioni rotte oggetto di intervento

**`readCachedDomainSnapshot`** (~righe 211–238)

Firma attuale: `(userId: string) => { snapshot: DomainSnapshot; isStale: boolean } | null`
— **sincrona**. Il corpo invoca cinque volte `readCache` e cinque volte
`isCacheStale` **senza `await`**. Il guard `if (!accounts || ...) return null`
non scatta mai (una `Promise` non risolta è truthy). Lo snapshot
costruito accede a `.data` su istanze `Promise` (sempre `undefined`).
`isStale` calcolato con `[...].some(Boolean)` su 5 `Promise` è sempre
`true`.

**`hydrateFromCache`** (~righe 240–254)

Firma attuale: `(userId: string) => boolean` — **sincrona**. Eredita
la rottura di `readCachedDomainSnapshot`: il ramo "successo" è sempre
eseguito, `applyDomainSnapshot` riceve uno snapshot con 5 collezioni
`undefined`, `setIsDataReady(true)` viene comunque chiamato.

**Primo `useEffect` di bootstrap** (~righe 257–304)

Dipendenze: `[applyDomainSnapshot, hydrateFromCache, isAuthenticated, user?.id]`.
Ramo offline (`navigator.onLine === false`) → chiama
`hydrateFromCache(user.id)` come se fosse sincrona. Ramo normale →
`try/await loadDomainSnapshot()`, su `catch` chiama
`hydrateFromCache(user.id)` come fallback. Flag `cancelled` locale per
prevenire l'applicazione di snapshot dopo unmount, **ma non protegge da
invocazioni concorrenti** di `refreshAll`.

**Secondo `useEffect`** (~righe 308–316)

Dipendenze: `[accounts, budgets, categories, isAuthenticated, isDataReady, savingsGoals, transactions, user?.id]`.
Invoca cinque volte `writeCache(user.id, '<tabella>', <collezione>)`
**senza `await`** e **senza `try/catch`**. Eventuali errori
`AsyncStorage` diventano `unhandled promise rejection` silenziosi.

**`refreshAll`** (~righe 318–340)

Firma attuale: `() => void`. Guard: `if (isLoading || !user?.id) return`.
`isLoading` è stato React, propagato asincronicamente: esiste una
finestra fra l'inizio della hydration e il re-render in cui un secondo
invoco di `refreshAll` osserva ancora `isLoading = false`. La stessa
finestra è amplificata da React 18 Strict Mode in development (double
invoke degli `useEffect`).

### 3.3 Import rilevanti per questo PLAN

```ts
import { CACHE_TTL_MS, isCacheStale, readCache, writeCache } from '@/lib/supabase/cache'
import { useAuth } from '@/context/AuthContext'
```

Nessun import aggiuntivo è strettamente richiesto: `useRef` (se scelto
in T4) è già esportato da `react` insieme a `useCallback`, `useEffect`,
`useMemo`, `useState` già importati.

### 3.4 Consumer dichiarati nel codebase

Censimento corrente (stato pre-PLAN, riconfermato in T6):

- `src/hooks/use-visible-data.ts` — unico consumer di `useAppData()`
  trovato (legge `accounts`, `transactions`, `categories`, `budgets`,
  `savingsGoals`).
- Nessun consumer esterno legge `isLoading` o `isDataReady` al momento
  della stesura. Il task T6 ri-verifica al momento dell'implementazione.

---

## 4. Task in sequenza

I task vanno eseguiti nell'ordine indicato. Ogni task ha un criterio di
validazione locale; la chiusura del PLAN è governata dai gate della
sezione 5.

### T1 — Riscrittura asincrona di `readCachedDomainSnapshot`

- **File**: `src/context/AppDataContext.tsx`.
- **Modifica**: trasformare la callback in `async (userId: string): Promise<{ snapshot: DomainSnapshot; isStale: boolean } | null>`.
  Aggiungere `await` esplicito su ciascuna delle cinque chiamate a
  `readCache` e su ciascuna delle cinque chiamate a `isCacheStale`.
  Strategia consigliata per ridurre la latenza: raggruppare le letture
  in due `Promise.all` (uno per `readCache`, uno per `isCacheStale`).
  Dopo le letture, **validare strutturalmente** lo snapshot candidato:
  per ognuna delle cinque collezioni verificare che il valore
  estratto sia `Array.isArray(...)`, non `undefined`, non `null` e non
  una `Promise` (`typeof value?.then !== 'function'`). Se la
  validazione fallisce per anche una sola collezione, restituire
  `null`. Mantenere invariata la firma sul fronte ritorno
  (`{ snapshot, isStale } | null`).
- **Criterio di validazione T1**:
  - `grep -n "readCache(" src/context/AppDataContext.tsx` → ogni
    occorrenza è preceduta da `await`.
  - `grep -n "isCacheStale(" src/context/AppDataContext.tsx` → ogni
    occorrenza è preceduta da `await`.
  - La funzione ritorna `Promise<...>` (verifica via firma TS).
  - Nessuna assegnazione di `.data` su `Promise`: ogni `.data` è
    letta su record `await`-ato.
  - Validazione strutturale presente e copre tutte e cinque le
    collezioni.

### T2 — Riscrittura asincrona di `hydrateFromCache`

- **File**: `src/context/AppDataContext.tsx`.
- **Modifica**: trasformare la callback in
  `async (userId: string): Promise<boolean>`. Sostituire la chiamata
  sincrona con `const cached = await readCachedDomainSnapshot(userId)`.
  Mantenere la logica di branching (`if (!cached) → ERROR path`;
  `else → applyDomainSnapshot + setError + setIsDataReady(true)`). Il
  ramo "successo" può essere raggiunto **solo** se la validazione T1
  è passata: questo elimina il falso positivo di hydration documentato
  al §2.B del DESIGN.
- **Criterio di validazione T2**:
  - `hydrateFromCache` ritorna `Promise<boolean>`.
  - Tutti i call site (primo `useEffect`, `refreshAll`) sono
    aggiornati con `await` o gestione esplicita della `Promise`
    (`.then(...)`/`.catch(...)`) all'interno di funzione `async`.
  - Nessun ramo del codice imposta `isDataReady = true` senza che
    `cached` sia un oggetto non-null restituito da
    `readCachedDomainSnapshot`.

### T3 — State machine esplicita

- **File**: `src/context/AppDataContext.tsx`.
- **Modifica**: introdurre uno stato `bootstrapState` di tipo
  `'IDLE' | 'HYDRATING' | 'CACHE-READY' | 'REMOTE-SYNC' | 'READY' | 'ERROR'`
  con `useState<BootstrapState>('IDLE')`. Le scritture su `isLoading`,
  `isDataReady` ed `error` non possono avvenire indipendentemente:
  devono passare per una funzione `transitionTo(nextState, payload?)`
  interna al provider che:
  1. Verifica che la transizione `currentState → nextState` sia ammessa
     dalla tabella DESIGN §4 (es. con un oggetto `ALLOWED_TRANSITIONS`).
  2. Aggiorna `bootstrapState`.
  3. Aggiorna in modo atomico (`setIsLoading`, `setIsDataReady`,
     `setError`) coerentemente con la definizione dello stato di arrivo.
- **Transizioni ammesse** (estratte dal DESIGN §4):
  - `IDLE → HYDRATING` (autenticazione riuscita)
  - `HYDRATING → CACHE-READY` (cache validata)
  - `HYDRATING → READY` (rete OK, no cache)
  - `HYDRATING → ERROR` (nessuna cache, nessuna rete)
  - `CACHE-READY → REMOTE-SYNC` (refresh background OK)
  - `CACHE-READY → ERROR` (degrado esplicito, opzionale)
  - `REMOTE-SYNC → READY` (quiete)
  - `READY → HYDRATING` (refreshAll esplicito)
  - `ERROR → HYDRATING` (retry esplicito)
  - `* → IDLE` (logout, da qualsiasi stato autenticato)
- **Transizioni vietate** (blocco esplicito):
  - `HYDRATING → CACHE-READY` con snapshot non validato (T1 garantisce
    l'impossibilità a monte; il guard è il secondo livello).
  - `HYDRATING → READY` senza `loadDomainSnapshot` completata e
    validata.
  - `IDLE → READY` diretto (sempre attraverso `HYDRATING`).
  - `ERROR → *` con `isDataReady = true` senza passare da `HYDRATING`.
- **Criterio di validazione T3**:
  - L'enum `BootstrapState` è dichiarato e usato.
  - `transitionTo` rifiuta una transizione vietata (es. `console.warn`
    o no-op tracciato in development).
  - Nessuna chiamata diretta a `setIsLoading`/`setIsDataReady`/
    `setError` esiste fuori da `transitionTo` (eccezione: reset al
    logout, che corrisponde alla transizione `* → IDLE`).
  - Coerenza: per ogni stato, i tre flag derivati rispettano la
    tabella DESIGN §4 (es. in `READY`: `isLoading = false`,
    `isDataReady = true`, `error = null`).

### T4 — Guard anti-concorrenza di `refreshAll`

- **File**: `src/context/AppDataContext.tsx`.
- **Decisione tecnica obbligatoria**: il guard `if (isLoading || !user?.id) return`
  è insufficiente perché `isLoading` è stato React batched (vedi DESIGN §8).
  Il meccanismo scelto da questo PLAN è un **generation counter** combinato
  con un **`useRef<number>` di hydration attiva**.
- **Meccanismi valutati**:
  1. `useRef<boolean>` "hydrationInProgress" — semplice, ma non
     distingue hydration sovrapposte e non protegge dal "fuori ordine"
     (DESIGN §8: hydration A iniziata prima di B ma terminata dopo
     non deve sovrascrivere B).
  2. **Generation counter** (`useRef<number>` incrementale, snapshot
     al lancio, confronto allo `apply`) — **scelto**: protegge sia
     dall'avvio concorrente sia dal "fuori ordine".
  3. `AbortController` / cancellation token — utile se le primitive
     supportano `signal`. `readCache`/`writeCache`/repository CRUD
     attuali **non** accettano `AbortSignal`: il token sarebbe
     applicato solo come check di idempotenza prima di `applyDomainSnapshot`,
     duplicando di fatto il generation counter senza beneficio.
- **Comportamento atteso sotto React 18 Strict Mode**:
  In development React 18 esegue ogni `useEffect` due volte di
  seguito (mount → cleanup → mount) per smascherare effetti
  non-idempotenti. Il primo `useEffect` di bootstrap viene quindi
  invocato due volte all'avvio. Il generation counter regge questo
  scenario perché:
  - La prima invocazione incrementa il counter a `N`, fa partire la
    hydration `genN`.
  - Il cleanup avviene (ma le `Promise` in volo non sono
    cancellabili).
  - La seconda invocazione incrementa il counter a `N+1`, fa partire
    `genN+1`.
  - Quando `genN` completa, il check `if (myGen !== latestGenRef.current) return`
    blocca l'applicazione del risultato obsoleto.
  - Solo `genN+1` arriva ad `applyDomainSnapshot` + `transitionTo`.
  Lo stesso meccanismo protegge da: click multipli su un eventuale
  pulsante "Aggiorna", `refreshAll` invocato da più consumer, logout
  durante una hydration in volo (cleanup azzera il counter o lo stato
  passa a `IDLE`, e il check fallisce).
- **Implementazione richiesta**:
  - `const hydrationGen = useRef(0)`.
  - All'inizio di ogni operazione di hydration (bootstrap effect e
    `refreshAll`): `const myGen = ++hydrationGen.current`.
  - Prima di ogni `applyDomainSnapshot` + `transitionTo`:
    `if (myGen !== hydrationGen.current) return`.
  - Il guard `isLoading` può essere mantenuto come early-exit veloce
    per `refreshAll` ma **non sostituisce** il generation counter.
  - Al logout (transizione `* → IDLE`): incrementare `hydrationGen.current`
    per invalidare qualsiasi hydration in volo.
- **Criterio di validazione T4**:
  - `useRef` importato e usato.
  - Tutti i `applyDomainSnapshot` di hydration sono preceduti dal
    check generation.
  - In modalità Strict Mode (default in `App.tsx` con
    `<React.StrictMode>` se presente; altrimenti simulato in test),
    due invocazioni back-to-back del bootstrap effect non producono
    due transizioni a `READY` né doppi `applyDomainSnapshot` sullo
    stato reale.

### T5 — Correzione delle chiamate a `writeCache`

- **File**: `src/context/AppDataContext.tsx`.
- **Modifica**: nel secondo `useEffect`, racchiudere ogni chiamata a
  `writeCache` in `await` dentro una funzione `async` interna e in un
  `try/catch` per tabella. In `catch` loggare l'errore con
  `console.warn('[AppDataContext] writeCache failed', { table, error })`
  e proseguire con le altre tabelle. **Nessuna** delle seguenti
  alterazioni è ammessa: invalidazione della cache esistente, retry
  automatico, propagazione dell'errore al rendering, alterazione dello
  stato React.
- Struttura suggerita:
  ```ts
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !isDataReady) return
    const userId = user.id
    void (async () => {
      const targets: Array<[string, unknown]> = [
        ['conti', accounts],
        ['transazioni', transactions],
        ['categorie', categories],
        ['budget', budgets],
        ['obiettivi_risparmio', savingsGoals],
      ]
      for (const [table, data] of targets) {
        try {
          await writeCache(userId, table, data)
        } catch (error) {
          console.warn('[AppDataContext] writeCache failed', { table, error })
        }
      }
    })()
  }, [accounts, budgets, categories, isAuthenticated, isDataReady, savingsGoals, transactions, user?.id])
  ```
- **Criterio di validazione T5**:
  - `grep -n "writeCache(" src/context/AppDataContext.tsx` → ogni
    occorrenza è in `await` dentro `try/catch`.
  - Nessuna `unhandled promise rejection` osservata al test di
    fallimento simulato di `AsyncStorage.setItem`.
  - Lo stato React (`accounts`, `transactions`, ...) non viene
    mutato dal `catch`.

### T6 — Censimento e aggiornamento consumer

- **Comando 1** (consumer del context):
  ```bash
  grep -R "useAppData" src/
  ```
- **Comando 2** (lettura di `isDataReady`):
  ```bash
  grep -R "isDataReady" src/
  ```
- **Comando 3** (lettura di `isLoading` esposto dal context):
  ```bash
  grep -R "isLoading" src/
  ```
- **Stato corrente censito** (pre-PLAN): un unico consumer
  (`src/hooks/use-visible-data.ts`) legge le collezioni; nessun
  consumer esterno legge `isLoading` o `isDataReady`.
- **Modifica**: per ogni consumer trovato in implementazione, verificare
  che il nuovo contratto sia rispettato: `isDataReady = true` implica
  collezioni `Array` validate; `isLoading = true` non implica più
  necessariamente "nessun dato": può convivere con `isDataReady = true`
  nello stato `CACHE-READY`. Se un consumer assume `(isLoading XOR
  isDataReady)`, va aggiornato. Documentare l'esito (zero modifiche
  oppure elenco dei file toccati) nel commit message.
- **Criterio di validazione T6**:
  - I tre `grep` sono eseguiti e l'output salvato (commit message o
    nota di PR).
  - Nessun consumer assume più che `isLoading` e `isDataReady` siano
    mutuamente esclusivi.
  - Nessun consumer legge una collezione senza un guard preliminare
    su `isDataReady` quando ne dipende.

### T7 — Conversione test `it.todo`

- **File**: `__tests__/AppDataContext.spec.ts`.
- **Modifica**: convertire i 23 casi `it.todo` presenti in test
  eseguibili (`it(...)` / `test(...)`) e passanti. La conversione
  deve distinguere obbligatoriamente tra:
  - **storage vuoto ma valido** → stato `READY` con collezioni
    `Array` vuote (non `undefined`) — copre **INVARIANTE 5** del
    DESIGN §11;
  - **hydration fallita** → stato `ERROR`;
  - **snapshot corrotto** → stato `ERROR`.
- **Dipende da**: T6 completato e gate G3 verificato. Il codice
  sorgente deve essere già modificato (T1-T6); non ha senso testare
  contro il codice rotto originale.
- **Criteri di accettazione dettagliati**: definiti nel TODO 007
  v0.1.0 §4 — T7 (gruppi prioritari, infrastruttura mock,
  scenari obbligatori "vuoto legittimo vs hydration fallita" e
  "React 18 Strict Mode").
- **Gate di uscita**: tutti i 23 casi eseguibili e passanti
  (Gate G4, vedi §5). Numero di `it.todo` residui = 0.

### T8 — Esecuzione full suite

- **File**: `__tests__/` (intera directory).
- **Modifica**: eseguire `npx jest` sull'intera suite di test del
  progetto dopo il completamento di T7. Verificare assenza di
  regressioni sui test preesistenti
  (`__tests__/crypto/golden.test.ts`,
  `__tests__/crypto/encrypt-decrypt.test.ts`,
  `__tests__/crypto/pin.test.ts`,
  `__tests__/ExportService.test.ts`,
  `__tests__/App.test.tsx`).
- **Dipende da**: T7 completato.
- **Criteri di accettazione dettagliati**: definiti nel TODO 007
  v0.1.0 §4 — T8.
- **Gate di uscita**: G4 chiuso, zero regressioni, `npx tsc --noEmit`
  exit code 0 con baseline ≤ 8.

---

## 5. Gate di chiusura del PLAN

Prima di dichiarare PLAN 007 completato, verificare che **tutti** i gate
seguenti siano superati.

### GATE G1 — Compilazione TypeScript pulita

```bash
npx tsc --noEmit
```

Exit code atteso: `0`. Nessun errore, nessun warning **nuovo** rispetto
alla baseline pre-PLAN (**8 errori** documentati al 2026-05-24; baseline
precedente di 47 errori superata dopo consolidamento PLAN 006 — vedi
NOTA aggiornamento baseline più sotto). Il file
`src/context/AppDataContext.tsx` non deve contribuire alla baseline con
errori aggiuntivi.

> **NOTA — Aggiornamento baseline TypeScript (2026-05-24)**
>
> La baseline storica di 47 errori (rilevata il 2026-05-21 nel
> `docs/todo-master.md`) è stata superata. Dopo il consolidamento delle
> attività di PLAN 006 e dei lavori connessi, il conteggio reale di
> `npx tsc --noEmit 2>&1 | grep -c "error TS"` al 2026-05-24 risulta
> **8 errori**. Questa è la baseline ufficiale per la chiusura di
> PLAN 007. Gate G1 considera "regressione" qualunque conteggio
> superiore a 8 introdotto da modifiche di questo PLAN.

### GATE G2 — Assenza di usi sincroni di `readCache` e `isCacheStale`

```bash
grep -nE "readCache\(" src/context/AppDataContext.tsx
grep -nE "isCacheStale\(" src/context/AppDataContext.tsx
```

Per **ogni** occorrenza riportata: la riga deve essere preceduta o
contenere `await`. Nessuna occorrenza sincrona è ammessa.

Copre **INVARIANTE 2** del DESIGN §11.

### GATE G3 — Assenza di assegnazione diretta di `Promise` a collezioni

Verifica statica + lettura del file:

```bash
grep -nE "const\s+(accounts|transactions|categories|budgets|savingsGoals)\s*=" src/context/AppDataContext.tsx
```

Per **ogni** assegnazione locale delle cinque collezioni nominate, il
right-hand-side deve essere:

- un `await` di chiamata async, oppure
- un valore già `await`-ato a monte, oppure
- una proprietà di un oggetto già `await`-ato.

**Nessuna** delle cinque variabili può contenere una `Promise` non
risolta. La validazione strutturale di T1 (`Array.isArray`, non
`Promise`) è il guard di runtime che protegge questa invariante anche
in caso di regressione futura.

Copre **INVARIANTE 1** del DESIGN §11.

### GATE G4 — Regressione suite test

```bash
npx jest
```

Tutti i test esistenti devono passare senza modifiche al codice di
test (eccetto eventuali test specificamente aggiunti o aggiornati per
questo PLAN, vedi sezione "Revisione test" del prompt di stesura).
Nessuna regressione su:

- `__tests__/crypto/golden.test.ts` (G1, G2, G3 di PLAN 005)
- `__tests__/crypto/encrypt-decrypt.test.ts`
- `__tests__/crypto/pin.test.ts`
- `__tests__/ExportService.test.ts`
- `__tests__/App.test.tsx`

> **Nota — chiusura G4 con T7 e T8**: il gate G4 si considera chiuso
> solo dopo il completamento di T7 (conversione it.todo) e T8 (full
> suite) come specificato nel TODO 007 v0.1.0 §4. I criteri di
> accettazione dettagliati dei due task e dei gruppi di scenari (Bug N9,
> writeCache fail-soft, state machine, concorrenza Strict Mode, vuoto
> legittimo vs hydration fallita) sono normativi: G4 non si considera
> chiuso finché tutti i casi A/B di "vuoto legittimo vs hydration
> fallita" e lo scenario "React 18 Strict Mode" non sono eseguibili e
> passanti con asserzioni esplicite.

### GATE G5 — Assenza di unhandled promise rejection su `writeCache`

Verifica statica:

```bash
grep -nE "writeCache\(" src/context/AppDataContext.tsx
```

Ogni occorrenza deve essere all'interno di un blocco `try { await
writeCache(...) } catch (...) { ... }` (o equivalente strutturale come
nello scheletro di T5). Nessuna chiamata "fire-and-forget" è ammessa.

Verifica runtime (in test): mockare `AsyncStorage.setItem` perché
rigetti su una tabella; il provider non deve crashare, lo stato React
non deve mutare, l'errore deve essere loggato.

Copre **INVARIANTE 4** del DESIGN §11.

### Copertura INVARIANTI ↔ Task/Gate

| Invariante DESIGN §11 | Task | Gate |
|---|---|---|
| INV-1 (`isDataReady` solo con `Array` validi) | T1, T3 | G3 |
| INV-2 (await su readCache/isCacheStale) | T1, T2 | G2 |
| INV-3 (una sola hydration alla volta) | T4 | G1 + test concorrenza |
| INV-4 (writeCache fail-soft) | T5 | G5 |
| INV-5 (vuoto legittimo ≠ hydration fallita) | T1, T2, T3 | G3 + test |

---

## 6. Rollback

In caso di gate fallito dopo 10 tentativi di correzione consecutivi:

```bash
git checkout main -- src/context/AppDataContext.tsx
```

Questo comando ripristina **solo** `AppDataContext.tsx` al commit
precedente, senza toccare nulla altro nel workspace. Il PLAN passa a
stato `BLOCKED` e va escalato all'architetto con report diagnostico
contenente:

- Quale gate ha fallito ad ogni tentativo.
- La correzione tentata.
- Perché la correzione non ha risolto.

Non sono ammessi rollback parziali manuali (modifiche linea-per-linea):
l'unica forma di rollback ammessa di questo PLAN è il `git checkout`
sopra.

---

## 7. Fuori perimetro

I seguenti elementi sono **esplicitamente esclusi** da PLAN 007. Sono
ripresi fedelmente dalla sezione 10 del DESIGN 007. Qualsiasi modifica
agli elementi di questa sezione richiede un PLAN o DESIGN dedicato.

- **Rilevamento connessione di rete**: `navigator.onLine`,
  `useOnlineStatus`, `NetInfo` o qualsiasi meccanismo equivalente.
  Perimetro esclusivo di **DESIGN 008**
  ([008-DESIGN_network-connectivity_v0.1.0.md](../2-projects/008-DESIGN_network-connectivity_v0.1.0.md)).
  Il codice attuale contiene un check `navigator.onLine === false`
  nel primo `useEffect` e in `refreshAll`: **non rimuoverlo, non
  modificarlo**. La sostituzione è di competenza di DESIGN 008.
- **`src/lib/supabase/cache.ts`**: già RN-compatibile e corretto
  (Gruppo 3 del report diagnosi). Nessuna modifica in questo PLAN.
- **Repository CRUD** (`conti`, `transazioni`, `categorie`, `budget`,
  `obiettivi-risparmio`): le funzioni `getAll`, `create`, `update`,
  `remove`, `updateProgress` rimangono invariate.
- **Componenti UI, spinner, banner di errore**: la rappresentazione
  visiva degli stati di bootstrap (`HYDRATING`, `CACHE-READY`,
  `ERROR`, ...) è competenza dei PLAN UI futuri. PLAN 007 si limita
  ad esporre i flag corretti.
- **Migrazione di dati**: nessuna alterazione del formato dei dati
  persistiti su `AsyncStorage` o su Supabase.
- **Sostituzione di `sonner`** (B3 del report diagnosi): design
  dedicato separato.
- **Sostituzione di `downloadFile`** in `handleExportCSV` (N10 del
  report, DESIGN 009): fuori perimetro.
- **Azioni CRUD del provider** (`addAccount`, `updateAccount`, ...,
  `handleSaveAccount`, ...): non vengono toccate da questo PLAN.
- **Stato dialog del provider** (`showTransactionDialog`,
  `editingAccount`, ...): non toccato.

---

## 8. Debiti tecnici registrati

I debiti tecnici elencati di seguito sono **noti**, **non gestiti** in
PLAN 007 e **rinviati** a piani futuri. Vengono registrati qui per
garantirne la tracciabilità tra un PLAN e l'altro.

### DT-007-01 — Assenza di timeout/watchdog sulla hydration AsyncStorage

- **Titolo**: Assenza di timeout/watchdog sulla hydration AsyncStorage.
- **Descrizione**: in assenza di un meccanismo di timeout o watchdog,
  una `Promise` di hydration bloccata (`AsyncStorage` non responsivo,
  loop infinito, dipendenza non risolta) può lasciare il provider
  `AppDataContext` fermo indefinitamente nello stato `HYDRATING`,
  senza mai raggiungere `READY` o `ERROR`.
- **Rischio**: lock permanente del bootstrap. L'applicazione risulta
  non operativa senza feedback all'utente e senza possibilità di
  recovery automatico.
- **Stato**: non gestito in PLAN 007. Rinviato a PLAN futuro dedicato
  alla resilienza del bootstrap (candidato perimetro: introduzione di
  `Promise.race` con timer configurabile + transizione esplicita a
  `ERROR` allo scadere del timeout).
- **Riferimento**: TODO 007 §5 — NOTA 7.

---

## 9. Riferimenti

- DESIGN: [docs/2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md](../2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md)
- Report fonte: [docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md](../1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md)
  (punto N9)
- DESIGN 001 (precondizione): [docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md](../2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md)
- DESIGN 002 (precondizione): [docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md](../2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md)
- DESIGN 008 (confine fuori scope): [docs/2-projects/008-DESIGN_network-connectivity_v0.1.0.md](../2-projects/008-DESIGN_network-connectivity_v0.1.0.md)
- File perimetro: [src/context/AppDataContext.tsx](../../src/context/AppDataContext.tsx)
- Modulo cache (non toccato): [src/lib/supabase/cache.ts](../../src/lib/supabase/cache.ts)
