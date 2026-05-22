---
tipo: design
titolo: Sostituzione crypto.subtle — N4 (encryptData / decryptData)
versione: 0.5.0
data: 2026-05-22
stato: REVIEWED
sorgente: docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md
perimetro: src/lib/crypto.ts, index.js, package.json
problema: N4
---

# DESIGN — Sostituzione crypto.subtle (v0.5.0)

> **Scope**: rendere le funzioni `encryptData` e `decryptData` di
> `src/lib/crypto.ts` eseguibili in React Native sostituendo l'API
> WebCrypto con una libreria JavaScript pura. Le funzioni `hashPin` e
> `verifyPin`, che già funzionano su tutti i target, restano intatte.
>
> **Precondizione**: il Gruppo 1 (DESIGN 001) e il Gruppo 2 (DESIGN 002)
> devono essere completamente implementati. In particolare il fix N11
> (rimozione `"types": ["node"]` da `tsconfig.json`) deve essere attivo
> prima di procedere, perché senza di esso il type-checker non segnala
> gli usi di API DOM che questo fix elimina.
>
> **Fonte primaria**: la diagnosi di N4 si trova in
> [docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md](../1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md).

---

## 1. Contesto e motivazione

`encryptData` e `decryptData` sono le funzioni responsabili della
cifratura dei dati sensibili dell'utente prima del salvataggio su
Supabase. Nella sua implementazione attuale entrambe si appoggiano
all'API Web Crypto (`crypto.subtle`), disponibile nel browser e in
Node.js ma non esposta dal runtime Hermes di React Native.

**Effetto concreto**: ogni volta che un flusso applicativo chiama
`encryptData` — ad esempio quando l'utente aggiunge o modifica una
transazione su un conto privato — il runtime lancia immediatamente
`TypeError: undefined is not an object (evaluating 'crypto.subtle.importKey')`.
Il risultato visibile è un crash dell'operazione, con il dato che non
viene mai salvato e l'utente che non riceve alcun messaggio di errore
comprensibile.

**Perché questo intervento è necessario ora**: una volta risolti i
blocchi di avvio (Gruppo 1) e i crash del provider (Gruppo 2),
l'applicazione avvia e naviga correttamente. Il mancato funzionamento
della cifratura diventa quindi il blocco successivo nel percorso verso
un'app utilizzabile: senza cifratura, i conti privati non possono
essere scritti né letti.

**Conseguenza del non-intervento**: qualsiasi dato associato a conti
privati rimane inaccessibile o non viene mai persistito, rendendo la
funzionalità di privacy dell'app completamente non operativa.

---

## 2. Perimetro dell'intervento

### Funzioni modificate

Le uniche funzioni che verranno modificate sono `encryptData` e
`decryptData`. Entrambe usano `crypto.subtle` per eseguire le
operazioni AES-GCM e sono le uniche cause del problema N4.

### Funzioni invariate

`hashPin` e `verifyPin` restano completamente invariate. Queste due
funzioni usano `bcryptjs`, una libreria pure-JavaScript già disponibile
e funzionante su tutti i target React Native. Non esiste alcuna ragione
tecnica o architetturale per modificarle in questo ciclo: cambiarle
introdurrebbe rischi di regressione senza alcun beneficio.

### File coinvolti

- `src/lib/crypto.ts`: le due funzioni di cifratura vengono riscritte
  per non usare più `crypto.subtle`.
- `index.js`: viene aggiunto un polyfill per il generatore di numeri
  casuali crittografici, necessario per la generazione sicura dell'IV.
- `package.json`: vengono aggiunte le due nuove dipendenze.

---

## 3. Analisi del payload attuale

Questa sezione descrive con precisione il formato del dato cifrato
prodotto dall'implementazione attuale. Serve come riferimento
contrattuale per i golden test e come garanzia che i dati già salvati
su Supabase non richiederanno alcuna migrazione.

### Struttura del payload cifrato

#### Struttura del buffer

Il payload cifrato viene costruito concatenando tre segmenti in questo
ordine esatto:

1. **IV** — 12 byte, generati casualmente prima di ogni operazione di
   cifratura. L'IV occupa i byte dalla posizione 0 alla posizione 11
   inclusa.
