---
tipo: todo
titolo: "TODO — Async cache hydration — bootstrap lifecycle AppDataContext (DESIGN 007)"
riferimento-design: docs/2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md
riferimento-plan: docs/3-coding-plans/007-PLAN_async-cache-hydration_v0.1.0.md
versione: 0.1.0
data-creazione: 2026-05-23
stato: PENDING
ramo: main
agente: —
data-completamento: —
note-stato: >-
  Documento operativo derivato dal PLAN 007 v0.1.0. Tutti i task
  PENDING. Avvio subordinato al completamento di DESIGN 001 e DESIGN 002
  su main (gate bloccante §2). Codice sorgente non ancora modificato.
---

# TODO 007 — Async cache hydration — bootstrap lifecycle AppDataContext

## 1. Stato / Snapshot

| Campo | Valore |
|-------|--------|
| Ultimo Agente Attivo | — |
| Blocco in Carico | — |
| Last Completed Task | — |
| Next Action | §2 — Verifica gate bloccante (DESIGN 001 e DESIGN 002 su `main`) |
| Open Threads | — |

---

## 2. Precondizioni di avvio (GATE BLOCCANTE)

Riferimento: PLAN 007 §2 — DESIGN 007 §1 e §12.

| Precondizione | Comando di verifica | Esito atteso |
|---------------|---------------------|--------------|
| DESIGN 001 implementato e mergiato su `main` | `grep -nE "DESIGN 001" docs/todo-master.md` | stato IMPLEMENTED o DONE |
| DESIGN 002 implementato e mergiato su `main` | `grep -nE "DESIGN 002" docs/todo-master.md` | stato IMPLEMENTED o DONE |
| `@react-native-async-storage/async-storage` versione 2.x installata | `node -p "require('./package.json').dependencies['@react-native-async-storage/async-storage']"` | valore `^2.x.x` |
| `AuthProvider` e `AppDataProvider` montabili (no crash strutturale) | `npx tsc --noEmit` | exit code 0 o solo errori baseline ≤ 47 (vedi NOTA 1) |

> **GATE INVALICABILE**
>
> Questo gate è invalicabile. Se anche una sola condizione non è
> soddisfatta: **STOP**, non scrivere nessuna riga di codice di PLAN 007.
> La dipendenza da DESIGN 001 è tecnica, non solo documentale: senza
> `AsyncStorage` alla versione corretta, la primitiva `readCache` /
> `writeCache` non opera a runtime e la riscrittura asincrona di T1 non
> avrebbe base operativa.

---

## 3. Stato task

| Task | File target | Azione | Gate | Stato |
|------|-------------|--------|------|-------|
| T1 | `src/context/AppDataContext.tsx` | PATCH (`readCachedDomainSnapshot` → async + await + validazione) | Gate F1 | ☐ |
| T2 | `src/context/AppDataContext.tsx` | PATCH (`hydrateFromCache` → async + await) | Gate F2 | ☐ |
| T3 | `src/context/AppDataContext.tsx` | PATCH (state machine `BootstrapState` + `transitionTo`) | Gate F3 | ☐ |
| T4 | `src/context/AppDataContext.tsx` | PATCH (generation counter `refreshAll`) | Gate F4 | ☐ |
| T5 | `src/context/AppDataContext.tsx` | PATCH (`writeCache` fail-soft + try/catch per tabella) | Gate F5 | ☐ |
| T6 | grep / `src/` | VERIFY (censimento consumer `useAppData` / `isDataReady` / `isLoading`) | Gate F6 | ☐ |
| T7 | `__tests__/AppDataContext.spec.ts` | CONVERT spec `it.todo` → test eseguibili (mock infrastruttura) | Gate G4 | ☐ |
| T8 | [esecuzione suite completa + TSC] | RUN | Gate chiusura | ☐ |

---

## 4. Task atomici

### T1 — `src/context/AppDataContext.tsx` — Riscrittura asincrona di `readCachedDomainSnapshot`

- **File:** `src/context/AppDataContext.tsx`
- **Azione:** Trasformare `readCachedDomainSnapshot` da funzione sincrona a
  `async (userId: string): Promise<{ snapshot: DomainSnapshot; isStale: boolean } | null>`.
  Aggiungere `await` su ogni chiamata a `readCache` e `isCacheStale` (cinque
  per ciascuna). Strategia consigliata: raggruppare in due `Promise.all`
  distinti (uno per `readCache`, uno per `isCacheStale`) per ridurre la
  latenza totale. Dopo le letture, validare strutturalmente ogni collezione:
  deve essere `Array.isArray(val) && val !== undefined && typeof val?.then !== 'function'`.
  Se anche una sola validazione fallisce, restituire `null`.
- **Perché:** Il bug N9 documentato nel DESIGN §2.A nasce qui: senza `await`,
  `readCache` restituisce un `Promise` (sempre truthy), il guard `!accounts`
  non scatta mai, `snapshot.accounts` è `undefined`. Questo è il punto
  architetturale di origine della hydration falsa-positiva.
