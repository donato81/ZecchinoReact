---
tipo: plan
titolo: Sostituzione crypto.subtle — N4 (encryptData / decryptData)
versione: 1.0.0
data: 2026-05-22
stato: IMPLEMENTED
design: docs/2-projects/005-DESIGN_sostituzione-crypto-N4_v0.5.0.md
perimetro: src/lib/crypto.ts, index.js, package.json, __tests__/crypto/
---

# PLAN 005 — Sostituzione crypto.subtle (N4)

> **Fonte di verità**: ogni decisione tecnica di questo piano è derivata
> da
> [docs/2-projects/005-DESIGN_sostituzione-crypto-N4_v0.5.0.md](../2-projects/005-DESIGN_sostituzione-crypto-N4_v0.5.0.md).
> In caso di discrepanza, il documento di design prevale.

---

## 1. Precondizioni di avvio

Le seguenti condizioni devono essere verificate prima dell'inizio della
Fase 0. Se anche una sola non è soddisfatta: STOP, non procedere.

- **DESIGN 001 implementato**: blocchi di avvio B1–B6 risolti. Metro
  avvia, alias `@/` risolve.
- **DESIGN 002 implementato**: provider bootstrap stabile. Nessun crash
  al mount dei context.
- **N11 attivo**: `tsconfig.json` non contiene più `"types": ["node"]`.
  Verificare con:
  ```bash
  grep -E '"types"\s*:\s*\["node"\]' tsconfig.json
  ```
  Il comando deve restituire 0 occorrenze.
- **Branch operativo**: nessun branch dedicato da creare. Operare sul
  branch attivo come da prassi del progetto.
- **Test suite assente**: non esiste alcun file di test per
  `src/lib/crypto.ts`. La suite va creata in Fase 0 contestualmente
  all'implementazione.
- **`hashPin` e `verifyPin` funzionanti**: verificare che `bcryptjs` sia
  presente in `dependencies` di `package.json`.

---

## 2. Decisione: path della test suite

Il DESIGN 005 (sezione Appendice) lascia aperta la scelta tra:

- `__tests__/crypto/`
- `src/__tests__/crypto/`

**Decisione**: la test suite va creata in `__tests__/crypto/`.

**Motivazione**: il progetto adotta già la convenzione di posizionare i
test alla root del repository in `__tests__/`. La verifica diretta lo
conferma:

```text
__tests__/
  App.test.tsx
  ExportService.test.ts
```

Nessun file di test esiste sotto `src/`. Per coerenza con la convenzione
già consolidata, i nuovi file vanno collocati in `__tests__/crypto/`.
Il preset Jest `react-native` configurato in `jest.config.js` raccoglie
automaticamente i file in `__tests__/**`.

File da creare:

- `__tests__/crypto/golden.test.ts` — vettori G1, G2, G3 (Fase 0).
- `__tests__/crypto/encrypt-decrypt.test.ts` — casi R1, E1, E2, E3, A1, S1
  (Fase 5).
- `__tests__/crypto/pin.test.ts` — round-trip `hashPin`/`verifyPin`
  (Fase 5, regressione).

---

## 3. Fase 0 — Golden test (BLOCCANTE, PRIMA DI QUALSIASI ALTRA MODIFICA)