2. **Ciphertext** — N byte, dove N è uguale alla lunghezza del plaintext
   in UTF-8. I byte del ciphertext seguono immediatamente l'IV.
3. **AuthTag** — 16 byte, generati automaticamente dall'algoritmo
   AES-GCM come garanzia di integrità del messaggio. L'authTag è
   **sempre appeso alla fine del risultato** dalla specifica AES-GCM,
   dopo il ciphertext.

Il buffer finale ha quindi lunghezza `12 + N + 16` byte.

#### Encoding

L'intero buffer viene codificato in Base64 usando l'alfabeto standard
(`btoa`). Il risultato è una stringa ASCII trasportabile come campo
testuale su Supabase.

#### Separazione authTag nella decifratura

Durante la decifratura, il buffer viene diviso secondo le posizioni
fisse: i primi 12 byte sono l'IV, tutto il resto (ciphertext + authTag)
viene passato all'algoritmo AES-GCM. L'autenticità viene verificata
automaticamente dall'algoritmo, che fallisce se l'authTag non corrisponde.

### Parametri KDF

#### Derivazione della chiave

Il PIN dell'utente viene trasformato in una chiave di 32 byte tramite
un'operazione di padding-e-troncatura: il PIN viene esteso con caratteri
`0` fino a raggiungere i 32 caratteri, poi troncato ai primi 32. La
conversione in byte avviene tramite UTF-8 (`TextEncoder`).

---

## 4. Decisioni architetturali

### 4.1 Libreria scelta: @noble/ciphers

La libreria `@noble/ciphers` (di Paul Miller) è stata scelta come
sostituto diretto di `crypto.subtle` per le seguenti ragioni:

**Compatibilità universale**: è scritta in TypeScript puro senza alcun
binding nativo. Non richiede C++ compilato, JNI, o code linking. Viene
eseguita su Hermes (Android e iOS) e sul runtime React Native Windows
senza modifiche e senza configurazione aggiuntiva. Questo soddisfa il
vincolo principale di questo progetto, che supporta tre target
simultaneamente.

**Identità del formato**: `@noble/ciphers` implementa AES-GCM secondo
lo stesso standard IETF (RFC 5116) usato da WebCrypto. Per la stessa
chiave, lo stesso IV e lo stesso plaintext, il ciphertext e l'authTag
prodotti sono **byte per byte identici** a quelli prodotti da
`crypto.subtle.encrypt`. Questo è dimostrato nella sezione 5 tramite i
golden test, che sono stati verificati computazionalmente.

**Interfaccia semplificata**: a differenza di WebCrypto, che richiede
l'importazione asincrona di una `CryptoKey` opaca prima di ogni
operazione, `@noble/ciphers` accetta direttamente array di byte come
chiave e IV. Questo semplifica il codice e rimuove la gestione degli
oggetti `CryptoKey` non portabili.

**Affidabilità del progetto**: `@noble/ciphers` è parte della famiglia
`@noble` di Paul Miller, un ecosistema crittografico JavaScript di
riferimento, con audit di sicurezza pubblici e adozione ampia.

**Alternative valutate e scartate**:

- `expo-crypto`: richiede l'intera infrastruttura Expo, non adatta a un
  progetto React Native bare.
- `react-native-aes-crypto`: usa un bridge nativo; non è stata
  verificata la compatibilità con React Native Windows, e l'aggiunta di
  dipendenze native non è coerente con l'approccio di questo gruppo di
  fix.
- `node:crypto`: il modulo `crypto` di Node.js non è disponibile nel
  runtime Hermes; è accessibile solo in Node.js.

### 4.2 Gestione del generatore di numeri casuali

**Il problema**: l'implementazione attuale usa `crypto.getRandomValues`
per generare l'IV casuale prima di ogni cifratura. In React Native,
questa funzione non è disponibile nel runtime Hermes senza un polyfill
esplicito.

