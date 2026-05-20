---
tipo: design
titolo: Network connectivity — sostituzione browser detection con NetInfo
versione: 0.1.0
data: 2026-05-20
stato: DRAFT
sorgente: docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md
perimetro: src/hooks/use-online-status.ts, src/context/AppDataContext.tsx
---

# DESIGN 008 — Network connectivity — sostituzione browser detection con NetInfo

> **Scope**: formalizzare il *connectivity contract* dell'applicazione,
> sostituendo il rilevamento di rete basato su `navigator.onLine` e
> `window.addEventListener('online'|'offline')` — non funzionante in
> React Native — con un produttore centralizzato basato su NetInfo
> (`NetworkStatusProvider` + hook pubblico `useNetworkStatus`). In scope:
> contratto del segnale, semantica offline con distinzione
> `isConnected`/`isInternetReachable`, debounce del flapping, fallback
> Windows, posizione nell'albero dei provider, boundary producer-consumer
> con DESIGN 007.
>
> **Fuori scope**: bootstrap lifecycle e state machine dei dati
> (DESIGN 007); logica di fallback alla cache, hydration, `refreshAll`,
> `writeCache` (DESIGN 007); componenti UI per stato offline; B3
> (sostituzione `sonner`); N10 (sostituzione `downloadFile`).
>
> **Fonte primaria**: punto **N5** del report di diagnosi compatibilità
> React Native
> ([REPORT_diagnosi-compatibilita-RN_v0.1.0.md](../1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md)).

---

## 1. Contesto e precondizioni

Il report di diagnosi compatibilità React Native, al punto **N5**,
documenta letteralmente che `src/hooks/use-online-status.ts`:

> «usa `navigator.onLine` e `window.addEventListener('online'|'offline')`.
> In RN questi eventi non vengono mai emessi: lo stato resta
> `isOffline = false` perpetuamente.»

La conseguenza diretta è che l'app, su React Native (Android, iOS,
Windows), non ha alcun rilevamento operativo della connessione di rete.
Inoltre, `src/context/AppDataContext.tsx` ripete due volte un controllo
inline `navigator.onLine === false` senza nemmeno passare per il hook,
con il medesimo difetto.

Questo documento definisce l'architettura del produttore del segnale di
connettività, riformulando il rilevamento come un *connectivity contract*
centralizzato, fault-tolerant e cross-platform, basato su NetInfo.

### Precondizioni obbligatorie

L'implementazione di qualunque elemento di questo design può iniziare
solo dopo che le precondizioni seguenti siano soddisfatte e mergiate:

1. **DESIGN 001 — Fix blocchi avvio** completamente implementato.
   L'alias `@/*` di Babel/TypeScript deve essere funzionante: senza
   l'alias risolto, il nuovo hook `useNetworkStatus` non è importabile
   dai consumer (`@/hooks/use-network-status`) e il provider non è
   posizionabile in `App.tsx`.

2. **DESIGN 002 — Fix provider bootstrap** completamente implementato.
   `AuthProvider` deve essere stabile: `NetworkStatusProvider` viene
   posizionato nell'albero dei provider sopra `AuthProvider` e
   `AppDataProvider`. Un albero dei provider fragile precede e maschera
   ogni difetto del nuovo provider.

3. **DESIGN 007 — Async cache hydration** deve essere in stato
   **REVIEWED** prima dell'implementazione di DESIGN 008. Il contratto
   del segnale rete che DESIGN 008 produce è definito dalla state
   machine di DESIGN 007 (vedi Sezione 8): senza il contratto
   consumatore stabile, il produttore non ha un capitolato verificabile.
   Questo requisito è soddisfatto alla data di creazione di questo
   documento.

### Posizione del provider

`NetworkStatusProvider` viene posizionato nell'albero dei provider di
`App.tsx` **sopra** `AppDataProvider` (e per coerenza architetturale
sopra `AuthProvider`). Le motivazioni di dettaglio sono in Sezione 4.