- **Dipende da:** Gate bloccante §2 superato.
- **Gate F1:**
  ```bash
  grep -n "readCache(" src/context/AppDataContext.tsx
  grep -n "isCacheStale(" src/context/AppDataContext.tsx
  npx tsc --noEmit
  ```
  Ogni occorrenza di `readCache(` e `isCacheStale(` deve essere preceduta
  da `await`. `npx tsc --noEmit` exit code 0 (o solo errori baseline ≤ 47).

> **NOTA — PROMISE.ALL CONSIGLIATO MA NON OBBLIGATORIO**
>
> Il PLAN 007 §T1 raccomanda di raggruppare le letture in due `Promise.all`
> distinti per latenza ottimale. È comunque ammesso un approccio con
> `await` singoli sequenziali, purché **tutti** e dieci gli `await` siano
> presenti. In ogni caso il comportamento corretto richiede che:
> 1. Ogni `readCache(...)` sia `await`-ato.
> 2. Ogni `isCacheStale(...)` sia `await`-ato.
> 3. Nessuna proprietà `.data` sia letta su una `Promise` non risolta.

> **NOTA — VALIDAZIONE STRUTTURALE OBBLIGATORIA**
>
> La validazione strutturale non è una difesa opzionale: è la barriera
> che impedisce a una idratazione falsa-positiva di raggiungere
> `applyDomainSnapshot`. Senza di essa, un future bug asincrono non
> rilevato potrebbe reintrodurre lo scenario di failure critico
> descritto nel DESIGN §3.
>
> Condizione di accettazione della validazione: per ogni collezione `val`:
> ```ts
> Array.isArray(val) && typeof (val as unknown as Promise<unknown>)?.then !== 'function'
> ```
> Se anche una sola collezione non supera la verifica → `return null`.

- [ ] `readCachedDomainSnapshot` ha firma `async (userId: string): Promise<...>`
- [ ] Tutte e 5 le chiamate `readCache(...)` sono `await`-ate
- [ ] Tutte e 5 le chiamate `isCacheStale(...)` sono `await`-ate
- [ ] Validazione strutturale presente per ognuna delle 5 collezioni (`accounts`, `transactions`, `categories`, `budgets`, `savingsGoals`)
- [ ] Guard restituisce `null` se anche una sola validazione fallisce
- [ ] Nessuna assegnazione di `.data` su `Promise` non risolta
- [ ] `grep -n "readCache(" src/context/AppDataContext.tsx` → ogni riga contiene `await`
- [ ] `grep -n "isCacheStale(" src/context/AppDataContext.tsx` → ogni riga contiene `await`
- [ ] `npx tsc --noEmit` exit code 0 (o solo errori baseline ≤ 47)

---

### T2 — `src/context/AppDataContext.tsx` — Riscrittura asincrona di `hydrateFromCache`

- **File:** `src/context/AppDataContext.tsx`
- **Azione:** Trasformare `hydrateFromCache` da `(userId: string) => boolean` a
  `async (userId: string): Promise<boolean>`. Sostituire la chiamata
  sincrona a `readCachedDomainSnapshot` con
  `const cached = await readCachedDomainSnapshot(userId)`.
  Mantenere la logica di branching esistente: `if (!cached)` → path ERROR;
  `else` → `applyDomainSnapshot(cached.snapshot)` + `setError` +
  `setIsDataReady(true)`. Aggiornare **tutti** i call site
  (`useEffect` di bootstrap, `refreshAll`) con `await` o gestione esplicita
  della `Promise`.
- **Perché:** `hydrateFromCache` eredita il bug N9 da `readCachedDomainSnapshot`
  (DESIGN §2.B): poiché T1 garantisce che il guard `!cached` ora scatti
  correttamente, questo task elimina il falso positivo a valle.
- **Dipende da:** T1 (Gate F1 superato).
- **Gate F2:**
  ```bash
  grep -n "hydrateFromCache" src/context/AppDataContext.tsx
  npx tsc --noEmit
  ```
  La dichiarazione di `hydrateFromCache` deve mostrare `async` e firma
  `Promise<boolean>`. Ogni call site deve essere in una funzione `async`
  o usare `.then()/.catch()`. `npx tsc --noEmit` exit code 0.

> **NOTA — CALL SITE OBBLIGATORI DA AGGIORNARE**
>
> Prima di dichiarare T2 completato, verificare **tutti** i call site di
> `hydrateFromCache`:
> 1. Primo `useEffect` di bootstrap (~riga 257): ramo `navigator.onLine === false`
>    e ramo `catch` del fallback remoto.
> 2. `refreshAll` (~riga 318): se presente in quel blocco.
>
> Se un call site non è aggiornato, la `Promise` restituita è ignorata
> e la transizione di stato viene eseguita prima che la hydration sia
> completata: il bug originale si ripresenta in forma diversa.