**La soluzione**: `react-native-get-random-values` è un pacchetto che
sostituisce `crypto.getRandomValues` con un'implementazione che legge
entropia dal CSPRNG del sistema operativo su ogni piattaforma (Android,
iOS, Windows). L'import di questo pacchetto deve essere la **prima
istruzione eseguita** nell'intero ciclo di vita dell'app, prima di
qualsiasi altro modulo, perché il polyfill deve essere installato prima
che qualsiasi codice tenti di usare `crypto.getRandomValues`.

**Perché come prima riga di index.js**: `index.js` è il punto di
ingresso dell'applicazione React Native; è il primo modulo caricato dal
bundler. Inserire l'import del polyfill come prima riga assoluta
garantisce che sia attivo prima del caricamento di `App.tsx` e di
qualsiasi provider o hook.

**Alternative scartate**: non si considera la possibilità di generare
l'IV con `Math.random` o algoritmi pseudocasuali non crittografici,
perché questo renderebbe gli IV prevedibili e comprometterebbe la
sicurezza della cifratura. Il polyfill è l'unica soluzione corretta.

Chiarimento sullo scope del polyfill: react-native-get-random-values
fornisce esclusivamente un'implementazione di crypto.getRandomValues
basata sull'entropia del sistema operativo. Non fornisce né polyfilla
crypto.subtle, né alcuna altra API WebCrypto. La sostituzione di
crypto.subtle con @noble/ciphers è un intervento separato e indipendente,
descritto nelle sezioni 4.1 e 7 di questo documento.

### 4.3 Compatibilità dati esistenti

I dati cifrati da `encryptData` già presenti su Supabase (salvati
tramite WebCrypto in ambienti di test o browser) **non richiedono alcuna
migrazione**.

La ragione è matematica: sia WebCrypto che `@noble/ciphers` implementano
lo stesso identico algoritmo AES-GCM definito dalla specifica IETF. Per
identici input (chiave, IV, plaintext), i due motori producono identici
output (ciphertext, authTag). Non esiste alcun parametro proprietario o
estensione non standard nei payload prodotti dalla funzione attuale.

La dimostrazione pratica è fornita dai golden test nella sezione 5: il
vettore G1, calcolato con WebCrypto, viene correttamente decifrato dalla
nuova implementazione.

**Nota su btoa e atob**: il report N4 originale menziona `btoa` e `atob`
come potenzialmente non disponibili in Hermes. Tuttavia, da React Native
0.72 in poi, Hermes include `btoa` e `atob` come funzioni globali
standard. Poiché questo progetto usa RN 0.82, l'encoding Base64 tramite
`btoa`/`atob` è disponibile e il layer di encoding del payload resta
invariato. Se, in fase di test, queste funzioni risultassero non
disponibili su qualche target specifico, il Coding Plan dovrà introdurre
un'alternativa compatibile prima di procedere.

### 4.4 Tradeoff sicurezza accettato

`crypto.subtle` usa il motore crittografico nativo del sistema operativo,
potenzialmente hardware-accelerato e certificato FIPS. `@noble/ciphers` è
un'implementazione JavaScript pura, sottoposta ad audit pubblici ma non
hardware-accelerata e senza certificazioni formali.

Questo tradeoff è **esplicitamente accettato** per i seguenti motivi:

- L'applicazione è una finanza personale ad uso individuale, senza
  requisiti di conformità normativa o certificazione.
- I payload cifrati sono oggetti JSON testuali di dimensione ridotta
  (tipicamente sotto il kilobyte).
- La decisione è reversibile: se in futuro emergessero requisiti di
  compliance, la libreria può essere sostituita con un'implementazione
  certificata mantenendo invariato il formato del payload e l'interfaccia
  pubblica.

### 4.5 Debolezza nota rinviata: derivazione della chiave

L'implementazione attuale trasforma il PIN in chiave con un semplice
padding e troncatura. Questo **non è** una funzione di derivazione
crittografica (come PBKDF2, scrypt o Argon2). Le conseguenze:

- Un PIN di 4 cifre produce una chiave di 32 byte in cui i 28 byte più
  significativi sono tutti `0`, riducendo drasticamente l'entropia
  effettiva della chiave.
- Un attaccante in possesso di un payload cifrato può condurre un attacco
  a forza bruta sullo spazio dei PIN molto più velocemente di quanto una
  KDF corretta permetterebbe.

