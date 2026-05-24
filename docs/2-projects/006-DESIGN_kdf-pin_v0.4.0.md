---
tipo: design
titolo: Key Derivation Function per PIN privato
versione: 0.4.0
data: 2026-05-24
stato: REVIEWED
sorgente: docs/2-projects/005-DESIGN_sostituzione-crypto-N4_v0.5.0.md
perimetro: src/lib/crypto.ts, src/lib/supabase/types.ts, src/lib/supabase/repositories/impostazioni-utente.ts, docs/6-sql/
---

# DESIGN 006 — Key Derivation Function per PIN privato

> **Scope**: definire l'architettura della funzione di derivazione della
> chiave AES a partire dal PIN privato dell'utente. In scope: contratto
> della KDF, gestione del salt casuale, persistenza del salt su Supabase,
> versionamento del payload cifrato, impatto sulle interfacce di tipo.
> Fuori scope: implementazione AES-GCM (coperta da DESIGN 005), feedback
> aptici, segnali audio, componenti UI.
>
> **Precondizione**: DESIGN 005
> ([005-DESIGN_sostituzione-crypto-N4_v0.5.0.md](../2-projects/005-DESIGN_sostituzione-crypto-N4_v0.5.0.md))
> deve essere completamente implementato e mergiato nel codebase prima
> che qualsiasi implementazione derivante da questo documento possa
> procedere.
>
> **Fonte primaria**: debolezza KDF documentata nel §4.5 di DESIGN 005;
> interfacce DB in `src/lib/supabase/types.ts`; repository in
> `src/lib/supabase/repositories/impostazioni-utente.ts`.

---

## 1. Contesto e motivazione

L'implementazione corrente di `encryptData` trasforma il PIN dell'utente
in una chiave AES-256 tramite un'operazione di padding e troncatura: il
PIN viene esteso con caratteri `0` fino a 32 caratteri, poi troncato ai
primi 32 e convertito in byte tramite `TextEncoder`. Questa operazione
non è una funzione di derivazione crittografica della chiave (KDF).

Le conseguenze di sicurezza di questa scelta sono documentate nel §4.5
di DESIGN 005 e costituiscono un debito di sicurezza critico:

- Un PIN numerico di quattro cifre (`1234`) genera una chiave in cui i
  28 byte più significativi sono tutti zero (`0x30` in UTF-8),
  riducendo l'entropia effettiva della chiave a meno di 14 bit rispetto
  ai 256 nominali.
- Un attaccante in possesso di un payload cifrato e del salt pubblico del
  formato attuale può esaurire l'intero spazio dei PIN a quattro cifre
  (10.000 combinazioni) in tempi dell'ordine del millisecondo con
  hardware comune.
- Non esiste alcun meccanismo di rallentamento computazionale che renda
  costoso l'attacco a forza bruta.
- Non esiste alcun salt per isolare payload cifrati con lo stesso PIN da
  utenti diversi o tra sessioni diverse dello stesso utente.

Questo documento definisce l'architettura della correzione. La
derivazione debole viene sostituita con PBKDF2-SHA256, una funzione di
derivazione standardizzata che introduce rallentamento computazionale
controllato e richiede un salt per ogni derivazione.

---

## 2. Precondizione

