---
tipo: design
titolo: Async cache hydration — bootstrap lifecycle AppDataContext
versione: 0.1.0
data: 2026-05-20
stato: IMPLEMENTED
sorgente: docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md
perimetro: src/context/AppDataContext.tsx
---

# DESIGN 007 — Async cache hydration — bootstrap lifecycle AppDataContext

> **Scope**: formalizzare il bootstrap lifecycle di `AppDataContext` e
> correggere l'uso sincrono delle API asincrone del modulo cache. In
> scope: contratto di `isLoading` e `isDataReady`, state machine del
> bootstrap, distinzione tra vuoto legittimo ed errore, strategia
> cache-first e stale-while-revalidate, contratto di concorrenza per
> `refreshAll`, failure strategy per `writeCache`.
>
> **Fuori scope**: rilevamento della connessione di rete (`navigator.onLine`,
> `useOnlineStatus`, `NetInfo`), competenza di DESIGN 008.
>
> **Fonte primaria**: punto N9 del report di diagnosi compatibilità
> React Native
> ([REPORT_diagnosi-compatibilita-RN_v0.1.0.md](../1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md)).

---

## 1. Contesto e precondizioni

Il report di diagnosi compatibilità React Native, al punto **N9**,
documenta che `src/context/AppDataContext.tsx` invoca le funzioni del
modulo `src/lib/supabase/cache.ts` come se fossero sincrone, mentre
queste sono `async` perché si appoggiano ad `AsyncStorage`. La
conseguenza, citata letteralmente dal report, è che «il `Promise` è
truthy quindi il guard non scatta; `.data` è `undefined`», con il
risultato che `applyDomainSnapshot` viene invocato con `undefined` per
ogni collezione e i render successivi crashano su `accounts.map` o
analoghi.

Questo documento definisce l'architettura della correzione, riformulando
il bootstrap dei dati di dominio come una **state machine esplicita**
con contratti chiari su `isLoading`, `isDataReady` ed `error`.

### Precondizioni obbligatorie

L'implementazione di qualunque elemento di questo design può iniziare
solo dopo che entrambe le precondizioni seguenti siano soddisfatte e
mergiate:

1. **DESIGN 001 — Fix blocchi avvio** completamente implementato.
   AsyncStorage deve essere installato alla versione corretta della
   serie 2.x sul registry pubblico. Il fix B5 documentato nel report
   diagnosi indica che la dichiarazione attuale `^3.0.2` punta a una
   major non pubblicata: senza la versione corretta installata, le
   primitive `AsyncStorage.getItem`/`AsyncStorage.setItem` su cui si
   appoggia il modulo cache non sono disponibili a runtime e la
   riscrittura asincrona di `readCachedDomainSnapshot` non avrebbe una
   base operativa.

2. **DESIGN 002 — Fix provider bootstrap** completamente implementato.
   `AuthProvider` deve essere stabile e montabile senza crash prima che
   la logica dati possa essere modificata. Il punto N9 si manifesta
   solo se l'albero dei provider sopravvive al primo render: finché
   N6, N8 e N11 non sono risolti, il crash di `AuthProvider` precede il
   bug N9 e ne maschera la diagnosi. Inoltre, `AppDataProvider` consuma
   `useAuth()` per leggere `isAuthenticated` e `user?.id`: la stabilità
   di `AuthContext` è precondizione strutturale.

### Indipendenza confermata

DESIGN 003, 004, 005 e 006 non hanno alcuna dipendenza diretta con
questo design. DESIGN 007 può procedere in parallelo con uno qualsiasi
di essi, una volta soddisfatte le due precondizioni elencate sopra.

---

## 2. Diagnosi della rottura async

I tre punti rotti descritti in questa sezione sono derivati esclusivamente
dalla lettura del codice reale di `src/context/AppDataContext.tsx`. I
nomi di funzione, variabili di stato e callback citati sono quelli
effettivamente presenti nel file alla data di questo documento.

### Punto A — `readCachedDomainSnapshot`