> **NOTA — NON RIMUOVERE `navigator.onLine`**
>
> Il codice attuale contiene `navigator.onLine === false` nel primo
> `useEffect`. Questo check è **fuori perimetro** di PLAN 007 (perimetro
> DESIGN 008). Non rimuoverlo, non modificarlo, non commentarlo.
> Riferimento: PLAN 007 §7 e DESIGN 007 §10.

- [ ] `hydrateFromCache` ha firma `async (userId: string): Promise<boolean>`
- [ ] Call site nel primo `useEffect` di bootstrap aggiornati con `await`
- [ ] Call site in `refreshAll` aggiornati con `await` (se presenti)
- [ ] Nessun call site ignora la `Promise` restituita da `hydrateFromCache`
- [ ] Il ramo "successo" (`applyDomainSnapshot` + `setIsDataReady(true)`) è raggiungibile solo se `cached` non è `null`
- [ ] Check `navigator.onLine` non toccato
- [ ] `npx tsc --noEmit` exit code 0 (o solo errori baseline ≤ 47)

---

### T3 — `src/context/AppDataContext.tsx` — State machine `BootstrapState` + `transitionTo`

- **File:** `src/context/AppDataContext.tsx`
- **Azione:** Introdurre il tipo `BootstrapState` come union:
  ```ts
  type BootstrapState = 'IDLE' | 'HYDRATING' | 'CACHE-READY' | 'REMOTE-SYNC' | 'READY' | 'ERROR'
  ```
  Aggiungere stato React `const [bootstrapState, setBootstrapState] = useState<BootstrapState>('IDLE')`.
  Creare la funzione `transitionTo(nextState: BootstrapState, payload?)` interna
  al provider che:
  1. Verifica che la transizione `bootstrapState → nextState` sia in
     `ALLOWED_TRANSITIONS` (oggetto o `Set` delle transizioni lecite, derivate
     dal DESIGN §4).
  2. Aggiorna `bootstrapState` via `setBootstrapState`.
  3. Aggiorna atomicamente `isLoading`, `isDataReady` e `error` coerentemente
     con lo stato di arrivo, secondo la tabella DESIGN §4.
  Sostituire tutte le chiamate dirette a `setIsLoading`, `setIsDataReady`,
  `setError` (tranne il reset al logout `* → IDLE`) con chiamate a
  `transitionTo`.
- **Perché:** La state machine esplicita è la garanzia strutturale che
  `isDataReady = true` non possa mai convivere con collezioni `undefined`
  (INVARIANTE 1 DESIGN §11): se `transitionTo` blocca la transizione verso
  `CACHE-READY` con snapshot non validato (T1 + T2 ne garantiscono
  l'impossibilità a monte), il guard è il secondo livello di sicurezza.
- **Dipende da:** T2 (Gate F2 superato).
- **Gate F3:**
  ```bash
  grep -n "bootstrapState\|BootstrapState\|transitionTo\|ALLOWED_TRANSITIONS" src/context/AppDataContext.tsx
  npx tsc --noEmit
  ```
  Tutti e quattro i simboli devono essere presenti. Nessuna chiamata
  diretta `setIsLoading`/`setIsDataReady`/`setError` fuori da `transitionTo`
  (eccezione ammessa: reset al logout).

> **NOTA — TRANSIZIONI LECITE (DESIGN §4)**
>
> Implementare `ALLOWED_TRANSITIONS` sulla base di questa tabella:
>
> | Origine | Destinazione |
> |---------|-------------|
> | `IDLE` | `HYDRATING` |
> | `HYDRATING` | `CACHE-READY`, `READY`, `ERROR` |
> | `CACHE-READY` | `REMOTE-SYNC`, `ERROR` |
> | `REMOTE-SYNC` | `READY` |
> | `READY` | `HYDRATING` |
> | `ERROR` | `HYDRATING` |
> | Qualsiasi | `IDLE` (solo per logout) |
>
> Transizioni vietate (blocco esplicito con `console.warn` in development):
> - `IDLE → READY` diretto (violazione INVARIANTE 1)
> - `HYDRATING → CACHE-READY` con snapshot non validato (già impossibile dopo T1/T2)
> - `ERROR → READY` senza passare da `HYDRATING`

> **NOTA — TABELLA STATI → FLAG DERIVATI (DESIGN §4)**
>
> | Stato | `isLoading` | `isDataReady` | `error` |
> |-------|-------------|---------------|---------|
> | `IDLE` | `false` | `false` | `null` |
> | `HYDRATING` | `true` | `false` | — |
> | `CACHE-READY` | `true`/`false` | `true` | avviso cache |
> | `REMOTE-SYNC` | `false` | `true` | `null` |
> | `READY` | `false` | `true` | `null` |
> | `ERROR` | `false` | `false` | messaggio non null |

- [ ] Tipo `BootstrapState` dichiarato con i 6 stati
- [ ] `useState<BootstrapState>('IDLE')` aggiunto
- [ ] `ALLOWED_TRANSITIONS` definito con tutte le transizioni lecite
- [ ] `transitionTo` implementata con guard di transizione vietata
- [ ] `transitionTo` aggiorna atomicamente `isLoading`, `isDataReady`, `error` in base allo stato di arrivo
- [ ] Nessuna chiamata diretta a `setIsLoading`/`setIsDataReady`/`setError` fuori da `transitionTo` (eccetto reset logout)
- [ ] Transizione `* → IDLE` al logout implementata correttamente
- [ ] `console.warn` (o equivalente) presente per transizioni vietate in development
- [ ] `npx tsc --noEmit` exit code 0 (o solo errori baseline ≤ 47)

---

### T4 — `src/context/AppDataContext.tsx` — Generation counter anti-concorrenza `refreshAll`

- **File:** `src/context/AppDataContext.tsx`
- **Azione:** Aggiungere `const hydrationGen = useRef(0)` nel body del provider.
  All'inizio di ogni operazione di hydration (sia nel `useEffect` di bootstrap
  sia in `refreshAll`): `const myGen = ++hydrationGen.current`.
  Prima di ogni coppia `applyDomainSnapshot` + `transitionTo`:
  `if (myGen !== hydrationGen.current) return` (hydration obsoleta, scartare).
  Al logout (transizione `* → IDLE`): incrementare `hydrationGen.current` per
  invalidare qualsiasi hydration in volo. Mantenere il guard `isLoading` come
  early-exit rapida in `refreshAll` ma non come sostituto del generation counter.