**DESIGN 005 deve essere completamente implementato e mergiato nel
codebase prima dell'implementazione di qualsiasi elemento di questo
documento.** (Gate: verificare prima dell'avvio che DESIGN 005 sia stato implementato e il modulo @noble/ciphers sia disponibile nel progetto.)

La dipendenza tecnica è la seguente:

- DESIGN 005 sostituisce `crypto.subtle` con `@noble/ciphers` e
  stabilisce il formato contrattuale del payload AES-GCM:
  `Base64( IV[12] | Ciphertext[N] | AuthTag[16] )`.
- DESIGN 006 estende quel formato aggiungendo un prefisso
  `KDF_VERSION[1] | SALT[16]` per i payload protetti da PIN. Senza il
  layer AES-GCM funzionante su tutti i target React Native, il layer
  KDF non ha una primitiva stabile su cui appoggiarsi.
- La dipendenza da `@noble/ciphers` introdotta da DESIGN 005 è riutilizzata
  direttamente da DESIGN 006 per le operazioni AES-GCM nel golden vector K3.
  Se `@noble/ciphers` non è installata, la pipeline K3 non è verificabile.

L'unica eccezione ammessa è la progettazione e la scrittura del Coding
Plan 006: il piano implementativo può essere redatto in parallelo
all'implementazione di DESIGN 005, purché non produca modifiche al
codebase prima che DESIGN 005 sia mergiato.

---

## 3. Perimetro del documento

### In scope

- Contratto della funzione di derivazione della chiave AES dal PIN
  (input, output, parametri algoritmici).
- Decisione architetturale sulla KDF: algoritmo scelto e alternative
  scartate con motivazione.
- Gestione del salt: generazione, dimensione, persistenza su Supabase.
- Modifiche alle interfacce `DbUserSettings` e `UserSettings` in
  `src/lib/supabase/types.ts`.
- Contratto della funzione di repository `updatePinSalt`.
- Versionamento del payload cifrato per i dati protetti da PIN.
- Sequenza operativa di impostazione e verifica del PIN.
- Golden vectors K1, K2, K3 (descrizione semantica; i valori numerici
  esatti sono competenza del Coding Plan 006).
- Budget prestazionale della derivazione.

### Fuori scope

- Implementazione AES-GCM: coperta da DESIGN 005 e invariata.
- Modifiche alle funzioni `hashPin` e `verifyPin`: usano `bcryptjs` per
  la verifica del PIN e restano fuori da questo perimetro.
- Feedback aptici, segnali audio, messaggi di errore UI.
- Componenti React Native e logica di navigazione.
- Migrazione di dati esistenti: non esistono payload PIN reali persistiti
  prima di questa implementazione; nessuna migrazione è necessaria.

---

## 4. Scelta architetturale della KDF

### Algoritmo scelto: PBKDF2-SHA256

La funzione di derivazione scelta è **PBKDF2** (Password-Based Key
Derivation Function 2) con funzione pseudo-casuale **HMAC-SHA256**,
definita in RFC 8018.

**Libreria**: `react-native-quick-crypto`, che espone
l'API Web Crypto standard su React Native tramite binding
OpenSSL nativi. La libreria non contiene codice nativo custom
scritto o mantenuto internamente dal progetto; utilizza il
backend OpenSSL della piattaforma ospite (Android, iOS, Windows).

Il modulo `@noble/hashes` è escluso dall'implementazione KDF
in seguito a benchmark empirici che hanno rilevato un tempo
di circa 75 secondi per 100.000 iterazioni su runtime Hermes
con implementazione JavaScript pura. Tale latenza rende il
vincolo di budget prestazionale (§7) non soddisfacibile.

**Livello di astrazione**: il file `src/lib/crypto.ts`
non importa `react-native-quick-crypto` direttamente.
La dipendenza è incapsulata in un modulo provider dedicato
(`KdfProvider`), che il Coding Plan 006 è responsabile di
progettare. Questo layer garantisce che future sostituzioni
della libreria non impattino il contratto pubblico della KDF.
Il DESIGN non specifica l'implementazione interna del provider:
essa è competenza esclusiva del Coding Plan 006.

**Contratto della funzione di derivazione**:

- **Input**:
  - `pin`: stringa UTF-8 inserita dall'utente (lunghezza arbitraria).
  - `salt`: `Uint8Array` di 16 byte (128 bit), generato casualmente.
- **Output**: `Uint8Array` di 32 byte (256 bit), utilizzabile
  direttamente come chiave AES-256.
- **Parametri PBKDF2**:
  - Funzione pseudo-casuale: HMAC-SHA256.
  - Numero di iterazioni: **600.000 (target operativo corrente)**.
    Il valore è stato determinato tramite benchmark empirico
    su Windows con backend nativo Node.js/OpenSSL, che ha
    prodotto una mediana di 86 ms.
    Il valore è approvato come target operativo per la
    piattaforma primaria (Windows). Prima del rilascio
    sulle piattaforme secondarie (Android, iOS), il Coding
    Plan 006 dovrà eseguire benchmark equivalenti sulle
    build release corrispondenti e documentare gli esiti.
    Se un esito fosse fuori budget, il tradeoff è documentato
    nel Coding Plan 006 come criticità aperta.
    Vincolo invalicabile: il numero di iterazioni non può
    essere inferiore a 100.000 in nessuna configurazione.
  - Lunghezza output (dkLen): 32 byte.
  - Salt: passato come parametro, non derivato internamente.

### Alternative scartate

**scrypt**: scartato per il rischio di freeze dell'interfaccia su
device di fascia bassa. scrypt è memory-hard per design: richiede
un blocco di memoria proporzionale ai parametri `N` e `r`, che su
device con RAM limitata può causare una pressione di memoria
sufficiente a produrre jank o pause percettibili nel thread JavaScript.
Hermes non offre meccanismi di limitazione dell'utilizzo di memoria per
operazioni sincrone. PBKDF2 è computazione-hard, non memory-hard, e il
suo costo può essere calibrato in modo più prevedibile sul device target.

**Argon2**: scartato per eccessiva complessità di integrazione in un
ambiente React Native con runtime Hermes. Argon2 non ha un'implementazione
JavaScript pura di qualità equivalente a `@noble/hashes` e compatibile
con tutti e tre i target del progetto (Android, iOS, Windows). Le
implementazioni disponibili richiedono WebAssembly o binding nativi, entrambi
incompatibili con il vincolo di questo progetto di usare solo dipendenze
pure-JavaScript.

**Nota sul vincolo pure-JavaScript**: il vincolo originale
di usare solo librerie senza binding nativi è superato dai
risultati del benchmark empirico. Il vincolo aggiornato è:
è vietato introdurre codice nativo custom scritto o mantenuto
internamente dal progetto. Sono consentite librerie esterne
consolidate che utilizzano binding nativi per operazioni
crittografiche standardizzate e multipiattaforma.

---

## 5. Salt — decisione architetturale

### Salt deterministico: escluso

L'uso di un salt deterministico (derivato ad esempio dall'`user_id` o da
qualsiasi altra informazione non casuale) è **escluso**. Un salt
deterministico non offre protezione contro attacchi con tabelle di
lookup precompilate (rainbow tables) per gli spazi di PIN più comuni:
poiché il salt sarebbe calcolabile da dati pubblici, un attaccante può
precalcolare la derivazione per tutti i PIN dello spazio bersaglio.