Questa fase deve essere completata prima di modificare `package.json`,
`index.js` o `src/lib/crypto.ts`. Nessuna riga di codice di produzione
può essere toccata prima che i golden test eseguano (anche se inizialmente
falliscono perché l'implementazione non è ancora cambiata).

### 3.1 Obiettivo

Creare i test eseguibili per i vettori G1, G2, G3 della sezione 5 del
DESIGN 005. I test devono girare su Node tramite Jest, senza device
fisico.

### 3.2 File da creare

`__tests__/crypto/golden.test.ts` con tre casi di test:

- **G1**: cifrare `ciao` con chiave grezza `testkey` (espansa a 32 byte
  con padding `0`) e IV fisso `000000000000000000000001` deve produrre
  esattamente:
  `AAAAAAAAAAAAAAABISANl2PDhDno5kCjLeQlUbd7CRo=`.
- **G2**: cifrare `prezzo: 10,99€ — nota speciale` con chiave grezza
  `mysecretkey2026!` (espansa a 32 byte) e IV fisso
  `0f1e2d3c4b5a69788796a5b4` deve produrre esattamente:
  `Dx4tPEtaaXiHlqW0qBWeSTgueeBK8EEb+LdvPBzW6Pkddholq67CoFJgFMs4wJOxtTblft7zrE1mvvsCpAw=`.
- **G3**: decifrare il valore Base64 di G1 con chiave `testkey` deve
  restituire `ciao`.

### 3.3 Vincolo sugli IV deterministici

Gli IV fissi sono ammessi **solo** in questo file di test. Il Coding
Plan non deve mai usare IV fissi nelle funzioni `encryptData` di
produzione. Riferimento: DESIGN 005 §5, "Nota critica sull'uso degli IV
deterministici".

### 3.4 Esecuzione

```bash
npx jest __tests__/crypto/golden.test.ts
```

### 3.5 Gate Fase 0

**Prima di procedere alla Fase 1, verificare che**:

- I tre casi G1, G2, G3 sono scritti come `test(...)` Jest eseguibili.
- Il file compila senza errori TypeScript (`npx tsc --noEmit`).
- I test possono essere lanciati (anche se falliscono perché
  l'implementazione non è ancora migrata): Jest deve trovare il file e
  produrre output strutturato per ciascuno dei tre casi.

Se un golden test, dopo l'implementazione delle fasi successive, fallisce:
**STOP**. Produrre un report diagnostico che riporti il valore Base64
prodotto vs il valore Base64 atteso (delta byte-per-byte). Nessuna altra
modifica al codice prima della risoluzione.

---

## 4. Fase 1 — Dipendenze

### 4.1 File toccati

`package.json`.

### 4.2 Modifiche

Aggiungere in `dependencies` (rispettare l'ordine alfabetico):

```diff
   "dependencies": {
+    "@noble/ciphers": "^1.0.0",
     "...altre dipendenze..."
+    "react-native-get-random-values": "^1.11.0"
   }
```

### 4.3 Verifica pure-JS

Riferimento: DESIGN 005 sezione 7, NOTA OPERATIVA C005-3.

Dopo `npm install`, verificare che `@noble/ciphers` sia pure-JS senza
binding nativi:

```bash
ls node_modules/@noble/ciphers/
```

Non devono esistere cartelle `android/`, `ios/`, `windows/`, né file
`binding.gyp`, `*.so`, `*.dylib`, `*.dll`. Se uno qualsiasi di questi
artefatti è presente: **STOP**, la versione installata non rispetta il
vincolo del DESIGN. Aprire un report diagnostico.

### 4.4 Gate Fase 1

**Prima di procedere alla Fase 2, verificare che**:

- `npm install` termina con exit code 0.
- `node_modules/@noble/ciphers/` esiste e non contiene binding nativi.
- `node_modules/react-native-get-random-values/` esiste.

---

## 5. Fase 2 — Polyfill RNG

### 5.1 File toccati

`index.js`.

### 5.2 Modifica

Aggiungere come **prima riga assoluta del file**, prima di qualsiasi
altro import (incluso `App`):

```js
import 'react-native-get-random-values';
```

Questa istruzione non ha eccezioni. Riferimento: DESIGN 005 §4.2 e §9.

Stato finale atteso di `index.js`:

```js
import 'react-native-get-random-values';
// ...import preesistenti, inclusi App e AppRegistry, nello stesso ordine
// in cui erano prima della modifica.
```

### 5.3 Gate Fase 2

**Prima di procedere alla Fase 3, verificare che**:

- La prima riga di `index.js` è `import 'react-native-get-random-values';`.
  Verificare con:
  ```bash
  head -n 1 index.js
  ```
- `npm start` (Metro) avvia senza errori di risoluzione del modulo.
- Nessun altro import o statement precede il polyfill nel file.

---

## 6. Fase 3 — Sostituzione `encryptData` e `decryptData`

### 6.1 File toccati

`src/lib/crypto.ts`.

### 6.2 Funzioni da modificare

- `encryptData(plaintext: string, key: string): Promise<string>`
- `decryptData(payload: string, key: string): Promise<string>`

### 6.3 Funzioni invariate (vincolo bloccante)

- `hashPin` — non toccare.
- `verifyPin` — non toccare.

Riferimento: DESIGN 005 §9, prima regola "Non modificare `hashPin` e
`verifyPin`".

### 6.4 Contratto da preservare

| Aspetto | Vincolo |
|---------|---------|
| Firma | `async` o `Promise.resolve(...)`; tipo di ritorno `Promise<string>` |
| Formato payload | `Base64( IV[12] | Ciphertext[N] | AuthTag[16] )` byte per byte |
| Encoding | Base64 standard via `btoa`/`atob` (disponibili in Hermes da RN 0.72) |
| Derivazione chiave | Padding `0` fino a 32 byte e troncatura ai primi 32 byte, conversione UTF-8 (invariata) |
| IV | Generato casualmente via `crypto.getRandomValues` ad ogni chiamata di `encryptData` |

### 6.5 Implementazione

- Usare `gcm` di `@noble/ciphers/aes` per AES-GCM (chiave 32 byte, IV 12
  byte).
- `encryptData`:
  1. Derivare la chiave (pad+trunc a 32 byte, UTF-8) — logica invariata.
  2. Generare IV di 12 byte con `crypto.getRandomValues(new Uint8Array(12))`.
  3. Cifrare il plaintext UTF-8 ottenendo `ciphertext + authTag`
     concatenati (formato già nativo di `@noble/ciphers` AES-GCM).
  4. Concatenare `IV || ciphertext || authTag` in un `Uint8Array`.
  5. Codificare in Base64 via `btoa(String.fromCharCode(...buffer))`.
- `decryptData`:
  1. Decodificare il Base64 via `atob`.
  2. Estrarre IV (byte 0–11) e `ciphertext+authTag` (byte 12 in poi).
  3. Derivare la chiave (stessa logica di `encryptData`).
  4. Decifrare con AES-GCM; in caso di authTag non valido,
     `@noble/ciphers` solleva eccezione: rilanciare un errore
     descrittivo (`'Decryption failed: authentication tag mismatch'`).
  5. Decodificare il risultato UTF-8.
- Anche se la logica interna è sincrona, le funzioni restano `async`
  oppure restituiscono `Promise.resolve(...)`. Cambiare la firma è
  vietato. Riferimento: DESIGN 005 §4.6.

### 6.6 Gate Fase 3

**Prima di procedere alla Fase 4, verificare che**:

- `src/lib/crypto.ts` non contiene più alcun riferimento a
  `crypto.subtle`. Verificare con:
  ```bash
  grep -n "crypto\.subtle" src/lib/crypto.ts
  ```
  Il comando deve restituire 0 occorrenze.
- `hashPin` e `verifyPin` sono testualmente identiche alla versione
  pre-modifica (`git diff src/lib/crypto.ts` non deve mostrare modifiche
  sulle loro righe).
- Le firme pubbliche di `encryptData` e `decryptData` restano
  `Promise<string>`.
- `npx tsc --noEmit` non produce errori in `src/lib/crypto.ts`.

---

## 7. Fase 4 — Esecuzione golden test

### 7.1 Comando

```bash
npx jest __tests__/crypto/golden.test.ts
```

### 7.2 Gate Fase 4

**Prima di procedere alla Fase 5, verificare che**:

- G1 passa: cifratura produce esattamente il Base64 atteso.
- G2 passa: cifratura produce esattamente il Base64 atteso.
- G3 passa: decifratura del Base64 di G1 restituisce `ciao`.

Se uno dei tre fallisce: **STOP**. Produrre report diagnostico con:

- Valore Base64 prodotto vs valore Base64 atteso.
- Delta byte-per-byte (decodificare entrambi e confrontare byte a byte).
- Lunghezza buffer prodotto vs lunghezza attesa.

Nessuna altra modifica al codice prima della risoluzione.

---

## 8. Fase 5 — Test aggiuntivi

### 8.1 File da creare

- `__tests__/crypto/encrypt-decrypt.test.ts` con i casi R1, E1, E2, E3,
  A1, S1.
- `__tests__/crypto/pin.test.ts` con il round-trip `hashPin`/`verifyPin`.

### 8.2 Casi da implementare

Riferimento: DESIGN 005 Appendice, "Casi aggiuntivi" e "Casi di
sicurezza RNG".

- **R1 (round-trip)**: cifrare e subito decifrare una stringa con la
  stessa chiave; il plaintext deve essere identico. Verificare con
  almeno due plaintext diversi (uno ASCII breve, uno con Unicode).
- **E1 (chiave errata)**: cifrare con chiave A, decifrare con chiave B;
  l'operazione deve sollevare errore.
- **E2 (payload manomesso)**: cifrare, modificare un singolo byte del
  ciphertext (non dell'IV), decifrare; l'operazione deve sollevare
  errore.
- **E3 (payload troncato)**: cifrare, troncare il buffer a meno di 28
  byte totali, decifrare; l'operazione deve sollevare errore controllato
  (non crash non gestito).
- **A1 (contratto asincrono)**: verificare che `encryptData(...)` e
  `decryptData(...)` restituiscono istanze di `Promise`; verificare con
  `expect(result).toBeInstanceOf(Promise)` e con `.then()` chainable.
- **S1 (IV casuale)**: cifrare lo stesso plaintext due volte con la
  stessa chiave; i due output Base64 devono essere distinti. Se sono
  uguali, l'IV non è casuale e la sicurezza è compromessa.

### 8.3 Regressione hashPin / verifyPin

In `__tests__/crypto/pin.test.ts`:

- Hash di un PIN tramite `hashPin`.
- Verifica con `verifyPin` usando lo stesso PIN: deve restituire `true`.
- Verifica con `verifyPin` usando un PIN diverso: deve restituire `false`.

### 8.4 Gate Fase 5

**Prima di procedere al Gate di chiusura, verificare che**:

- Tutti i casi R1, E1, E2, E3, A1, S1 passano.
- I test di regressione `hashPin`/`verifyPin` passano.
- Suite completa eseguita con:
  ```bash
  npx jest __tests__/crypto/
  ```
  exit code 0.

---

## 9. Gate di chiusura Plan 005

Prima di dichiarare Plan 005 completato, verificare che **tutti** i
seguenti punti siano soddisfatti:

- [ ] G1, G2, G3 passano (`npx jest __tests__/crypto/golden.test.ts`).
- [ ] R1, E1, E2, E3, A1, S1 passano
      (`npx jest __tests__/crypto/encrypt-decrypt.test.ts`).
- [ ] Test regressione PIN passa (`npx jest __tests__/crypto/pin.test.ts`).
- [ ] `hashPin` e `verifyPin` non sono stati toccati
      (`git diff src/lib/crypto.ts` sulle relative righe = vuoto).
- [ ] Firme pubbliche di `encryptData` e `decryptData` invariate
      (`Promise<string>`).
- [ ] Formato payload preservato (verificato da G1, G2, G3).
- [ ] Prima riga di `index.js` è `import 'react-native-get-random-values';`.
- [ ] `@noble/ciphers` è pure-JS (verificato in §4.3).
- [ ] `grep -n "crypto\.subtle" src/lib/crypto.ts` = 0 occorrenze.
- [ ] `npx tsc --noEmit` exit code 0.
- [ ] `npx jest __tests__/crypto/` exit code 0.

Se tutti i punti sono soddisfatti: stato del documento → **IMPLEMENTED**.

---

## 10. Vincoli e regole operative

Estratti operativi dal DESIGN 005 §9 e §4.4. L'agente implementatore
deve rispettare ciascuno di questi vincoli senza eccezioni.

### Vincoli bloccanti

- **V1**: non modificare `hashPin` e `verifyPin`. Fuori perimetro.
- **V2**: non cambiare le firme pubbliche di `encryptData` e
  `decryptData`. Restano `Promise<string>`.
- **V3**: implementare i golden test (G1, G2, G3) **prima** di qualsiasi
  altra modifica al codice di produzione.
- **V4**: se un golden test fallisce, bloccarsi e aprire un report
  diagnostico. Nessuna altra modifica prima della risoluzione.
- **V5**: `import 'react-native-get-random-values';` deve essere la
  **prima riga assoluta** di `index.js`. Nessuna eccezione.
- **V6**: non modificare il formato del payload
  `Base64( IV[12] | ciphertext[N] | authTag[16] )`. Qualsiasi modifica
  renderebbe illeggibili i dati già cifrati.
- **V7**: non usare IV fissi al di fuori dei golden test. In produzione,
  ogni IV deve essere generato con `crypto.getRandomValues`.
- **V8**: non usare `Math.random` o algoritmi pseudocasuali non
  crittografici per l'IV. Riferimento: DESIGN 005 §4.2.

### Tradeoff accettato (trasparenza documentale)

Riferimento: DESIGN 005 §4.4.

`@noble/ciphers` è un'implementazione JavaScript pura, sottoposta ad
audit pubblici ma non hardware-accelerata e senza certificazioni FIPS.
Questo tradeoff rispetto a `crypto.subtle` è **esplicitamente accettato**
per le seguenti ragioni:

- L'applicazione è una finanza personale ad uso individuale, senza
  requisiti di conformità normativa.
- I payload cifrati sono oggetti JSON testuali di dimensione ridotta
  (tipicamente sotto il kilobyte).
- La decisione è reversibile: il formato del payload è stabile e
  l'interfaccia pubblica è invariata, quindi un'eventuale sostituzione
  futura con un'implementazione certificata non richiede migrazioni.

### Debolezza nota rinviata

Riferimento: DESIGN 005 §4.5.

La derivazione della chiave dal PIN (padding + troncatura) è una
debolezza nota documentata. Questo Plan **non** la affronta: il suo
perimetro è la sostituzione di `crypto.subtle`. La correzione è
demandata a Plan 006 (KDF PBKDF2-SHA256).