### Indipendenza confermata

DESIGN 003 (accessibility engine), DESIGN 004 (announcements layer),
DESIGN 005 (sostituzione `crypto.subtle`), DESIGN 006 (KDF PIN): nessuna
dipendenza diretta. DESIGN 008 può procedere in parallelo con uno
qualsiasi di questi una volta soddisfatte le precondizioni.

---

## 2. Diagnosi dell'incompatibilità browser

I due punti di rottura descritti in questa sezione sono derivati
esclusivamente dalla lettura del codice reale alla data di questo
documento.

### Punto A — `src/hooks/use-online-status.ts`

Il file espone la funzione `useOnlineStatus` come unico hook pubblico.
Internamente:

- La funzione locale `getInitialOfflineState` calcola lo stato iniziale
  con il guard `if (typeof navigator === 'undefined') return false`.
  In React Native (Hermes) `navigator` esiste come oggetto polyfill
  fornito dal runtime, quindi il guard **non scatta**. Il codice
  prosegue e legge `navigator.onLine === false`. Il valore restituito
  da `navigator.onLine` su React Native non rispecchia lo stato reale
  della rete e, anche se lo facesse, non viene mai aggiornato in
  seguito.

- Il `useEffect` registra due listener tramite
  `window.addEventListener('online', ...)` e
  `window.addEventListener('offline', ...)`. In React Native, gli
  eventi `online` e `offline` di `window` **non vengono mai emessi**:
  l'evento source DOM non esiste su questa piattaforma. I due
  `setIsOffline` non vengono mai invocati durante la vita del
  componente.

- Conseguenza: `isOffline` rimane bloccato sul valore iniziale per
  tutta la vita del consumer, indipendentemente da ciò che accade alla
  connessione reale del dispositivo.

- Il nome esportato è `useOnlineStatus`. Questo è il nome con cui i
  consumer attuali importano il hook ed è il nome che la migrazione
  verso il nuovo contratto deve gestire (Sezione 4).

### Punto B — Controlli inline in `src/context/AppDataContext.tsx`

`AppDataContext.tsx` **non** importa `useOnlineStatus`. Accede
direttamente a `navigator.onLine` in due punti distinti, entrambi con
la stessa forma testuale:

```
if (typeof navigator !== 'undefined' && navigator.onLine === false) { ... }
```

Le due occorrenze sono:

1. All'interno della funzione interna `loadBootstrapData` del primo
   `useEffect` di bootstrap. Quando la condizione è vera, viene
   invocato `hydrateFromCache(user.id)`, attivando il ramo
   offline-first del bootstrap descritto in DESIGN 007 (Sezione 7,
   Caso 4).

2. All'interno della funzione interna `reloadData` di `refreshAll`.
   Stessa semantica: ramo cache-first se rete assente.

Su React Native `navigator.onLine === false` non è mai vero
(il valore esposto dal polyfill Hermes resta `true`). La conseguenza è
che il ramo offline-first del bootstrap, il messaggio
`OFFLINE_FIRST_ACCESS_MESSAGE` e il comportamento cache-first
formalizzati in DESIGN 007 **non si attivano mai** nel codice attuale
sulle piattaforme target. L'app cade nel ramo remoto, riceve un errore
di rete, ed entra nel `catch` che a sua volta invoca
`hydrateFromCache`: l'esito finale è simile, ma non per la via
architettonicamente corretta, e con latenza aggiuntiva dovuta al
tentativo remoto fallito.

Le costanti `OFFLINE_FIRST_ACCESS_MESSAGE`, `OFFLINE_CACHE_MESSAGE`,
`OFFLINE_STALE_CACHE_MESSAGE` sono definite in `AppDataContext.tsx` e
restano di competenza di DESIGN 007: questo documento le cita solo per
tracciare la conseguenza del bug N5 sul flusso descritto da DESIGN 007.

---

## 3. Il vero obiettivo architetturale