### Salt casuale

Il salt è un valore casuale generato con `crypto.getRandomValues`, il
medesimo CSPRNG introdotto da DESIGN 005 tramite il polyfill
`react-native-get-random-values`. Ogni volta che l'utente imposta o
modifica il PIN privato, viene generato un nuovo salt indipendente.

**Dimensione minima**: 16 byte (128 bit). Questa dimensione garantisce
che la probabilità di collisione tra due salt generati indipendentemente
sia trascurabile (ordine di $2^{-64}$ per il paradosso del compleanno).

> DIVIETO ASSOLUTO: non usare Math.random() né
> Date.now() come fonte di entropia per la generazione
> del salt o di qualsiasi parametro crittografico.
> Usare esclusivamente crypto.getRandomValues()
> tramite @noble/ciphers o equivalente CSPRNG.

### Persistenza

Il salt viene persistito nella colonna **`pin_kdf_salt`** della tabella
`impostazioni_utente` su Supabase. Questa colonna non esiste nel
database alla data di questo documento. Andrà aggiunta tramite una
migration SQL, i cui dettagli sono competenza del Coding Plan 006.

**Tipo della colonna**: `text`, contenente il salt codificato in Base64.
Il salt è un valore opaco non interpretabile senza la KDF.

**Relazione con `pin_privato_hash`**: la colonna `pin_kdf_salt` segue
la stessa semantica di `pin_privato_hash`. Quando l'utente non ha
impostato il PIN privato, entrambe le colonne sono `null`. Quando il
PIN è impostato, entrambe contengono un valore non nullo. La coerenza
tra le due colonne è invariante del sistema: non deve mai esistere uno
stato in cui una è `null` e l'altra non lo è.