La callback `readCachedDomainSnapshot`, definita con `useCallback`,
invoca cinque volte `readCache` e cinque volte `isCacheStale` **senza
`await`**. Entrambe le funzioni del modulo cache sono dichiarate
`async` e restituiscono `Promise`.

Le conseguenze sono tre, concatenate:

1. Le costanti locali `accounts`, `transactions`, `categories`,
   `budgets`, `savingsGoals` ricevono ciascuna un oggetto `Promise`,
   non il risultato della lettura cache.
2. Il guard `if (!accounts || !transactions || !categories || !budgets
   || !savingsGoals) return null` non scatta mai: un `Promise` non
   risolto è truthy in JavaScript, quindi il guard considera la cache
   sempre presente anche quando non lo è.
3. L'oggetto `snapshot` viene costruito accedendo a `accounts.data`,
   `transactions.data`, eccetera, su istanze di `Promise`. Su un
   `Promise`, la proprietà `.data` è `undefined`. Lo snapshot risultante
   contiene `undefined` per ogni collezione.

Il risultato è una **hydration falsa-positiva**: la callback restituisce
un oggetto strutturalmente plausibile (`{ snapshot, isStale }`) ma con
collezioni `undefined`, indistinguibile a livello di tipo da una
hydration legittima riuscita.

Inoltre, il flag `isStale` calcolato da `[isCacheStale(...), ...].some(Boolean)`
applica `Boolean` a cinque `Promise`: ogni `Promise` è truthy, quindi
`isStale` risulta sempre `true`. Anche se gli altri aspetti fossero
corretti, il sistema dichiarerebbe sempre la cache come stale.

### Punto B — `hydrateFromCache`

La callback `hydrateFromCache`, anch'essa definita con `useCallback`,
dipende interamente da `readCachedDomainSnapshot` e ne eredita la
rottura. Il flusso attuale è il seguente:

1. Invoca `readCachedDomainSnapshot(userId)`.
2. Se il ritorno è `null`, imposta `error = OFFLINE_FIRST_ACCESS_MESSAGE`,
   `isLoading = false`, `isDataReady = false`.
3. Altrimenti, applica lo snapshot con `applyDomainSnapshot(cached.snapshot)`,
   imposta `error` con il messaggio cache (`OFFLINE_STALE_CACHE_MESSAGE`
   o `OFFLINE_CACHE_MESSAGE`), imposta `isLoading = false`,
   `isDataReady = true`, e restituisce `true`.

Poiché il Punto A garantisce che il ritorno di `readCachedDomainSnapshot`
non sia mai `null` (lo snapshot non valido attraversa il guard senza
filtraggio), il ramo "successo" viene sempre eseguito.
`applyDomainSnapshot` riceve uno snapshot con cinque collezioni
`undefined`, e `setAccounts(undefined)`, `setTransactions(undefined)`,
eccetera, vengono invocati.

Il bootstrap contract risulta rotto: il provider dichiara `isDataReady =
true` mentre le collezioni di stato sono `undefined`. Nessun segnale di
errore viene emesso. La UI a valle, leggendo `accounts` come `undefined`
e invocando metodi su di essi, crasha.

### Punto C — `writeCache` nel secondo `useEffect`

Il secondo `useEffect` del provider, dipendente da `accounts`, `budgets`,
`categories`, `isAuthenticated`, `isDataReady`, `savingsGoals`,
`transactions`, `user?.id`, invoca cinque volte `writeCache` **senza
`await` e senza gestione degli errori**.

La funzione `writeCache` è `async` e si appoggia ad
`AsyncStorage.setItem`, che può fallire (storage pieno, errore I/O,
quota superata sul backend nativo). Nello stato attuale:

1. Le cinque chiamate avviano cinque `Promise` "fire-and-forget".
2. Un eventuale rejection di una qualsiasi delle `Promise` non viene
   catturato. In React Native questo produce un `unhandled promise
   rejection` warning ma non un crash sincrono, e l'errore è
   silenziosamente perso dal contesto applicativo.