DESIGN 008 **non** è una semplice sostituzione di `navigator.onLine`
con una chiamata equivalente a NetInfo. Il vero obiettivo è formalizzare
un **connectivity contract**:

- **Stabile**: il segnale ha una forma tipizzata invariata nel tempo.
- **Centralizzato**: prodotto da un unico punto dell'albero (provider).
- **Fault-tolerant**: degrada in modo prevedibile se il meccanismo di
  rilevamento fallisce.
- **Cross-platform**: si comporta in modo coerente su Android, iOS e
  Windows, con strategia di fallback esplicita per la piattaforma
  meno stabile.
- **Indipendente dai consumer**: i consumer non sanno come il segnale
  è prodotto, non importano direttamente NetInfo, non registrano
  propri listener.

Il documento definisce il **produttore** del segnale di connessione.
Il **consumatore** del segnale è DESIGN 007 (e in futuro altri).

**Boundary invariante**: il produttore non deve sapere come il
consumatore usa il segnale. Il consumatore non deve sapere come il
produttore lo genera. Qualsiasi modifica futura al meccanismo di
rilevamento (passaggio a un'API diversa, aggiunta di probing attivo,
ecc.) deve restare invisibile ai consumer fintantoché il contratto di
Sezione 5 è onorato.

---

## 4. Architettura del segnale di rete

La soluzione architetturale adottata è composta da due elementi:
`NetworkStatusProvider` (produttore) e `useNetworkStatus` (interfaccia
di lettura pubblica).

### `NetworkStatusProvider`

`NetworkStatusProvider` è un provider React. Le sue responsabilità sono:

- Posizionarsi in `App.tsx` **sopra** `AppDataProvider` e `AuthProvider`
  (vedi sottosezione "Posizione nell'albero dei provider").
- Istanziare una **singola** subscription a NetInfo al mount.
- Aggiornare il proprio stato interno in risposta agli aggiornamenti di
  NetInfo, applicando il debounce sulle transizioni
  online → offline (Sezione 6).
- Tradurre i campi di NetInfo nella struttura tipizzata del
  connectivity contract (Sezione 5).
- Esporre lo stato corrente tramite React Context.
- Gestire il cleanup della subscription al proprio unmount (Sezione 9).
- **Non esporre** direttamente l'oggetto NetInfo, il suo tipo, o
  qualsiasi sua API: i consumer ricevono solo il contratto.

### `useNetworkStatus`

`useNetworkStatus` è l'unico punto di accesso pubblico al segnale di
connessione. Le sue responsabilità sono:

- Leggere il context di `NetworkStatusProvider`.
- Restituire un valore conforme al tipo `NetworkStatus` definito in
  Sezione 5.
- Sollevare un errore di programmazione esplicito se invocato fuori
  dall'albero di `NetworkStatusProvider` (analogamente ad altri hook
  context del progetto).

**Vincoli sui consumer**:

- I consumer non importano NetInfo direttamente.
- I consumer non leggono `navigator.onLine`.
- I consumer non registrano `window.addEventListener('online'|'offline')`.
- I consumer non creano proprie subscription di rete aggiuntive.

### Strategia di migrazione del nome

Il hook attuale si chiama `useOnlineStatus`. Il nuovo hook si chiama
`useNetworkStatus`. La rinominazione è una **rottura dell'interfaccia
pubblica** del modulo hooks.

DESIGN 008 dichiara che il contratto descritto in Sezione 5 deve essere
onorato dai consumer. La scelta tra le due strategie seguenti è
delegata al **Coding Plan 008**:

- **Strategia A — Migrazione completa**: tutti gli import di
  `useOnlineStatus` sono aggiornati a `useNetworkStatus` e la forma di
  ritorno viene adattata al nuovo tipo `NetworkStatus`. Il vecchio file
  `use-online-status.ts` viene rimosso o trasformato nel nuovo file
  `use-network-status.ts`.