- **Perché:** `isLoading` è stato React batched: fra `setIsLoading(true)` e il
  re-render successivo esiste una finestra in cui un secondo `refreshAll`
  osserva ancora `isLoading = false`. Il generation counter è l'unico meccanismo
  che protegge sia dall'avvio concorrente sia dall'out-of-order. Regge anche
  sotto React 18 Strict Mode double-invoke degli `useEffect` (PLAN 007 §T4).
- **Dipende da:** T3 (Gate F3 superato).
- **Gate F4:**
  ```bash
  grep -n "hydrationGen\|myGen" src/context/AppDataContext.tsx
  npx tsc --noEmit
  ```
  `hydrationGen` deve apparire come `useRef`. Tutti i call site di
  `applyDomainSnapshot` in funzioni di hydration devono essere preceduti dal
  check `if (myGen !== hydrationGen.current) return`.

> **NOTA — MECCANISMO SCELTO DAL PLAN**
>
> Il PLAN 007 §T4 valuta tre meccanismi e sceglie il generation counter
> (`useRef<number>` incrementale). I meccanismi alternativi (`useRef<boolean>`,
> `AbortController`) **non** sono ammessi come sostituto: non proteggono
> dallo scenario out-of-order né da React 18 Strict Mode.
>
> Le primitive `readCache`, `writeCache` e i repository CRUD non accettano
> `AbortSignal`: un cancellation token basato su `AbortController` sarebbe
> ridondante rispetto al generation counter e aggiungerebbe complessità.

> **NOTA — REACT 18 STRICT MODE**
>
> In development, React 18 esegue ogni `useEffect` due volte di seguito.
> Il generation counter regge questo scenario perché:
> - Prima invocazione: counter → N, hydration `genN` avviata.
> - Cleanup: effetto smontato (ma `Promise` in volo non annullabili).
> - Seconda invocazione: counter → N+1, hydration `genN+1` avviata.
> - Quando `genN` completa, `myGen !== hydrationGen.current` blocca
>   l'applicazione del risultato obsoleto.
> - Solo `genN+1` arriva ad `applyDomainSnapshot` + `transitionTo`.
>
> Questo comportamento deve essere verificato dal gruppo di test
> `describe('Concorrenza refreshAll (INVARIANTE 3)', ...)` nel file
> `__tests__/AppDataContext.spec.ts` (T7, scenario concorrenza).

- [ ] `const hydrationGen = useRef(0)` aggiunto nel body del provider
- [ ] `const myGen = ++hydrationGen.current` presente all'inizio del `useEffect` di bootstrap
- [ ] `const myGen = ++hydrationGen.current` presente all'inizio di `refreshAll`
- [ ] Check `if (myGen !== hydrationGen.current) return` presente prima di ogni `applyDomainSnapshot` + `transitionTo` in funzioni di hydration
- [ ] Al logout: `hydrationGen.current++` (o incremento equivalente) per invalidare hydration in volo
- [ ] Guard `isLoading` mantenuto in `refreshAll` come early-exit (non rimosso)
- [ ] `npx tsc --noEmit` exit code 0 (o solo errori baseline ≤ 47)

---

### T5 — `src/context/AppDataContext.tsx` — `writeCache` fail-soft

- **File:** `src/context/AppDataContext.tsx`
- **Azione:** Nel secondo `useEffect`, racchiudere ogni chiamata a `writeCache`
  in un `try { await writeCache(...) } catch (error) { console.warn(...) }`
  per tabella, all'interno di una funzione `async` interna invocata come
  `void (async () => { ... })()`. Aggiungere il `catch` per ogni tabella
  individualmente (non un singolo `try/catch` esterno) in modo che il
  fallimento su una tabella non blocchi le scritture sulle altre.
  In `catch` loggare:
  ```ts
  console.warn('[AppDataContext] writeCache failed', { table, error })
  ```
  **Non** invalidare la cache esistente, **non** fare retry, **non** propagare
  l'errore allo stato React.