3. La cache può non aggiornarsi per una o più tabelle senza che il
   sistema applicativo lo sappia. Al successivo bootstrap offline, la
   cache letta sarà incoerente rispetto allo stato remoto più recente.

Questo è un fallimento **silenzioso**: non produce sintomi visibili
all'utente nel momento in cui avviene, ma corrompe la base di
conoscenza usata dal fallback offline.

---

## 3. Scenario di failure critico

Il percorso peggiore verificabile nel codice attuale è il seguente:

1. L'utente apre l'applicazione offline (o con rete instabile).
2. Il primo `useEffect` di bootstrap si attiva; il ramo che testa
   `navigator.onLine === false` invoca `hydrateFromCache(user.id)`
   (anche se `navigator.onLine` su React Native è perimetro di DESIGN 008,
   il codice attuale entra nel ramo cache anche tramite `catch` se la
   chiamata remota fallisce).
3. `hydrateFromCache` chiama `readCachedDomainSnapshot`, che — per il
   Punto A — costruisce uno snapshot con cinque collezioni `undefined`
   e lo restituisce come se fosse valido.
4. `hydrateFromCache` applica lo snapshot con `applyDomainSnapshot`,
   imposta `isLoading = false` e `isDataReady = true`.
5. L'albero React renderizza i consumer di `useAppData()` come se i dati
   fossero pronti.
6. I consumer leggono `accounts`, `transactions`, eccetera, che ora
   sono `undefined` (per effetto del `setState(undefined)` nel passo
   precedente) oppure rimasti agli array vuoti iniziali (se React
   normalizza lo `undefined` in fase di setState, dipende dalla versione).

Il risultato percepito dall'utente è in entrambi i casi una **UI
caricata completamente vuota, senza alcun errore visibile**: nessun
conto, nessuna transazione, nessun budget, nessun obiettivo, nessun
banner di errore, nessuno spinner. La percezione è: «i miei dati sono
spariti».

Questo non è un semplice errore di programmazione asincrona: è un
**bug critico di integrità percepita**. La distinzione fra "dati non
ancora caricati" e "dati assenti" è strutturalmente impossibile per
l'utente, perché il sistema dichiara di essere pronto su uno stato
invalido.

---

## 4. Bootstrap lifecycle e state machine

Il bootstrap dei dati di dominio è riformulato come una **state machine
esplicita** con sei stati distinti. Ogni transizione di stato è
governata da un evento osservabile e definisce univocamente i valori di
`isLoading`, `isDataReady` ed `error`.

### Stati

**IDLE**
- Significato: il provider è montato ma l'autenticazione non è ancora
  verificata, oppure l'utente non è autenticato.
- `isLoading = false`, `isDataReady = false`, `error = null`.
- Tutte le collezioni di stato sono array vuoti.

**HYDRATING**
- Significato: hydration in corso. Lettura dalla cache o caricamento
  dalla rete avviata, esito non ancora determinato.
- `isLoading = true`, `isDataReady = false`.
- `error` può essere `null` o contenere un messaggio informativo non
  bloccante (es. notifica di transizione).
- Nessun render dei dati di dominio.

**CACHE-READY**
- Significato: cache letta con successo e snapshot **validato** (vedi
  sezione 5). Refresh remoto in background eventualmente in corso.
- `isDataReady = true`.
- `isLoading = true` se il refresh remoto è in corso; `false` se la
  sessione è dichiarata offline in modo definitivo (perimetro DESIGN 008).
- `error` può contenere `OFFLINE_CACHE_MESSAGE` o
  `OFFLINE_STALE_CACHE_MESSAGE` come avviso non bloccante, oppure
  `null` se il refresh remoto è in corso senza messaggi.

**REMOTE-SYNC**
- Significato: refresh remoto in background completato con successo,
  snapshot remoto applicato sopra lo stato `CACHE-READY` corrente.
- `isLoading = false`, `isDataReady = true`, `error = null`.