- **Strategia B — Alias di compatibilità**: `useOnlineStatus` viene
  mantenuto come thin wrapper che delega a `useNetworkStatus` ed
  espone una shape di ritorno retrocompatibile (almeno il campo
  `isOffline`). Utile se la migrazione dei consumer è incrementale.

DESIGN 008 non vincola la scelta. Vincola solo il risultato:
nessun consumer può rimanere bloccato sul rilevamento `navigator.onLine`
dopo l'implementazione.

### Posizione nell'albero dei provider

`NetworkStatusProvider` deve essere posizionato in `App.tsx`:

- **Sopra `AppDataProvider`**: `AppDataProvider` consuma il segnale di
  rete tramite `useNetworkStatus` (perimetro DESIGN 007). Per garantire
  che il context sia disponibile durante il bootstrap di
  `AppDataProvider`, il provider di rete deve essere montato prima.

- **Sopra `AuthProvider`**: anche se `AuthProvider` non consuma
  attualmente il segnale, la posizione sopra è preferita per coerenza
  architetturale e per consentire eventuali future estensioni
  (es. retry policy autenticazione condizionata alla rete) senza
  richiedere riarrangiamenti dell'albero.

La posizione è dichiarata invariante in Sezione 11.

---

## 5. Semantica offline e connectivity contract

Il *connectivity contract* è la struttura tipizzata che
`NetworkStatusProvider` espone ai consumer. Definisce in modo
inequivocabile lo stato della connessione.

### Campi del contratto

Il contratto espone almeno i seguenti campi:

| Campo | Tipo | Significato |
|---|---|---|
| `isOffline` | `boolean` | `true` quando il dispositivo non ha connessione Internet operativa; `false` quando la connessione è disponibile. È il segnale primario consumato da DESIGN 007. |
| `connectionType` | `string` o enum | Tipo di connessione restituito da NetInfo (es. `wifi`, `cellular`, `none`, `unknown`, eventuali altri valori della libreria). Utile per decisioni future su payload e UX. |
| `isInitialized` | `boolean` | `true` dopo che `NetworkStatusProvider` ha ricevuto almeno una risposta da NetInfo; `false` durante l'inizializzazione. I consumer devono attendere `isInitialized = true` prima di basare decisioni critiche su `isOffline`. |

### Semantica di `isOffline`

`isOffline` è `true` quando almeno una delle seguenti condizioni è vera:

- `isConnected` da NetInfo è `false` o `null`.
- `isInternetReachable` da NetInfo è `false`.

`isOffline` è `false` solo quando, contemporaneamente:

- `isConnected` è `true`,
- `isInternetReachable` è `true` **o** `null`.

Il caso `isInternetReachable === null` è esplicitamente trattato come
"non determinato": in assenza di un'evidenza positiva di
*unreachability*, il comportamento adottato è **online-first**, in
coerenza con la strategia Fail-Safe Online-First (Sezione 7). I
consumer riceveranno transizioni successive quando NetInfo emetterà
una risposta non-`null`.

### Distinzione tra `isConnected` e `isInternetReachable`

I due campi di NetInfo **non sono equivalenti** e questa distinzione è
parte integrante del contratto:

- `isConnected = true` significa che il dispositivo è agganciato a
  una rete (Wi-Fi, cellulare, ecc.).
- `isInternetReachable = true` significa che Internet è effettivamente
  raggiungibile attraverso quella rete.

Il caso critico è la **captive portal**: una rete Wi-Fi aperta o una
rete aziendale con login obbligatorio produce
`isConnected = true` ma `isInternetReachable = false`. Per un'app
finanziaria offline-first questa situazione è **operativamente
equivalente** a "offline": Supabase non è raggiungibile e il fallback
alla cache è necessario.

DESIGN 008 dichiara che la captive portal deve essere trattata come
`isOffline = true`. Questa è una decisione architetturale invariante:
solo `isInternetReachable` veicola il significato operativo richiesto
da DESIGN 007.

---

## 6. Debounce e gestione del flapping