- **Perché:** Le cinque chiamate `writeCache` attuali sono fire-and-forget
  (DESIGN §2.C): in caso di errore `AsyncStorage.setItem`, il rejection non
  è catturato e viene perso silenziosamente, con possibile corruzione della
  cache offline.
- **Dipende da (verifica gate):** Gate F4 superato prima di dichiarare Gate F5
  chiuso. Le modifiche al codice di T5 sono logicamente indipendenti da T3/T4
  (tocca il secondo `useEffect`, non la state machine) e possono essere
  scritte in parallelo; tuttavia Gate F5 va verificato solo dopo Gate F4.
- **Gate F5:**
  ```bash
  grep -n "writeCache(" src/context/AppDataContext.tsx
  npx tsc --noEmit
  ```
  Ogni occorrenza di `writeCache(` deve essere all'interno di
  `try { await writeCache(...) } catch (...) { ... }`. Nessuna chiamata
  fire-and-forget ammessa. `npx tsc --noEmit` exit code 0.

> **NOTA — STRUTTURA SUGGERITA DAL PLAN (PLAN 007 §T5)**
>
> ```ts
> useEffect(() => {
>   if (!isAuthenticated || !user?.id || !isDataReady) return
>   const userId = user.id
>   void (async () => {
>     const targets: Array<[string, unknown]> = [
>       ['conti', accounts],
>       ['transazioni', transactions],
>       ['categorie', categories],
>       ['budget', budgets],
>       ['obiettivi_risparmio', savingsGoals],
>     ]
>     for (const [table, data] of targets) {
>       try {
>         await writeCache(userId, table, data)
>       } catch (error) {
>         console.warn('[AppDataContext] writeCache failed', { table, error })
>       }
>     }
>   })()
> }, [accounts, budgets, categories, isAuthenticated, isDataReady, savingsGoals, transactions, user?.id])
> ```
>
> Questa struttura è lo schema di riferimento. Variazioni stilistiche sono
> ammesse purché ogni tabella abbia il proprio `try/catch` e nessuna
> `Promise` sia ignorata.

> **NOTA — NON RICHIESTI IN QUESTA VERSIONE**
>
> Non implementare: retry automatico, invalidazione cache, notifica visiva
> all'utente. Riferimento: DESIGN §9.

- [ ] Il secondo `useEffect` usa una funzione `async` interna (`void (async () => {...})()`)
- [ ] Ogni chiamata `writeCache(...)` è in `await` dentro `try/catch`
- [ ] Il `catch` è per tabella (non singolo `catch` esterno che blocca le altre)
- [ ] In `catch`: `console.warn('[AppDataContext] writeCache failed', { table, error })`
- [ ] Nessuna mutazione dello stato React nel `catch`
- [ ] Nessuna invalidazione della cache esistente in caso di errore
- [ ] Nessun retry automatico
- [ ] `grep -n "writeCache(" src/context/AppDataContext.tsx` → ogni occorrenza dentro `try { await ... }`
- [ ] `npx tsc --noEmit` exit code 0 (o solo errori baseline ≤ 47)

---

### T6 — Censimento consumer (VERIFY)

- **File:** `src/` (grep — solo lettura, nessuna scrittura)
- **Azione:** Eseguire i tre comandi di censimento del PLAN 007 §T6 e
  documentare l'esito nel commit message o in una nota operativa.
  ```bash
  # Consumer del context
  grep -R "useAppData" src/
  # Lettura di isDataReady
  grep -R "isDataReady" src/
  # Lettura di isLoading esposto dal context
  grep -R "isLoading" src/
  ```
  Per ogni consumer trovato, verificare che il nuovo contratto sia rispettato:
  - `isDataReady = true` implica collezioni `Array` validate.
  - `isLoading = true` può convivere con `isDataReady = true` nello stato
    `CACHE-READY` (non più mutuamente esclusivi).
  Se un consumer assume `(isLoading XOR isDataReady)`, aggiornarlo.
  Documentare l'esito nel commit message (zero modifiche oppure elenco
  dei file toccati).
- **Stato corrente pre-PLAN** (da PLAN 007 §3.4): un unico consumer
  (`src/hooks/use-visible-data.ts`) legge le collezioni; nessun consumer
  esterno legge `isLoading` o `isDataReady` al momento della stesura.
  Il censimento al momento dell'implementazione può rivelare consumatori
  aggiuntivi aggiunti nel frattempo.
- **Dipende da:** T5 (Gate F5 superato).
- **Gate F6:** I tre `grep` sono stati eseguiti. L'esito è documentato.
  Se è stato trovato un consumer che assume `(isLoading XOR isDataReady)`:
  il file consumer è stato aggiornato e `npx tsc --noEmit` è di nuovo
  a exit code 0.