**READY**
- Significato: stato stabile con dati validi disponibili. Raggiungibile
  da `HYDRATING` quando la cache è assente e il caricamento remoto va
  a buon fine, oppure da `REMOTE-SYNC` come stato di quiete successivo.
- `isLoading = false`, `isDataReady = true`, `error = null`.

**ERROR**
- Significato: hydration fallita senza cache disponibile o senza
  snapshot remoto valido.
- `isLoading = false`, `isDataReady = false`.
- `error` contiene un messaggio non null (ad esempio
  `OFFLINE_FIRST_ACCESS_MESSAGE`).

### Transizioni lecite

| Origine | Destinazione | Evento |
|---|---|---|
| `IDLE` | `HYDRATING` | Utente autenticato (`isAuthenticated = true`, `user?.id` presente). |
| `HYDRATING` | `CACHE-READY` | Cache presente **e** snapshot validato. |
| `HYDRATING` | `READY` | Cache assente, caricamento remoto riuscito. |
| `HYDRATING` | `ERROR` | Cache assente **e** caricamento remoto fallito o impossibile. |
| `CACHE-READY` | `REMOTE-SYNC` | Refresh remoto in background completato con successo. |
| `CACHE-READY` | `ERROR` | Refresh remoto fallito **e** decisione esplicita di degradare lo stato. Per default, un fallimento del refresh remoto non degrada `CACHE-READY` ma lascia lo stato invariato con eventuale log di errore. |
| `REMOTE-SYNC` | `READY` | Stato di quiete: nessuna operazione in corso. |
| `READY` | `HYDRATING` | Invocazione esplicita di `refreshAll`. |
| `ERROR` | `HYDRATING` | Invocazione esplicita di `refreshAll` o nuovo tentativo. |
| Qualsiasi stato autenticato | `IDLE` | Logout o `isAuthenticated` torna `false`. |

### Transizioni vietate

- `HYDRATING` → `CACHE-READY` con snapshot **non validato**. La
  validazione è precondizione assoluta della transizione (vedi
  sezione 5).
- `HYDRATING` → `READY` senza che `loadDomainSnapshot` abbia restituito
  un valore completo e tipato.
- `IDLE` → `READY` diretto. Una hydration intermedia è sempre richiesta.
- Qualunque transizione da `ERROR` ad uno stato con `isDataReady = true`
  senza passare da `HYDRATING`.

---

## 5. Contratto di `isLoading` e `isDataReady`

I due flag `isLoading` e `isDataReady` espongono il bootstrap state ai
consumer di `useAppData()`. Il loro contratto deve essere stretto per
impedire che la UI tratti dati invalidi come validi.

### `isLoading`

`isLoading` rimane `true` finché **tutte** le seguenti condizioni non
sono soddisfatte simultaneamente:

- La hydration in corso (lettura cache o caricamento remoto) è terminata.
- Lo snapshot risultante è stato validato secondo i criteri della
  sottosezione "Validazione dello snapshot".
- L'eventuale fallback è stato concluso (in successo o in errore).

`isLoading` **non può** diventare `false` prima che lo stato del
bootstrap sia determinato in modo definitivo. In particolare, non è
ammesso impostare `isLoading = false` come effetto collaterale di
un'operazione asincrona che non sia la conclusione esplicita di una
transizione di stato della state machine.

### `isDataReady`

`isDataReady` può diventare `true` **solo se** tutte le seguenti
condizioni sono vere:

- La hydration è completata (state machine in `CACHE-READY`,
  `REMOTE-SYNC` o `READY`).
- Lo snapshot applicato è coerente: nessuna collezione è `undefined` e
  nessuna collezione è un `Promise` non risolto.
- Le primitive asincrone (`readCache`, `isCacheStale`) sono state
  attese (`await`) e i loro risultati sono stati ispezionati.

`isDataReady` **non può essere `true`** se anche solo una delle seguenti
condizioni è vera:

- Lo snapshot contiene almeno una collezione `undefined`.
- Lo snapshot contiene almeno un valore di tipo `Promise`.
- La hydration è in corso e non è ancora transitata in uno stato con
  dati validi.

### Validazione dello snapshot

Il sistema dichiara `isDataReady = true` **solo dopo** che uno snapshot
candidato è stato sottoposto a validazione strutturale. La validazione
è il controllo che, per ciascuna delle cinque collezioni
(`accounts`, `transactions`, `categories`, `budgets`, `savingsGoals`):

- Il valore sia un `Array` (verifica strutturale, non solo truthiness).
- Il valore non sia `undefined` né `null`.
- Il valore non sia un `Promise` (verifica esplicita per impedire
  che il bug N9 si ripresenti se in futuro la pipeline async venisse
  alterata).

Uno snapshot che fallisce la validazione **non** è un input lecito per
`applyDomainSnapshot` e **non** può portare la state machine in
`CACHE-READY`. La transizione corretta è verso `ERROR` se non esiste
alternativa, oppure il mantenimento di `HYDRATING` se il caricamento
remoto è ancora in corso.

### Regola architetturale invariante

Non basta che una `Promise` sia in stato resolved perché lo snapshot sia
valido. Serve che il **valore risolto sia stato letto, validato
strutturalmente e applicato come tale**. Una `Promise` resolved che
contiene `null` (cache miss) è un esito legittimo di
`readCache` e produce uno snapshot non-validato per quella collezione.

---

## 6. Distinzione tra vuoto legittimo ed errore

Esistono due situazioni in cui le cinque collezioni di stato risultano
contenere zero elementi. Hanno significato architetturale **opposto** e
il sistema deve essere in grado di distinguerle.

### Caso A — Vuoto legittimo

**Definizione**: l'utente è autenticato ma non ha ancora inserito alcun
conto, transazione, categoria, budget o obiettivo. La hydration è
completata con successo, lo snapshot remoto è stato caricato e
validato, e contiene effettivamente array vuoti.

**Stato del sistema**:
- `isDataReady = true`.
- `isLoading = false`.
- `error = null`.
- State machine in `READY` o `REMOTE-SYNC`.

Questo è uno stato pienamente valido. La UI deve interpretarlo come
"nessun dato da mostrare" e proporre i flussi di primo inserimento.

### Caso B — Hydration fallita

**Definizione**: la hydration ha prodotto uno snapshot invalido (cache
miss su tutte le tabelle senza fallback remoto disponibile, oppure —
nel codice attuale — il bug N9 che genera collezioni `undefined`).

**Stato del sistema**:
- `isDataReady = false`.
- `isLoading = false`.
- `error` contiene un messaggio non `null` (esempio:
  `OFFLINE_FIRST_ACCESS_MESSAGE`).
- State machine in `ERROR`.

La UI deve interpretarlo come "dati non disponibili" e proporre
un'azione di retry o un percorso di degradazione esplicito.

### Criterio di discriminazione

Il sistema distingue i due casi sulla base dei seguenti criteri
operativi:

- Il **Caso A** si determina quando `loadDomainSnapshot` (caricamento
  remoto) ha restituito un oggetto strutturalmente valido in cui le
  cinque collezioni sono effettivamente `Array` (eventualmente vuoti),
  e la validazione dello snapshot è passata.
- Il **Caso B** si determina quando `readCachedDomainSnapshot`
  restituisce `null` (nessuna entry cache per una o più tabelle e nessun
  fallback remoto), oppure quando la validazione dello snapshot
  candidato fallisce per la presenza di valori `undefined` o `Promise`.

Il discriminante è la **provenienza** e la **validazione** dello
snapshot, non il conteggio degli elementi. Un array vuoto da fonte
validata è legittimo. Un array vuoto da fonte non validata è un errore.

---

## 7. Strategia cache-first e stale-while-revalidate

Il bootstrap adotta una strategia **cache-first con stale-while-revalidate**.
L'obiettivo è ottenere uno startup percepito immediato senza bloccare
l'utente in attesa della rete, mantenendo allo stesso tempo la
coerenza dei dati con il backend.