NetInfo può produrre transizioni rapide e temporanee dello stato di
connessione: disconnect transitori durante un cambio di rete
(es. handoff Wi-Fi → cellulare), reconnect immediati, falsi negativi
brevi su Android in seguito a sleep/wake. Questo fenomeno è
comunemente chiamato **flapping**.

### Conseguenze del flapping non mitigato

Senza mitigazione, il flapping produce transizioni rumorose nella state
machine di DESIGN 007:

- Bootstrap instabile, con oscillazione tra ramo remoto e ramo cache.
- Refresh multipli non necessari su `refreshAll`.
- Re-render della UI senza valore informativo per l'utente.

### Strategia adottata

`NetworkStatusProvider` applica un **debounce logico** sulle transizioni
**solo nella direzione online → offline**. Le transizioni
offline → online vengono propagate **immediatamente**.

- **Valore del debounce**: 1000 ms.
- **Motivazione del valore**: 1000 ms è sufficiente per filtrare i
  disconnect transitori tipici dei cambi rete su mobile, senza
  introdurre latenza percepibile nel rilevamento di un'assenza reale
  di rete.
- **Motivazione della direzionalità**: il ripristino della connessione
  è un evento che lo strato dati e la UI devono poter cogliere
  immediatamente per riattivare sincronizzazioni e azioni utente.
  Un debounce simmetrico ritarderebbe il recupero senza alcun beneficio
  in termini di stabilità.

### Localizzazione del debounce

Il debounce è implementato a livello di `NetworkStatusProvider`. Non è
implementato nel hook `useNetworkStatus` né nei consumer. I consumer
ricevono solo transizioni già filtrate: l'unica vista dello stato di
rete è il contratto stabile.

---

## 7. Compatibilità React Native Windows

Il progetto supporta React Native Windows (`react-native-windows` è
presente in `package.json`, lo script `npm run windows` è configurato).
Le decisioni architetturali devono tenere conto di questa piattaforma.

### Stato di NetInfo su Windows

NetInfo dichiara supporto ufficiale per Windows. Tuttavia:

- Windows è una piattaforma **out-of-tree** per React Native, mantenuta
  separatamente dal core.
- Alcune release di NetInfo possono divergere nel comportamento su
  Windows rispetto ad Android e iOS.
- Le subscription di rete su Windows possono emettere meno eventi, o
  emettere eventi con campi `null` in più occasioni di quanto avvenga
  su mobile.

### Strategia di fallback Windows — Fail-Safe Online-First

Se NetInfo non si inizializza correttamente — ad esempio:

- eccezione al momento del subscribe;
- valori `null` persistenti su entrambi `isConnected` e
  `isInternetReachable`;
- timeout senza risposta entro una soglia di inizializzazione
  ragionevole (definita dal Coding Plan 008);

allora `NetworkStatusProvider` deve impostare:

- `isOffline = false`,
- `isInitialized = true`,
- `connectionType = 'unknown'`,

e registrare un **warning** nel sistema di logging del progetto.

#### Motivazione

Un `isOffline = true` permanente per fallimento di NetInfo sarebbe
**catastrofico**: l'utente non potrebbe autenticarsi né sincronizzare
nulla, e l'app entrerebbe stabilmente nei rami offline di DESIGN 007
(Caso 4, `ERROR` con `OFFLINE_FIRST_ACCESS_MESSAGE` al primo accesso).

Assumere `online` in caso di fallimento del meccanismo di rilevamento
delega la gestione degli errori reali alla state machine di DESIGN 007,
che è progettata per gestirli: una chiamata Supabase fallita
attiverà comunque il fallback corretto.

**Principio**: un *false-offline permanente* è molto più pericoloso di
un *false-online temporaneo*.

#### Limite di applicazione

La strategia Fail-Safe Online-First si applica **esclusivamente al
fallimento del meccanismo di rilevamento** (NetInfo), non all'assenza
reale di rete. Se NetInfo funziona e rileva genuinamente
`isOffline = true`, quel segnale è quello corretto e deve essere
propagato senza alterazioni.