- [ ] `grep -R "useAppData" src/` eseguito e output documentato
- [ ] `grep -R "isDataReady" src/` eseguito e output documentato
- [ ] `grep -R "isLoading" src/` eseguito e output documentato
- [ ] Per ogni consumer trovato: contratto `isLoading`/`isDataReady` verificato
- [ ] Eventuali consumer che assumono esclusività mutua aggiornati
- [ ] Esito del censimento documentato nel commit message o nota PR

---

### T7 — `__tests__/AppDataContext.spec.ts` — Conversione spec `it.todo` → test eseguibili

- **File:** `__tests__/AppDataContext.spec.ts`
- **Azione:** Convertire i 23 casi `it.todo` presenti nel file spec
  (creato nella fase di stesura del PLAN, Gate G4) in test eseguibili
  con `it(...)` o `test(...)`. La conversione richiede la costruzione
  di un'infrastruttura di mock, poiché `AppDataContext` dipende da:
  1. `@react-native-async-storage/async-storage` → mock via
     `jest.mock('@react-native-async-storage/async-storage', ...)`
     (oppure file `__mocks__/@react-native-async-storage/async-storage.js`).
  2. Repository CRUD (`src/lib/supabase/repositories/conti.ts`, ecc.) →
     mock via `jest.mock(...)` con implementazioni controllabili.
  3. `src/context/AuthContext` (`useAuth`) → mock che espone
     `isAuthenticated`, `user?.id`.
  4. `src/lib/sound-system.ts`, `src/lib/haptic-system.ts` e
     `@/announcements` → mock silenti (`jest.mock(..., () => ({}))`).
  Usare `@testing-library/react-native` per il rendering del provider
  (se già disponibile nel progetto) oppure `react-test-renderer`
  (già usato in `__tests__/App.test.tsx`).
- **Nota infrastruttura:** Al momento della stesura del TODO (2026-05-23),
  il file `jest.setup.js` non esiste e non ci sono mock globali per
  `AsyncStorage`. Prima di convertire i test eseguibili, verificare se
  un file setup è stato aggiunto nel frattempo:
  ```bash
  ls __tests__/ ; ls jest.setup.* 2>/dev/null
  ```
  Se il setup file non esiste ancora, crearne uno minimale o aggiungere
  i mock localmente nei singoli `describe` bloccanti.
- **Scenari prioritari** da convertire per primi (in ordine):
  1. Bug N9 — hydration async corretta (4 casi)
  2. writeCache fail-soft (4 casi)
  3. State machine bootstrap — transizioni lecite e vietate (9 casi)
  4. Concorrenza refreshAll (4 casi)
  5. Vuoto legittimo vs hydration fallita (2 casi)
- **Dipende da:** T1-T6 completati (il codice sorgente deve essere già
  modificato; non ha senso testare contro il codice rotto originale).
- **Gate G4:**
  ```bash
  npx jest --testPathPattern=AppDataContext
  ```
  Exit code 0. I 23 casi (o un sottoinsieme progressivo con il restante
  in `it.todo`) devono passare senza regressioni sugli altri test.
  Il numero di casi `it.todo` deve decrescere a ogni iterazione fino a 0.

> **NOTA — ONESTÀ DOCUMENTALE**
>
> Se la conversione completa di tutti i 23 casi non è fattibile nella
> stessa sessione di implementazione di T1-T6 (ad esempio per complessità
> del mocking), è ammesso consegnare un subset di test eseguibili con
> i casi rimanenti ancora come `it.todo`, a condizione che:
> - I 4 casi del gruppo "Bug N9" siano tutti eseguibili e passanti.
> - I 4 casi "writeCache fail-soft" siano tutti eseguibili e passanti.
> - Il numero di `it.todo` residui sia documentato nel commit message.
>
> Non è ammesso dichiarare G4 superato se almeno 8 dei casi sopra non
> sono eseguibili.

> **NOTA — NON MODIFICARE IL CODICE SORGENTE IN QUESTA FASE**
>
> T7 è una fase di test. Se durante la conversione di un test si
> scopre che il codice prodotto in T1-T6 non è corretto, tornare al
> task di implementazione appropriato, correggere, ri-verificare il
> gate corrispondente, poi riprendere T7.

- [ ] Infrastruttura mock verificata o creata (AsyncStorage, repository, useAuth, sound/haptic, announcements)
- [ ] Gruppo "Bug N9" (4 casi): tutti convertiti in `it(...)` eseguibili e passanti
- [ ] Gruppo "writeCache fail-soft" (4 casi): tutti convertiti in `it(...)` eseguibili e passanti
- [ ] Gruppo "State machine bootstrap" (9 casi): convertiti in `it(...)` o documentati come `it.todo` con motivazione
- [ ] Gruppo "Concorrenza refreshAll" (4 casi): convertiti in `it(...)` o documentati come `it.todo` con motivazione
- [ ] Gruppo "Vuoto legittimo vs hydration fallita" (2 casi): convertiti in `it(...)` eseguibili e passanti
- [ ] `npx jest --testPathPattern=AppDataContext` exit code 0
- [ ] Numero di `it.todo` residui documentato nel commit message (obiettivo: 0)