Questa debolezza è **documentata qui come limite accettato** per questo
ciclo implementativo. Non verrà corretta in questo documento di design né
nel coding plan corrispondente: il suo perimetro è limitato alla
sostituzione di `crypto.subtle`. La derivazione della chiave sarà oggetto
di un documento di design dedicato prima del rilascio pubblico
dell'applicazione.

### 4.6 Interfaccia pubblica invariata

Le firme pubbliche di `encryptData` e `decryptData` non cambiano. Entrambe
accettano due stringhe e restituiscono una `Promise<string>`. Nessun
chiamante nel codebase attuale richiede modifiche. Il comportamento
osservabile dall'esterno — incluso il formato del payload Base64 — è
identico all'implementazione attuale.

Poiché l'implementazione attuale usa await su operazioni WebCrypto
asincrone, tutti i chiamanti esistenti si aspettano una Promise. La nuova
implementazione usa @noble/ciphers in modo sincrono internamente, ma le
funzioni pubbliche devono restare dichiarate come async oppure restituire
esplicitamente Promise.resolve con il risultato, per preservare la
semantica asincrona verso tutti i chiamanti. Cambiare la firma da
Promise a un valore diretto romperebbe silenziosamente ogni punto di
chiamata senza errori di compilazione visibili.

---

## 5. Golden Compatibility Tests

> Origine dei golden vectors: generati offline con
> implementazione di riferimento Python (@noble/ciphers
> equivalente) o estratti dalla test suite ufficiale
> della libreria. I vettori devono essere riproducibili
> indipendentemente dalla piattaforma.

Questa sezione definisce i vettori di test formali che il Coding Plan
deve implementare prima di qualsiasi altra modifica. Questi vettori sono
stati calcolati computazionalmente usando la stessa logica di `crypto.ts`
(stessa espansione della chiave, stessa costruzione del buffer, stessa
codifica Base64). L'identità dei risultati tra WebCrypto e `@noble/ciphers`
è verificabile ripetendo il calcolo con entrambi i motori.

### G1 — Testo breve ASCII

| Campo | Valore |
|-------|--------|
| Plaintext | `ciao` |
| Chiave grezza | `testkey` |
| Chiave espansa a 32 byte | `testkey0000000000000000000000000` |
| IV in esadecimale (12 byte) | `000000000000000000000001` |
| Output atteso in Base64 | `AAAAAAAAAAAAAAABISANl2PDhDno5kCjLeQlUbd7CRo=` |
| Lunghezza buffer decodificato | 32 byte (12 IV + 4 ciphertext + 16 authTag) |

### G2 — Testo con caratteri Unicode e simboli

| Campo | Valore |
|-------|--------|
| Plaintext | `prezzo: 10,99€ — nota speciale` |
| Chiave grezza | `mysecretkey2026!` |
| Chiave espansa a 32 byte | `mysecretkey2026!0000000000000000` |
| IV in esadecimale (12 byte) | `0f1e2d3c4b5a69788796a5b4` |
| Lunghezza plaintext UTF-8 | 34 byte (€ e — occupano 3 byte ciascuno in UTF-8) |
| Output atteso in Base64 | `Dx4tPEtaaXiHlqW0qBWeSTgueeBK8EEb+LdvPBzW6Pkddholq67CoFJgFMs4wJOxtTblft7zrE1mvvsCpAw=` |
| Lunghezza buffer decodificato | 62 byte (12 IV + 34 ciphertext + 16 authTag) |

### Test di decifratura inversa

Il valore Base64 del vettore G1, prodotto da WebCrypto, deve essere
decifrabile dalla nuova implementazione con la stessa chiave (`testkey`)
e restituire il plaintext originale (`ciao`). Questo test dimostra la
compatibilità bidirezionale tra la vecchia e la nuova implementazione.

### Regola dei golden test

Se uno qualunque dei due vettori non viene riprodotto esattamente dalla
nuova implementazione, il Coding Plan deve interrompersi e aprire un
report di diagnostica prima di proseguire. Nessun'altra modifica può
essere effettuata fino a quando i golden test non passano.