---

## 6. Versionamento del payload cifrato

### Struttura logica del payload per PIN

I payload prodotti dalla cifratura basata su PIN adottano un formato
esteso rispetto al payload AES-GCM puro di DESIGN 005. La struttura
logica è:

```
[KDF_VERSION (1 byte)] [SALT (16 byte)] [IV (12 byte)] [Ciphertext (N byte)] [AuthTag (16 byte)]
```

La lunghezza totale del buffer decodificato è `1 + 16 + 12 + N + 16 =
45 + N` byte, dove N è la lunghezza in byte UTF-8 del plaintext.
Il buffer completo viene codificato in Base64 con alfabeto standard
(`btoa`) prima della persistenza su Supabase.

### Significato del byte di versione

| Valore | Significato |
|--------|-------------|
| `0x01` | PBKDF2-SHA256 con parametri correnti (iterazioni documentate nel Coding Plan 006). |

Il byte `KDF_VERSION` è il primo byte del buffer. Un parser che legge
un payload lo può identificare come payload PIN (anziché payload AES-GCM
puro di DESIGN 005) dalla presenza di questo prefisso e dal contesto
applicativo: i due formati non sono usati in modo intercambiabile sulla
stessa colonna.

### Perché il versionamento va introdotto adesso

Il versionamento viene introdotto prima che esistano dati reali
persistiti nel formato PIN-derivato per le seguenti ragioni:

- Una volta che un payload è scritto nel formato `0x01` su Supabase, la
  struttura del byte di versione è contrattualmente fissata. Aggiungere
  il versionamento in retroattivo richiederebbe una migration di tutti i
  payload esistenti, operazione costosa e rischiosa.
- Il byte di versione occupa 1 byte per payload: il costo di introdurlo
  ora è trascurabile rispetto al beneficio di avere un contratto stabile
  per le versioni future.
- Se in futuro venisse adottata una KDF più robusta (Argon2, scrypt con
  parametri aggiornati), il sistema sarebbe in grado di decifrare
  payload scritti con la versione precedente semplicemente leggendo il
  byte di versione e applicando la KDF corrispondente.

### Relazione con il formato di DESIGN 005

Il payload di DESIGN 005 ha formato `Base64( IV[12] | Ciphertext[N] |
AuthTag[16] )` e descrive la cifratura AES-GCM con chiave fornita
esternamente. DESIGN 006 estende quel formato aggiungendo il prefisso
`KDF_VERSION[1] | SALT[16]` per i payload in cui la chiave AES è
derivata dal PIN. I due formati sono distinti per ambito:

- Il payload di DESIGN 005 è usato per `encryptData`/`decryptData` con
  chiave esplicita. Il formato non cambia.
- Il payload di DESIGN 006 è usato per le operazioni di cifratura
  associate al PIN privato. È un superset strutturale del payload
  di DESIGN 005, con il prefisso KDF anteposto.

---

## 7. Budget prestazionale

La derivazione PBKDF2-SHA256 deve completarsi entro un intervallo di
**100–300 ms** sul device minimo supportato. Questo intervallo bilancia
due requisiti opposti:

- **Sicurezza**: più iterazioni rendono ogni tentativo di brute-force
  più costoso. Al di sotto di 100 ms, il numero di iterazioni
  necessario per difendersi da attacchi con GPU moderne potrebbe
  risultare insufficiente.
- **Usabilità**: sopra 300 ms, l'utente percepisce la latenza come
  ritardo dell'interfaccia durante il login. Su thread JavaScript
  sincrono, la derivazione blocca il rendering; il Coding Plan 006
  dovrà valutare l'esecuzione su thread separato se necessario.

**Il numero di iterazioni PBKDF2 non è fissato in questo documento.**
Sarà determinato sperimentalmente durante l'implementazione misurando
il tempo di esecuzione sul device minimo supportato. Il valore misurato
e il device di riferimento saranno documentati nel Coding Plan 006.