---

## 8. Contratto con DESIGN 007

### Boundary producer-consumer

- DESIGN 008 è il **produttore** del segnale rete.
- DESIGN 007 è il **consumatore** del segnale rete.
- DESIGN 008 non deve sapere come DESIGN 007 usa il segnale.
- DESIGN 007 non deve sapere come DESIGN 008 produce il segnale.

Questa separazione è dichiarata invariante (Sezione 11).

### Come DESIGN 007 consuma il segnale

La state machine di DESIGN 007 usa il segnale per discriminare i casi
della strategia cache-first formalizzata nella Sezione 7 di DESIGN 007:

- **Caso 3**: cache assente, rete disponibile → caricamento remoto,
  transizione diretta a `READY`.
- **Caso 4**: cache assente, rete non disponibile → transizione a
  `ERROR` con `OFFLINE_FIRST_ACCESS_MESSAGE`.

La fonte del segnale di "rete disponibile" / "rete non disponibile" è
`useNetworkStatus`, che restituisce `isOffline` dal connectivity
contract. I controlli inline `navigator.onLine === false` oggi
presenti in `AppDataContext.tsx` (Punto B di Sezione 2) vengono
rimossi dal Coding Plan 008 e sostituiti dalla lettura di
`useNetworkStatus().isOffline`.

### Momento di consumo

Il segnale deve essere **disponibile** (`isInitialized = true`) prima
che `AppDataProvider` esegua le decisioni di bootstrap che dipendono
dallo stato rete. Questa condizione è garantita dalla posizione di
`NetworkStatusProvider` sopra `AppDataProvider` nell'albero
(Sezione 4): React monta i provider top-down, quindi il context di
rete è popolato (almeno con `isInitialized = false`) prima che
`AppDataProvider` chiami `useNetworkStatus`.

### Comportamento durante `isInitialized = false`

Durante la fase iniziale, quando `NetworkStatusProvider` ha
sottoscritto NetInfo ma non ha ancora ricevuto la prima risposta:

- `AppDataProvider` deve trattare lo stato rete come **incerto**.
- `AppDataProvider` non deve procedere con la discriminazione tra
  Caso 3 e Caso 4 di DESIGN 007.
- Il bootstrap deve attendere `isInitialized = true` prima di
  determinare il percorso di hydration dipendente dalla rete.
- Lo stato `HYDRATING` della state machine di DESIGN 007 è lo stato
  corretto durante questa attesa: `isLoading = true`,
  `isDataReady = false`, nessun render dei dati di dominio.

Il meccanismo tecnico per implementare l'attesa
(effetto subordinato a `isInitialized`, guard nella callback di
bootstrap, oppure pattern equivalente) è competenza del Coding Plan 008.

---

## 9. Lifecycle e cleanup

### Mount

Al mount di `NetworkStatusProvider`:

- Sottoscrivere NetInfo (`NetInfo.addEventListener` o API equivalente
  per la versione installata).
- Avviare la ricezione degli aggiornamenti.
- Inizializzare lo stato del context con `isInitialized = false`.

### Durante la vita

A ogni evento NetInfo ricevuto:

- Tradurre i campi nel contratto (Sezione 5).
- Applicare il debounce per le transizioni online → offline
  (Sezione 6).
- Aggiornare il context tramite `setState`.
- Impostare `isInitialized = true` al primo evento ricevuto.

### Unmount

All'unmount del provider:

- Invocare la funzione di cleanup restituita da
  `NetInfo.addEventListener` (o equivalente per la versione usata).
- Annullare eventuali timer di debounce attivi.
- Garantire che **nessun `setState` venga chiamato dopo l'unmount**.

### Vincolo di unicità

La subscription NetInfo è **unica** per tutta l'applicazione: un solo
listener attivo per volta. Nessun consumer crea proprie subscription
aggiuntive (vedi Sezione 11, Invariante 2).