### Casi della strategia

**Caso 1 — Cache presente e non stale**:
1. Caricare lo snapshot dalla cache.
2. Validare lo snapshot.
3. Transitare in `CACHE-READY`, dichiarare `isDataReady = true`.
4. Avviare in background il refresh remoto, **senza** bloccare la UI.
5. Al completamento del refresh, transitare in `REMOTE-SYNC` applicando
   lo snapshot remoto sopra lo stato `CACHE-READY` corrente.

**Caso 2 — Cache presente e stale**:
1. Caricare lo snapshot dalla cache.
2. Validare lo snapshot.
3. Transitare in `CACHE-READY` con `error = OFFLINE_STALE_CACHE_MESSAGE`
   (avviso non bloccante già presente nel codice attuale).
4. Avviare in background il refresh remoto, senza bloccare la UI.
5. Al completamento del refresh, transitare in `REMOTE-SYNC` come nel
   Caso 1.

**Caso 3 — Cache assente e rete disponibile**:
1. Caricare lo snapshot da rete tramite `loadDomainSnapshot`.
2. Validare lo snapshot.
3. Transitare direttamente in `READY`.

**Caso 4 — Cache assente e rete non disponibile**:
1. Transitare in `ERROR` con `error = OFFLINE_FIRST_ACCESS_MESSAGE`.
2. Non avviare alcuna operazione di caricamento dati.

### Determinazione della disponibilità di rete

La determinazione di "rete disponibile" o "rete non disponibile" è
**fuori perimetro** di DESIGN 007 (vedi sezione 10). DESIGN 007 assume
che esista un meccanismo affidabile di detection, definito da
DESIGN 008. Nel contratto di DESIGN 007 la disponibilità di rete è
trattata come una precondizione esterna alla state machine.

### Giustificazione architetturale

La strategia stale-while-revalidate garantisce:

- **Startup immediato**: l'utente vede i propri dati dal primo render
  utile, senza dipendere dalla latenza di rete.
- **Continuità percepita**: anche in transizione fra online e offline,
  l'esperienza utente non si interrompe finché esiste una cache valida.
- **Coerenza eventuale**: il refresh remoto in background allinea
  silenziosamente lo stato locale al backend, senza richiedere
  intervento dell'utente.

---

## 8. Concorrenza di `refreshAll`

Quando `hydrateFromCache` diventa asincrona, `refreshAll` diventa
**concurrency-sensitive**. Il guard attualmente in vigore,
`if (isLoading || !user?.id) return`, è insufficiente per il motivo
seguente:

- `isLoading` è uno stato React, aggiornato in modo asincrono e
  riconciliato dal renderer in batch.
- Fra l'inizio di una hydration asincrona e la propagazione di
  `setIsLoading(true)` al re-render successivo esiste una finestra in
  cui un secondo invoco di `refreshAll` può osservare ancora
  `isLoading = false` e procedere con una seconda hydration concorrente.

### Comportamento atteso

Il comportamento atteso da `refreshAll` è il seguente:

- Un invoco di `refreshAll` mentre una hydration è già in corso deve
  essere **ignorato**.
- Hydration completate fuori ordine **non** devono sovrascrivere uno
  stato più recente. Se una hydration A è iniziata prima di una
  hydration B ma termina dopo, il risultato di A non deve essere
  applicato sopra il risultato di B.
- Allo stesso modo, una hydration interrotta da un logout
  (`isAuthenticated` torna `false`) **non** deve applicare il proprio
  risultato dopo che lo stato è transitato in `IDLE`.

### Contratto invariante

Il contratto è: **una sola hydration alla volta**. L'invariante è
dichiarata a livello architetturale.

Il meccanismo tecnico per implementare l'invariante (flag booleano
sincrono fuori dal ciclo React, `useRef`, cancellation token, generation
counter, AbortController, oppure altra primitiva equivalente) è
**competenza del Coding Plan 007**. DESIGN 007 si limita a definire il
contratto comportamentale; non prescrive il meccanismo.