**Target di calibrazione**: Windows (piattaforma primaria per la
versione 1.0 di ZecchinoReact). I device Android e iOS sono target
secondari per la calibrazione; se un numero di iterazioni calibrato su
Windows risultasse fuori budget su Android, la scelta sarà documentata
come tradeoff accettato nel Coding Plan 006.

Il numero di iterazioni calibrato dovrà in ogni caso
rispettare il floor minimo dichiarato nella sezione 4
(100.000 iterazioni). Se durante la calibrazione
il floor minimo non fosse raggiungibile entro il budget
100–300 ms sul device di riferimento, il tradeoff
dovrà essere documentato nel Coding Plan 006
come criticità aperta, non silenziata.

**Nota sull'interpretazione del budget temporale**:
il range 100–300 ms era un vincolo operativo calibrato
per implementazioni JavaScript pure su runtime Hermes.
Con backend crittografici nativi (OpenSSL), il parametro
di sicurezza determinante è il numero di iterazioni e il
costo computazionale reale, non il tempo assoluto.
Tempi inferiori al range dichiarato sono accettabili se
ottenuti aumentando significativamente il numero di
iterazioni rispetto al floor OWASP.

Risultato benchmark Windows (riferimento v0.4.0):
600.000 iterazioni, mediana 86 ms, backend nativo OpenSSL.
Questo valore è sei volte il floor OWASP e soddisfa
i criteri di sicurezza del design.

---

## 8. Golden vectors — famiglia K

I golden vectors della famiglia K sono distinti dai vettori G1–G3 di
DESIGN 005, che verificano la compatibilità AES-GCM tra WebCrypto e
`@noble/ciphers`. I vettori K verificano la pipeline KDF completa.

I valori numerici esatti (hex, base64) non sono definiti in questo
documento di design. Saranno calcolati e fissati nel Coding Plan 006,
dove diventeranno i test di regressione obbligatori per l'implementazione.

### K1 — Idempotenza della derivazione

**Semantica**: data la stessa coppia (PIN, salt), la funzione KDF deve
produrre sempre la stessa chiave AES di 32 byte. Questo verifica che
PBKDF2-SHA256 sia deterministico e che l'implementazione non introduca
variabilità accidentale (ad esempio da encoding non controllato del PIN).

**Struttura del vettore**: PIN alfanumerico rappresentativo; salt valido
di 16 byte; chiave attesa di 32 byte. Due invocazioni identiche devono
restituire output identico bit per bit.

### K2 — Isolamento del salt

**Semantica**: dato lo stesso PIN con due salt distinti, la funzione KDF
deve produrre due chiavi diverse. Questo verifica che il salt sia
effettivamente incorporato nella derivazione e che due istanze della
stessa password siano computazionalmente indipendenti.

**Struttura del vettore**: PIN fisso; due salt distinti di 16 byte;
due chiavi attese, entrambe di 32 byte, verificabilmente diverse.

### K3 — Pipeline completa PIN → cifratura → decifratura

**Semantica**: verifica il round-trip end-to-end della pipeline
completa: derivazione PBKDF2 della chiave dal PIN, cifratura AES-GCM
del payload, costruzione del buffer versionato, decifratura del buffer,
verifica che il plaintext originale sia recuperato inalterato.

**Struttura del vettore**: PIN, salt, plaintext come input; payload
versionato `[KDF_VERSION | SALT | IV | Ciphertext | AuthTag]` come
output intermedio; plaintext originale come output finale della
decifratura. Il vettore copre: derivazione (K1), isolamento (K2),
AES-GCM (G1–G3 di DESIGN 005), e costruzione/parsing del payload
versionato (DESIGN 006 §6).

---

## 9. Impatto su DbUserSettings e UserSettings

### Modifiche a `DbUserSettings`

L'interfaccia `DbUserSettings` in `src/lib/supabase/types.ts` riceve un
nuovo campo:

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `pin_kdf_salt` | `string \| null` | Salt PBKDF2 codificato in Base64 (16 byte). `null` quando il PIN privato non è impostato. |