---

### T8 — Esecuzione suite completa (RUN)

- **File:** `__tests__/` (intera directory)
- **Azione:** Eseguire la suite completa e verificare assenza di regressioni.
- **Dipende da:** T7 (Gate G4 superato).
- **Gate chiusura:**
  ```bash
  npx jest
  npx tsc --noEmit
  ```
  Entrambi i comandi devono terminare con exit code 0. Nessuna regressione
  sui test preesistenti.

- [ ] `npx jest` exit code 0
- [ ] `npx tsc --noEmit` exit code 0 (o solo errori baseline ≤ 47 pre-PLAN)
- [ ] `__tests__/crypto/golden.test.ts` (G1, G2, G3) passano — nessuna regressione PLAN 005
- [ ] `__tests__/crypto/encrypt-decrypt.test.ts` (R1, E1, E2, E3, A1, S1) passano
- [ ] `__tests__/crypto/pin.test.ts` passano
- [ ] `__tests__/ExportService.test.ts` passa
- [ ] `__tests__/App.test.tsx` passa
- [ ] `__tests__/AppDataContext.spec.ts` — 0 casi `it.todo` residui (obiettivo) o numero documentato

---

## 5. Note Operative

### NOTA 1 — Baseline TypeScript pre-PLAN

Al 2026-05-21 (ultimo aggiornamento `docs/todo-master.md`) la baseline
TypeScript di `npx tsc --noEmit` conta ~47 errori documentati, attribuibili
a file non pertinenti a PLAN 007 (`AppDataContext.tsx`, `AuthContext.tsx`,
`use-online-status.ts`, `budget-templates.ts`, `crypto.ts`,
`haptic-system.ts`, `sound-system.ts`). Gate G1 non richiede l'azzeramento
di tutti gli errori: richiede che PLAN 007 non **aggiunga** errori alla
baseline. Verificare con:
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
```
Il conteggio deve essere ≤ baseline al momento dell'avvio del PLAN. Se
superiore: identificare i nuovi errori confrontando con la lista baseline
prima di procedere.

### NOTA 2 — Branch operativo

Operare esclusivamente sul branch `main`. Non creare branch alternativi o
feature branch per PLAN 007. Ogni commit va su `main` direttamente.
L'assenza di branch dedicati è una scelta architetturale documentata nel
PLAN 007 frontmatter (`ramo: main`).

### NOTA 3 — Perimetro stretto

Il perimetro di PLAN 007 è limitato a:
- `src/context/AppDataContext.tsx` — modifiche T1-T6 (async, state machine,
  generation counter, writeCache fail-soft)
- `__tests__/AppDataContext.spec.ts` — conversione spec (T7)

File esplicitamente fuori perimetro:
- `src/lib/supabase/cache.ts` — già RN-compatibile, non toccarlo
- Repository CRUD (`src/lib/supabase/repositories/`) — non toccati
- `src/context/AuthContext.tsx` — non toccato
- `src/hooks/use-visible-data.ts` — aggiornamento solo se il censimento T6
  evidenzia violazione del nuovo contratto; minimale
- Componenti UI, spinner, banner di errore — fuori scope (futuro PLAN UI)
- `navigator.onLine`, `useOnlineStatus`, `NetInfo` — perimetro DESIGN 008

### NOTA 4 — Rollback

In caso di gate fallito dopo 10 tentativi di correzione consecutivi:
```bash
git checkout main -- src/context/AppDataContext.tsx
```
Questo comando ripristina **solo** `AppDataContext.tsx`. Il PLAN passa a
stato `BLOCKED` e va escalato all'architetto con report diagnostico
contenente: quale gate ha fallito ad ogni tentativo, la correzione tentata,
il motivo del fallimento residuo. Non sono ammessi rollback parziali
manuali linea-per-linea.

### NOTA 5 — Fuori perimetro assoluto

Non implementare in PLAN 007:
- Rilevamento connessione di rete (DESIGN 008)
- Spinner, banner di errore, componenti UI di stato bootstrap
- Retry automatico di `writeCache`
- Migrazione dati su `AsyncStorage` o Supabase
- Sostituzione di `sonner` (B3 del report diagnosi)
- Sostituzione di `downloadFile` in `handleExportCSV` (DESIGN 009)
- Azioni CRUD del provider (`addAccount`, `updateAccount`, ...)
- Stato dialog del provider (`showTransactionDialog`, ...)

### NOTA 6 — Spec test precedente

Il file `__tests__/AppDataContext.spec.ts` è già presente nel repository
con 23 casi `it.todo` creati nella fase di stesura del PLAN (2026-05-23).
Non ricrearlo: leggilo prima di iniziare T7 e convertine i casi in test
eseguibili. La suite è già integrata nel normale ciclo `npx jest` (exit
code 0, 1 passed 23 todo).

---

## 6. Log Validazione

| Data | Blocco | Agente | Esito | Note |
|------|--------|--------|-------|------|
| — | — | — | — | — |

---

## 7. Gate di chiusura

Riproduzione integrale dei gate G1-G5 del PLAN 007 §5.
Prima di dichiarare PLAN 007 completato, verificare che **tutti** i
seguenti punti siano soddisfatti.

### G1 — Compilazione TypeScript pulita

```bash
npx tsc --noEmit
```

Exit code 0 o solo errori baseline pre-PLAN (≤ 47, cfr. NOTA 1). Il file
`src/context/AppDataContext.tsx` non deve contribuire errori aggiuntivi
rispetto alla baseline.

- [ ] `npx tsc --noEmit` exit code 0 o conteggio errori ≤ baseline pre-PLAN

### G2 — Assenza di usi sincroni di `readCache` e `isCacheStale`

```bash
grep -nE "readCache\(" src/context/AppDataContext.tsx
grep -nE "isCacheStale\(" src/context/AppDataContext.tsx
```

Ogni occorrenza riportata deve essere preceduta o contenere `await`.
Nessuna occorrenza sincrona è ammessa. Copre **INVARIANTE 2** del DESIGN §11.

- [ ] Ogni `readCache(` è in `await`
- [ ] Ogni `isCacheStale(` è in `await`

### G3 — Assenza di assegnazione diretta di `Promise` a collezioni

```bash
grep -nE "const\s+(accounts|transactions|categories|budgets|savingsGoals)\s*=" src/context/AppDataContext.tsx
```

Per ogni assegnazione locale delle cinque collezioni, il right-hand-side
deve essere un valore `await`-ato, non una `Promise` non risolta. La
validazione strutturale di T1 (`Array.isArray`, non `Promise`) è il guard
di runtime che protegge questa invariante. Copre **INVARIANTE 1** del DESIGN §11.

- [ ] Nessuna assegnazione delle 5 collezioni su `Promise` non risolta
- [ ] Validazione strutturale `Array.isArray` presente per ognuna delle 5 collezioni

### G4 — Regressione suite test

```bash
npx jest
```

Tutti i test preesistenti passano. Test aggiornati o aggiunti per PLAN 007
passano. Nessuna regressione su:
- `__tests__/crypto/golden.test.ts` (G1, G2, G3)
- `__tests__/crypto/encrypt-decrypt.test.ts` (R1-S1)
- `__tests__/crypto/pin.test.ts`
- `__tests__/ExportService.test.ts`
- `__tests__/App.test.tsx`
- `__tests__/AppDataContext.spec.ts` (almeno i gruppi Bug N9 e writeCache
  fail-soft convertiti e passanti; vedi T7)

- [ ] `npx jest` exit code 0
- [ ] Nessuna regressione su test preesistenti
- [ ] Almeno 8 casi di `AppDataContext.spec.ts` eseguibili (Bug N9 + writeCache fail-soft)

### G5 — Assenza di `writeCache` fire-and-forget

```bash
grep -nE "writeCache\(" src/context/AppDataContext.tsx
```

Ogni occorrenza deve essere all'interno di un blocco
`try { await writeCache(...) } catch (...) { ... }`. Nessuna chiamata
fire-and-forget. Copre **INVARIANTE 4** del DESIGN §11.

- [ ] Ogni `writeCache(` è in `await` dentro `try/catch`
- [ ] Nessun `writeCache(` fire-and-forget

### Matrice di copertura INVARIANTI (DESIGN §11)

| Invariante | Task | Gate |
|---|---|---|
| INV-1 (`isDataReady` solo con `Array` validi) | T1, T3 | G3 |
| INV-2 (`await` su `readCache`/`isCacheStale`) | T1, T2 | G2 |
| INV-3 (una sola hydration alla volta) | T4 | G1 + G4 (test concorrenza) |
| INV-4 (`writeCache` fail-soft) | T5 | G5 |
| INV-5 (vuoto legittimo ≠ hydration fallita) | T1, T2, T3 | G3 + G4 (test Caso A/B) |

---

## 8. Riferimenti

- DESIGN: [docs/2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md](../2-projects/007-DESIGN_async-cache-hydration_v0.1.0.md)
- PLAN: [docs/3-coding-plans/007-PLAN_async-cache-hydration_v0.1.0.md](../3-coding-plans/007-PLAN_async-cache-hydration_v0.1.0.md)
- Spec test: [__tests__/AppDataContext.spec.ts](../../__tests__/AppDataContext.spec.ts)
- Report fonte: [docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md](../1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md) (punto N9)
- DESIGN 001 (precondizione): [docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md](../2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md)
- DESIGN 002 (precondizione): [docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md](../2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md)
- DESIGN 008 (confine fuori scope): [docs/2-projects/008-DESIGN_network-connectivity_v0.1.0.md](../2-projects/008-DESIGN_network-connectivity_v0.1.0.md)
- File perimetro: [src/context/AppDataContext.tsx](../../src/context/AppDataContext.tsx)
- Modulo cache (non toccato): [src/lib/supabase/cache.ts](../../src/lib/supabase/cache.ts)