---

## 9. Failure strategy per `writeCache`

Il secondo `useEffect` del provider, che scrive lo stato corrente nelle
cinque cache, adotta una strategia **fail-soft con logging**.

### Comportamento atteso

In caso di errore durante l'invocazione di `writeCache` per una qualsiasi
delle cinque tabelle:

- L'applicazione **non crasha**: l'errore deve essere catturato e non
  propagato come `unhandled promise rejection`.
- L'errore viene registrato attraverso il meccanismo di logging del
  progetto (canale specifico definito dal Coding Plan 007).
- I dati in memoria (gli array `accounts`, `transactions`, eccetera)
  rimangono validi: lo stato React non viene alterato dal fallimento
  della scrittura.
- La cache per la tabella fallita **non** viene aggiornata in questa
  sessione: l'ultima scrittura riuscita rimane in vigore fino alla sua
  scadenza naturale (TTL `CACHE_TTL_MS`).

### Non richieste

In questa versione del design **non** sono richieste:

- **Retry automatico** della scrittura fallita.
- **Invalidazione** della cache esistente in caso di errore di scrittura:
  la cache precedente, se presente, rimane valida fino alla sua
  scadenza naturale.
- **Notifica visiva** all'utente del fallimento della scrittura cache:
  la cache è un'ottimizzazione di startup, non una funzionalità
  utente-visibile.

### Giustificazione architetturale

La cache è uno strumento di **resilienza offline**, non una fonte
primaria di verità. Il fallimento occasionale di una scrittura cache
degrada la copertura offline futura, ma non altera l'esperienza utente
corrente. Una strategia complessa di retry o invalidazione
introdurrebbe complessità sproporzionata rispetto al beneficio.

---

## 10. Perimetro e fuori perimetro

### In scope

- Riscrittura asincrona di `readCachedDomainSnapshot` con `await`
  esplicito su `readCache` e `isCacheStale`.
- Riscrittura asincrona di `hydrateFromCache` per attendere il risultato
  di `readCachedDomainSnapshot`.
- Correzione delle chiamate a `hydrateFromCache` nel `useEffect` di
  bootstrap e in `refreshAll`, garantendo l'attesa o la gestione
  esplicita della `Promise`.
- Correzione delle chiamate a `writeCache` nel secondo `useEffect` con
  cattura degli errori.
- Formalizzazione della state machine del bootstrap (sezione 4).
- Contratto di `isLoading` e `isDataReady` (sezione 5).
- Distinzione fra vuoto legittimo ed errore (sezione 6).
- Strategia cache-first e stale-while-revalidate (sezione 7).
- Contratto di concorrenza per `refreshAll` (sezione 8).
- Failure strategy per `writeCache` (sezione 9).

### Fuori scope

- **Rilevamento della connessione di rete**: `navigator.onLine`,
  `useOnlineStatus`, `NetInfo` o qualsiasi altro meccanismo di detection
  della connessione. Questo è perimetro esclusivo di **DESIGN 008**.
  DESIGN 007 assume che il segnale di disponibilità di rete sia fornito
  da un componente esterno e si comporta sulla base di quel segnale
  senza definirne l'implementazione.
- **Modifiche a `src/lib/supabase/cache.ts`**: il modulo è già corretto
  per React Native (vedi Gruppo 3 del report di diagnosi). Nessuna
  modifica viene apportata in questo design.
- **Modifiche alle funzioni dei repository** (`conti`, `transazioni`,
  `categorie`, `budget`, `obiettivi-risparmio`): rimangono invariate.
- **Implementazione di spinner, banner di errore o componenti UI** per
  la rappresentazione visiva degli stati di bootstrap: competenza del
  Coding Plan 007 e dei futuri design UI.
- **Migrazione di dati esistenti**: non necessaria. Le modifiche sono
  interne al bootstrap lifecycle e non alterano il formato dei dati
  persistiti né su `AsyncStorage` né su Supabase.