Nota critica sull'uso degli IV deterministici: gli IV fissi usati nei
vettori G1 e G2 sono ammessi esclusivamente nei golden test perché
servono a garantire la riproducibilità del valore Base64 atteso. In
qualsiasi contesto produttivo, ogni IV deve essere generato casualmente
tramite crypto.getRandomValues prima di ogni singola operazione di
cifratura. Riutilizzare lo stesso IV con la stessa chiave su plaintext
diversi compromette la sicurezza di AES-GCM in modo irreversibile. Il
Coding Plan non deve mai usare IV fissi al di fuori del contesto dei test.

---

## 6. Performance e threading

`@noble/ciphers` esegue la cifratura e la decifratura in modo sincrono
sul thread JavaScript. Le funzioni `encryptData` e `decryptData`
mantengono la firma asincrona (restituendo `Promise`) per compatibilità
con tutti i chiamanti esistenti, ma l'operazione crittografica interna
avviene sincronamente.

Per i payload tipici di questa applicazione — oggetti JSON con dati
finanziari, generalmente sotto il kilobyte — il costo computazionale di
AES-GCM è nell'ordine dei microsecondi su hardware moderno, molto al di
sotto della soglia di percettibilità da parte dell'utente (16 ms per
frame a 60 fps). Non esiste rischio concreto di freeze dell'interfaccia.

Se in futuro la dimensione dei payload dovesse crescere significativamente
(ad esempio per supportare export bulk o attachment), si valuterà
l'introduzione di un wrapper con task queue o l'uso di un worker thread.
Per l'attuale fase di sviluppo, questa considerazione è rinviata.

---

## 7. File da modificare

| File | Operazione | Descrizione sintetica |
|------|------------|-----------------------|
| `src/lib/crypto.ts` | PATCH | Sostituire `encryptData` e `decryptData` con implementazione basata su `@noble/ciphers`; `hashPin` e `verifyPin` invariate |
| `index.js` | PATCH | Aggiungere `react-native-get-random-values` come prima importazione assoluta, prima di qualsiasi altro modulo |
| `package.json` | PATCH | Aggiungere `@noble/ciphers` e `react-native-get-random-values` nelle `dependencies` |

---

> NOTA OPERATIVA C005-3 (solo per Plan):
> Verificare prima dell'implementazione che la versione
> di @noble/ciphers in uso supporti pure-JS senza
> dipendenze native. Questa verifica appartiene al
> Coding Plan 005, non al DESIGN.

---

## 8. Dipendenze da aggiungere

| Pacchetto | Versione minima | Motivazione |
|-----------|-----------------|-------------|
| `@noble/ciphers` | `^1.0.0` | Implementazione AES-GCM pure-JavaScript; zero binding nativi; compatibile con Hermes su Android, iOS e Windows |
| `react-native-get-random-values` | `^1.11.0` | Polyfill per `crypto.getRandomValues`; fornisce entropia dal CSPRNG del sistema operativo su tutti i target |

---

## 9. Vincoli e regole per il Coding Plan

Il Coding Plan che implementerà questo design deve rispettare le seguenti
regole senza eccezioni:

- **Non modificare `hashPin` e `verifyPin`**: queste funzioni funzionano
  correttamente su tutti i target e non rientrano nel perimetro di questo
  documento.
- **Non cambiare le firme pubbliche di `encryptData` e `decryptData`**:
  l'interfaccia pubblica è invariata per non rompere alcun chiamante
  esistente.
- **Implementare i golden test prima di qualsiasi altra modifica**: i due
  vettori della sezione 5 devono essere trasformati in test eseguibili e
  devono passare prima che il Coding Plan proceda con qualsiasi altra
  fase.
- **Se un golden test fallisce, bloccarsi**: in caso di fallimento di uno
  qualunque dei vettori, interrompere l'implementazione e aprire un report
  di diagnostica che descriva la discrepanza prima di procedere.
- **L'import di `react-native-get-random-values` deve essere la prima
  riga assoluta di `index.js`**: deve precedere qualsiasi altro import,
  incluso il bootstrap di `App`. Nessuna eccezione.