L'interfaccia aggiornata include tutti i campi esistenti più il nuovo
campo. L'ordine dei campi nella dichiarazione TypeScript segue la
convenzione esistente (dopo `pin_privato_hash`).

### Modifiche a `UserSettings`

L'interfaccia `UserSettings` in `src/lib/supabase/types.ts` riceve un
nuovo campo:

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `pinKdfSalt` | `string \| null` | Corrisponde a `pin_kdf_salt` della riga DB. `null` quando il PIN privato non è impostato. |

Il campo `pinKdfSalt` è affiancato a `pinPrivatoHash` e segue la stessa
semantica di nullabilità: entrambi sono `null` o entrambi non lo sono.

### Funzione di repository da aggiungere

Il repository `src/lib/supabase/repositories/impostazioni-utente.ts`
riceve una nuova funzione esportata denominata `updatePinSalt`, con
la firma `(salt: string | null): Promise<void>`.

**Contratto**:
- Parametro `salt`: salt PBKDF2 codificato in Base64, oppure `null` per
  cancellare il PIN (analogamente a `updatePinHash`).
- Implementazione: delega a `updateField('pinKdfSalt', salt)`, seguendo
  esattamente il pattern di `updatePinHash`, che chiama
  `updateField('pinPrivatoHash', hash)`.
- Il `fieldMap` deve essere esteso con la mappatura
  `pinKdfSalt: 'pin_kdf_salt'` per permettere a `updateField` di
  risolvere la colonna DB corrispondente.
- La funzione deve essere esportata dallo stesso modulo e documentata
  nello stesso modo delle funzioni esistenti.

Nessun'altra funzione del repository viene modificata da questo design.

---

## 10. Sequenza operativa PIN privato

Le sequenze seguenti descrivono il flusso logico delle operazioni sul
PIN privato dopo l'implementazione di DESIGN 006. Non contengono codice.
Definiscono l'ordine delle operazioni e i contratti tra componenti.

### Impostazione del PIN