---

## 10. Perimetro e fuori perimetro

### In scope

- Riscrittura di `src/hooks/use-online-status.ts` con NetInfo come
  meccanismo di rilevamento (o creazione di `use-network-status.ts`
  equivalente, scelta del Coding Plan 008).
- Creazione di `NetworkStatusProvider`.
- Creazione del hook pubblico `useNetworkStatus`.
- Rimozione dei due controlli inline `navigator.onLine === false` da
  `src/context/AppDataContext.tsx` (righe in `loadBootstrapData` e
  `reloadData`) e sostituzione con il consumo del nuovo contratto.
- Definizione del connectivity contract (Sezione 5).
- Semantica offline con distinzione `isConnected` /
  `isInternetReachable` (Sezione 5).
- Gestione debounce e flapping (Sezione 6).
- Compatibilità e fallback Windows (Sezione 7).
- Posizione di `NetworkStatusProvider` nell'albero dei provider
  (Sezione 4).
- Strategia di migrazione del nome da `useOnlineStatus` a
  `useNetworkStatus` (Sezione 4).

### Fuori scope

- Bootstrap lifecycle e state machine dei dati di dominio: perimetro
  esclusivo di **DESIGN 007**.
- Logica di fallback alla cache, hydration, `refreshAll`, `writeCache`:
  perimetro **DESIGN 007**.
- Retry logic applicativa e gestione errori specifici Supabase.
- Modifiche al modulo `src/lib/supabase/cache.ts` o ai repository:
  invariati.
- Implementazione di UI per lo stato offline (banner, spinner,
  messaggi visivi): perimetro dei futuri design UI.
- Sostituzione di `sonner` (punto **B3** del report di diagnosi):
  design dedicato.
- Sostituzione di `downloadFile` (punto **N10** del report di diagnosi):
  design separato.

---

## 11. Invarianti architetturali

### Invariante 1

`isOffline` può essere `true` solo se NetInfo ha restituito
`isConnected = false` oppure `isInternetReachable = false`. Non può
diventare `true` per effetto di un fallimento del meccanismo di
rilevamento.

### Invariante 2

Una sola subscription NetInfo è attiva per volta nell'applicazione.
Nessun consumer registra proprie subscription aggiuntive.

### Invariante 3

Il segnale di connessione è prodotto **esclusivamente** da
`NetworkStatusProvider`. Nessun altro componente o hook legge
direttamente `navigator.onLine`,
`window.addEventListener('online'|'offline')`, o l'API NetInfo.

### Invariante 4

Il debounce si applica solo alla transizione online → offline. La
transizione offline → online è immediata.

### Invariante 5

Se NetInfo fallisce, `NetworkStatusProvider` imposta `isOffline = false`
(Fail-Safe Online-First). Non è mai ammesso un `isOffline = true`
permanente causato da un fallimento del meccanismo di rilevamento.

---

## 12. Dipendenze da altri design

### Precondizioni obbligatorie

- **DESIGN 001 — Fix blocchi avvio**: alias `@/*` deve funzionare per
  importare il hook riscritto e il provider.
- **DESIGN 002 — Fix provider bootstrap**: `AuthProvider` stabile,
  albero dei provider funzionante. Necessario per montare
  `NetworkStatusProvider` sopra senza crash a cascata.
- **DESIGN 007 — Async cache hydration**: deve essere in stato
  **REVIEWED** prima dell'implementazione. Il contratto del segnale
  rete è definito dalla state machine di DESIGN 007. Requisito
  soddisfatto alla data di creazione di questo documento.

### Indipendenza confermata

- **DESIGN 003** (accessibility engine),
- **DESIGN 004** (announcements layer),
- **DESIGN 005** (sostituzione `crypto.subtle`),
- **DESIGN 006** (KDF PIN):

nessuna dipendenza diretta. DESIGN 008 può procedere in parallelo con
qualsiasi di questi.