- **Sostituzione di `sonner`**: bloccante separato (B3 del report
  diagnosi), competenza di un design dedicato.
- **Sostituzione di `downloadFile`** in `handleExportCSV`: problema
  separato (N10 del report), fuori perimetro.

---

## 11. Invarianti architetturali

Le seguenti invarianti sono dichiarate a livello architetturale.
Nessuna implementazione futura del bootstrap di `AppDataContext` può
violarle. Una modifica al codice che le violi è da considerarsi
regressione di sicurezza percepita.

**INVARIANTE 1**
`isDataReady` può essere `true` solo se ogni collezione dello snapshot
applicato (`accounts`, `transactions`, `categories`, `budgets`,
`savingsGoals`) è un `Array`, **non** un `Promise` e **non** `undefined`.

**INVARIANTE 2**
`hydrateFromCache` non può dichiarare `isDataReady = true` prima che
`readCachedDomainSnapshot` abbia completato l'`await` di tutte le
chiamate a `readCache` e `isCacheStale`.

**INVARIANTE 3**
Una sola operazione di hydration può essere attiva contemporaneamente.
Operazioni concorrenti non sono ammesse. Hydration completate fuori
ordine non possono sovrascrivere uno stato più recente.

**INVARIANTE 4**
Un errore di scrittura su `AsyncStorage` durante `writeCache` non può
causare crash dell'applicazione né propagarsi come `unhandled promise
rejection`.

**INVARIANTE 5**
Vuoto legittimo e hydration fallita producono stati applicativi
distinti e non intercambiabili. Lo stato `(isDataReady = true, error =
null, collezioni vuote)` denota esclusivamente il Caso A della
sezione 6. Lo stato `(isDataReady = false, error ≠ null)` denota
esclusivamente il Caso B.

---

## 12. Dipendenze da altri design

### Precondizioni obbligatorie

- **DESIGN 001 — Fix blocchi avvio** ([001-DESIGN_fix-blocchi-avvio_v0.1.0.md](001-DESIGN_fix-blocchi-avvio_v0.1.0.md)):
  AsyncStorage deve essere installato alla versione corretta della
  serie 2.x. Senza la primitiva di storage funzionante, il modulo cache
  non opera e la riscrittura asincrona di questo design non ha base
  operativa.
- **DESIGN 002 — Fix provider bootstrap** ([002-DESIGN_fix-provider-bootstrap_v0.2.0.md](002-DESIGN_fix-provider-bootstrap_v0.2.0.md)):
  `AuthProvider` deve essere stabile e montabile senza crash.
  `AppDataProvider` consuma `useAuth()`: senza un `AuthContext`
  funzionante, il bug N9 è mascherato dal crash a monte di N6/N8.

### Indipendenza confermata

- **DESIGN 003** (fix accessibility engine), **DESIGN 004**
  (announcements layer), **DESIGN 005** (sostituzione `crypto.subtle`),
  **DESIGN 006** (KDF PIN): nessuna dipendenza diretta. DESIGN 007 può
  procedere in parallelo con qualsiasi di questi, una volta soddisfatte
  le precondizioni di DESIGN 001 e DESIGN 002.

### Confine con DESIGN 008

- **DESIGN 008** definirà il meccanismo di rilevamento della connessione
  di rete per React Native (sostituzione di `navigator.onLine` e di
  `useOnlineStatus`, perimetro N5 del report). DESIGN 007 **non tocca**
  `navigator.onLine`, `useOnlineStatus`, `NetInfo` o qualsiasi altro
  meccanismo di detection della connessione. Quei meccanismi sono
  perimetro esclusivo di DESIGN 008.
- Il segnale di disponibilità di rete è trattato in DESIGN 007 come una
  precondizione esterna alla state machine: il Caso 4 della strategia
  cache-first (sezione 7) si attiva sulla base di tale segnale, ma la
  produzione del segnale non è in scope.