1. **Generare salt casuale**: produrre 16 byte casuali tramite
   `crypto.getRandomValues` (polyfill `react-native-get-random-values`
   attivo dal boot dell'applicazione).
2. **Derivare chiave AES**: invocare PBKDF2-SHA256 con `(pin, salt)` per
   ottenere una chiave di 32 byte.
3. **Cifrare i dati**: invocare l'operazione AES-GCM con la chiave
   derivata per produrre `(IV, ciphertext, authTag)`.
4. **Costruire payload versionato**: concatenare
   `[0x01 | salt | IV | ciphertext | authTag]` e codificare in Base64.
5. **Salvare salt su Supabase**: invocare `updatePinSalt(base64(salt))`
   per persistere il salt nella colonna `pin_kdf_salt`.
6. **Salvare hash PIN su Supabase**: invocare `updatePinHash(hash)` con
   l'hash bcrypt del PIN per la verifica futura (meccanismo invariato).

I passi 5 e 6 devono entrambi completarsi con successo prima di
considerare l'operazione conclusa. Se uno dei due fallisce, il sistema
deve trovarsi in uno stato coerente: nessuna delle due colonne deve
essere parzialmente aggiornata.

Le colonne `pin_privato_hash` e `pin_kdf_salt` costituiscono un'unità
logica indivisibile. Uno stato in cui solo una delle due colonne è
aggiornata è uno stato invalido del sistema e non deve mai essere
raggiunto. Il vincolo di atomicità è dichiarato qui a livello
architetturale. Il meccanismo tecnico per garantirlo (transazione,
rollback, RPC, compensazione o retry) è competenza esclusiva del
Coding Plan 006.

### Verifica e decifrazione con PIN

1. **Recuperare salt da Supabase**: leggere `pinKdfSalt` da
   `UserSettings`; se è `null`, il PIN non è impostato.
2. **Leggere KDF_VERSION dal payload**: esaminare il primo byte del
   buffer decodificato (Base64 → byte array); il valore `0x01` indica
   PBKDF2-SHA256.
3. **Estrarre salt dal payload**: i byte 1–16 del buffer (0-indexed)
   contengono il salt incluso nel payload al momento della cifratura.
   Questo salt è la fonte di verità per la decifratura del payload
   corrente: viene usato direttamente per la derivazione PBKDF2
   al passo successivo, indipendentemente dal salt
   correntemente persistito su Supabase.
   Il salt su Supabase non costituisce un criterio
   di validazione bloccante per i payload esistenti:
   la sua unica funzione diagnostica è rilevare
   se il PIN è impostato (passo 1). L'integrità
   crittografica del payload è garantita esclusivamente
   dall'AuthTag AES-GCM al passo 5.
4. **Derivare chiave PBKDF2**: invocare PBKDF2-SHA256 con il PIN
   inserito dall'utente e il salt recuperato.
5. **Decifrare con AES-GCM**: estrarre IV (byte 17–28 del buffer) e
   `ciphertext + authTag` (byte 29 in poi); invocare AES-GCM decrypt
   con la chiave derivata.

Il salt necessario alla derivazione PBKDF2 è incorporato nel payload
cifrato stesso, nella posizione definita nella sezione 6. Questo
garantisce che i dati precedentemente cifrati restino autonomamente
decifrabili anche dopo che l'utente ha modificato il PIN. Ogni payload
porta con sé le informazioni necessarie per la propria decifrazione,
indipendentemente dal salt correntemente persistito su Supabase.

---

## 11. Compatibilità con versioni future

Il byte `KDF_VERSION` in posizione zero del payload permette future
evoluzioni dell'algoritmo di derivazione senza migrazioni distruttive
dei dati esistenti.

**Meccanismo di compatibilità**: quando un payload viene letto, il
sistema determina la KDF da usare leggendo il primo byte. I payload con
`KDF_VERSION = 0x01` vengono sempre decifrati con PBKDF2-SHA256,
indipendentemente dall'algoritmo corrente dell'applicazione. I payload
con versioni future (ad esempio `0x02` per Argon2 o una versione di
PBKDF2 con parametri aggiornati) vengono decifrati con l'algoritmo
corrispondente.

**Esempio di evoluzione futura**:

| Valore | Descrizione | Motivazione dell'aggiornamento |
|--------|-------------|-------------------------------|
| `0x01` | PBKDF2-SHA256, parametri v1.0 | Versione corrente |
| `0x02` | PBKDF2-SHA256, parametri v2.0 (iterazioni aumentate) | Incremento del budget di sicurezza su device più recenti |
| `0x03` | Argon2id | Disponibilità futura di implementazione pure-JS compatibile con Hermes |

**Garanzia di non-rottura**: un payload scritto con `0x01` resterà
sempre decifrabile anche dopo che l'applicazione ha adottato `0x02` o
`0x03` per i nuovi payload. Non è necessaria alcuna migrazione di massa
dei dati persistiti: ogni payload porta con sé le informazioni necessarie
per la sua decifrazione.

Non esistono payload persistiti in formato PIN antecedenti a questa
implementazione. Prima di DESIGN 006, nessuna funzionalità del sistema
produceva payload cifrati derivati da PIN e persistiti su Supabase.
Il byte `KDF_VERSION` è pertanto obbligatorio per tutti i payload di
questo tipo senza eccezioni. Non è previsto né necessario alcun decoder
di compatibilità per payload privi di version byte.

**Limite di versione**: `KDF_VERSION` è un singolo byte unsigned, quindi
supporta al massimo 255 versioni distinte dell'algoritmo di derivazione.
Questo limite è ritenuto sufficiente per il ciclo di vita previsto
dell'applicazione.

---

## 12. Vincoli tecnici

Raccolta dei vincoli tecnici documentati nel presente design.
I vincoli sono mantenuti nelle sezioni originali per la lettura
contestuale; questa sezione offre una visione consolidata.

| Vincolo | Valore / Regola | Sezione di riferimento |
|---------|-----------------|------------------------|
| Dipendenza da DESIGN 005 | DESIGN 005 deve essere implementato e mergiato prima di qualsiasi implementazione di DESIGN 006 | §2 |
| Algoritmo KDF | PBKDF2-SHA256 (RFC 8018) via `react-native-quick-crypto` (backend OpenSSL nativo) | §4 |
| Floor iterazioni PBKDF2 | ≥ 100.000 (floor invalicabile). Target operativo corrente: 600.000. Validazione multipiattaforma delegata al Coding Plan 006. | §4 |
| Dipendenze pure-JavaScript | Vietato codice nativo custom interno al progetto. Consentite librerie esterne consolidate con binding nativi per operazioni crittografiche standardizzate. | §4 |
| Dimensione minima salt | 16 byte (128 bit) generati tramite `crypto.getRandomValues` | §5 |
| Fonte entropia | Esclusivamente `crypto.getRandomValues` (CSPRNG); vietato `Math.random()` e `Date.now()` | §5 |
| Budget prestazionale derivazione | 100–300 ms come riferimento operativo per Hermes pure-JS. Con backend nativo, il vincolo vincolante è il numero di iterazioni (≥ 100.000, target 600.000). Vedere §7 per la nota interpretativa. | §7 |
| Floor iterazioni (budget) | Se il floor 100.000 non è raggiungibile entro 100–300 ms, documentare come criticità aperta nel Coding Plan 006 | §7 |

---

## 13. Nota architettuale futura — Wrapped Master Key

L'architettura attuale di questo design prevede che PBKDF2
derivi una chiave AES direttamente dal PIN, e che tale chiave
venga usata per cifrare i dati dell'utente.

Un'architettura alternativa più robusta, denominata
Wrapped Master Key Architecture, prevede che PBKDF2 derivi
una chiave di cifratura della chiave (KEK), usata a sua volta
per proteggere una Master Key AES-256 casuale, che cifra
i dati reali. Questo approccio riduce l'esposizione diretta
della chiave derivata dal PIN.

Questa architettura non è in scope per il presente DESIGN 006
e non è richiesta per il Coding Plan 006. È documentata qui
come candidato architetturale per un piano di progettazione
dedicato da sviluppare prima del rilascio in produzione.

---

## 14. Dependency Governance — react-native-quick-crypto

`react-native-quick-crypto` assume il ruolo di dipendenza
crittografica critica del progetto. Il Coding Plan 006 è
responsabile di rispettare le seguenti prescrizioni:

- Fissare la versione esatta della dipendenza in `package.json`
  (pinning esplicito, non range).
- Eseguire un audit di sicurezza prima di ogni aggiornamento
  di versione.
- Includere i golden vector K1–K3 come test di regressione
  eseguiti in CI ad ogni build.
- Documentare il risultato del benchmark multipiattaforma
  come artefatto del Coding Plan 006.

---

## 15. Fasi di implementazione

### Fase 0 — Benchmark preliminare su Hermes

Prima di procedere con qualsiasi implementazione del codice KDF, eseguire
la seguente attività preparatoria:

- Benchmark PBKDF2-SHA256 su Hermes (React Native):
  misurare il tempo di esecuzione con il numero di
  iterazioni configurato prima di procedere all'
  implementazione. Il risultato deve essere inferiore
  al limite accettabile per UX (≤ 2s su device
  di riferimento low-end).

I risultati del benchmark e il numero di iterazioni scelto saranno
documentati nel Coding Plan 006.

---

## 16. File coinvolti

| File | Operazione | Note |
|------|------------|------|
| `src/lib/crypto.ts` | Modifica | Sostituzione KDF PIN: PBKDF2-SHA256 sostituisce padding/troncatura |
| `src/lib/supabase/types.ts` | Modifica | Aggiunta `pin_kdf_salt` in `DbUserSettings` e `pinKdfSalt` in `UserSettings` |
| `src/lib/supabase/repositories/impostazioni-utente.ts` | Modifica | Aggiunta funzione `updatePinSalt`, estensione `fieldMap` |
| `docs/6-sql/` | Creazione | Migration SQL per colonna `pin_kdf_salt` su `impostazioni_utente` |
| `__tests__/crypto/` o `src/__tests__/crypto/` | Creazione | Test KDF con golden vectors K1, K2, K3 (da confermare in Coding Plan 006) |