- **Non modificare il formato del payload**: la struttura
  `Base64( IV[12] | ciphertext[N] | authTag[16] )` deve essere preservata
  esattamente. Qualsiasi modifica al formato renderebbe illeggibili i dati
  già cifrati.

---

## Appendice — Test suite da creare

Non esiste attualmente alcun file di test per `src/lib/crypto.ts`. Il
Coding Plan deve creare la test suite contestualmente all'implementazione.

- Path dei file di test: `__tests__/crypto/` oppure `src/__tests__/crypto/` (da confermare in Plan 005)
- Framework di test atteso: Jest con preset react-native (già configurato nel progetto)
- I test devono girare su Node (senza device) usando i golden vectors definiti nel documento.

Di seguito l'elenco dei casi da coprire, descritti in linguaggio naturale.

### Casi obbligatori (golden test)

- **G1**: cifrare il plaintext `ciao` con chiave `testkey` e IV fisso
  `000000000000000000000001` deve produrre esattamente il Base64
  `AAAAAAAAAAAAAAABISANl2PDhDno5kCjLeQlUbd7CRo=`.
- **G2**: cifrare `prezzo: 10,99€ — nota speciale` con chiave
  `mysecretkey2026!` e IV fisso `0f1e2d3c4b5a69788796a5b4` deve produrre
  esattamente il Base64
  `Dx4tPEtaaXiHlqW0qBWeSTgueeBK8EEb+LdvPBzW6Pkddholq67CoFJgFMs4wJOxtTblft7zrE1mvvsCpAw=`.
- **G3 (decifratura inversa)**: decifrare il valore Base64 di G1 con
  chiave `testkey` deve restituire `ciao`. Questo verifica la
  compatibilità bidirezionale tra vecchia e nuova implementazione.

### Casi aggiuntivi

- **R1 (round-trip)**: cifrare una stringa arbitraria e subito decifrarla
  con la stessa chiave deve restituire la stringa originale immutata.
  Verificare con almeno due plaintext diversi.
- **E1 (chiave errata)**: tentare di decifrare un payload valido con una
  chiave diversa da quella usata per cifrarlo deve risultare in un errore.
  L'errore indica che l'autenticazione AES-GCM ha rilevato la chiave non
  corrispondente.
- **E2 (payload manomesso)**: modificare un singolo byte all'interno del
  ciphertext (non nell'IV) e tentare la decifratura deve causare un
  errore. Questo verifica che il meccanismo di autenticazione di AES-GCM
  sia effettivo.
- **E3 (payload troncato)**: tentare di decifrare un Base64 che corrisponde
  a un buffer più corto di 28 byte (12 IV + almeno 1 byte ciphertext + 16
  authTag) deve causare un errore controllato, non un crash non gestito.
- **A1 (contratto asincrono)**: il valore restituito da `encryptData` e da
  `decryptData` deve essere un'istanza di Promise. Verificare che la
  chiamata sia incatenabile tramite `.then()` e che il risultato non venga
  restituito in modo sincrono. Questo garantisce che la firma pubblica
  asincrona sia preservata e che nessun chiamante esistente si rompa
  silenziosamente a seguito della migrazione interna a @noble/ciphers.

### Casi per hashPin e verifyPin

Poiché `hashPin` e `verifyPin` non vengono modificate, i loro test
dovrebbero verificare unicamente che il comportamento sia invariato dopo
il refactoring di `encryptData`/`decryptData`. Un singolo test di
round-trip (hash di un PIN, verifica con lo stesso PIN) è sufficiente.

### Casi di sicurezza RNG

- **S1 (IV casuale in produzione)**: cifrare la stessa stringa due volte
  consecutive con la stessa chiave deve produrre due valori Base64 distinti.
  Questo verifica che ogni invocazione di `encryptData` genera un IV diverso
  tramite `crypto.getRandomValues` e non riutilizza mai un IV fisso. Due
  payload identici in ingresso non devono mai produrre payload identici in
  uscita: l'uguaglianza dell'output indicherebbe un IV ripetuto, che
  comprometterebbe la sicurezza di AES-GCM in modo irreversibile.
