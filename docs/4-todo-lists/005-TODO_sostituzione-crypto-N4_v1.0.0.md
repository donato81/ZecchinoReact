---
tipo: todo
titolo: "TODO — Sostituzione crypto.subtle N4 (DESIGN 005)"
riferimento-design: docs/2-projects/005-DESIGN_sostituzione-crypto-N4_v0.5.0.md
riferimento-plan: docs/3-coding-plans/005-PLAN_sostituzione-crypto-N4_v1.0.0.md
versione: 1.0.0
data-creazione: 2026-05-22
stato: IMPLEMENTED
agente: Agent-Orchestrator
data-completamento: 2026-05-22
note-stato: >-
  Migrazione completata. T1–T8 eseguiti in ordine canonico.
  Suite __tests__/crypto/: 11/11 PASS (golden 3, encrypt-decrypt 6, pin 2).
  Gate chiusura §9 (11 punti) superato. Vincoli V1–V11 rispettati.
---

# TODO 005 — Sostituzione crypto.subtle N4

## 1. Stato / Snapshot

| Campo | Valore |
|-------|--------|
| Ultimo Agente Attivo | Agent-Orchestrator |
| Blocco in Carico | — (chiuso) |
| Last Completed Task | T8 — suite completa + tsc (11/11 PASS) |
| Next Action | Migrazione conclusa. Riferimento futuro: PLAN 006 (KDF reale). |
| Open Threads | — |

---

## 2. Stato task

| Task | File target | Azione | Gate | Stato |
|------|-------------|--------|------|-------|
| T1 | `__tests__/crypto/golden.test.ts` | CREATE | Gate F0 | ☐ |
| T2 | `package.json` | PATCH (aggiungi dipendenze) | Gate F1 | ☐ |
| T3 | `index.js` | PATCH (polyfill prima riga) | Gate F2 | ☐ |
| T4 | `src/lib/crypto.ts` | PATCH (encryptData + decryptData) | Gate F3 | ☐ |
| T5 | [esecuzione golden test] | RUN | Gate F4 | ☐ |
| T6 | `__tests__/crypto/encrypt-decrypt.test.ts` | CREATE | Gate F5 | ☐ |
| T7 | `__tests__/crypto/pin.test.ts` | CREATE | Gate F5 | ☐ |
| T8 | [esecuzione suite completa] | RUN | Gate chiusura | ☐ |

---

## 3. Task atomici

### T1 — `__tests__/crypto/golden.test.ts` (CREATE)

- **File:** `__tests__/crypto/golden.test.ts`
- **Azione:** Creare il file con i tre casi di test G1, G2, G3 che verificano
  la compatibilità dei vettori crittografici di riferimento.
- **Dipende da:** nessuna (BLOCCANTE — deve precedere ogni altra modifica)
- **Gate F0:**
  ```bash
  npx jest __tests__/crypto/golden.test.ts
  npx tsc --noEmit
  ```
  Jest deve trovare il file e produrre output strutturato per ciascuno dei
  tre casi. Il fallimento iniziale dei test è atteso (vedi nota sotto).

#### Vettori di riferimento (da PLAN §3.2 e DESIGN §5)

**G1** — Testo breve ASCII:
- Plaintext: `ciao`
- Chiave grezza: `testkey` — espansa a `testkey0000000000000000000000000`
- IV in esadecimale (12 byte): `000000000000000000000001`
- Output Base64 atteso: `AAAAAAAAAAAAAAABISANl2PDhDno5kCjLeQlUbd7CRo=`
- Lunghezza buffer decodificato: 32 byte (12 IV + 4 ciphertext + 16 authTag)

**G2** — Testo con Unicode e simboli:
- Plaintext: `prezzo: 10,99€ — nota speciale`
- Chiave grezza: `mysecretkey2026!` — espansa a `mysecretkey2026!0000000000000000`
- IV in esadecimale (12 byte): `0f1e2d3c4b5a69788796a5b4`
- Output Base64 atteso: `Dx4tPEtaaXiHlqW0qBWeSTgueeBK8EEb+LdvPBzW6Pkddholq67CoFJgFMs4wJOxtTblft7zrE1mvvsCpAw=`
- Lunghezza plaintext UTF-8: 34 byte (€ e — occupano 3 byte ciascuno)
- Lunghezza buffer decodificato: 62 byte (12 IV + 34 ciphertext + 16 authTag)

**G3** — Decifratura inversa:
- Input: Base64 di G1 (`AAAAAAAAAAAAAAABISANl2PDhDno5kCjLeQlUbd7CRo=`),
  chiave `testkey`
- Output atteso: `ciao`
- Questo caso verifica la compatibilità bidirezionale tra vecchia e nuova
  implementazione.

> **NOTA FASE 0 — FALLIMENTO INIZIALE ATTESO**
>
> I golden test devono essere creati ed eseguiti **prima** di qualsiasi
> modifica a `crypto.ts`, `package.json` o `index.js`. Il fallimento
> iniziale è previsto e metodologicamente corretto: l'implementazione usa
> ancora `crypto.subtle`, che non è disponibile in Node. Jest deve trovare
> il file e produrre output strutturato per G1, G2, G3.
> È vietato modificare `crypto.ts` per forzare un PASS prima di aver
> completato le Fasi 1→3 (V3 del PLAN §10).

- [ ] Directory `__tests__/crypto/` creata
- [ ] File `__tests__/crypto/golden.test.ts` creato
- [ ] Test G1 scritto come `test(...)` Jest eseguibile con IV fisso
- [ ] Test G2 scritto come `test(...)` Jest eseguibile con IV fisso
- [ ] Test G3 scritto come `test(...)` Jest eseguibile (decifratura G1)
- [ ] `npx tsc --noEmit` exit 0 sul file
- [ ] `npx jest __tests__/crypto/golden.test.ts` produce output strutturato
  per tutti e tre i casi (exit 0 o exit 1 con output visibile per G1/G2/G3)

---

### T2 — `package.json` (PATCH)

- **File:** `package.json`
- **Azione:** Aggiungere `"@noble/ciphers": "^1.0.0"` e
  `"react-native-get-random-values": "^1.11.0"` in `dependencies`
  (rispettare l'ordine alfabetico della sezione).
- **Dipende da:** T1 (Gate F0 superato)
- **Gate F1:**
  ```bash
  npm install
  ls node_modules/@noble/ciphers/
  ls node_modules/react-native-get-random-values/
  ```
  `npm install` exit code 0. `node_modules/@noble/ciphers/` non deve
  contenere `android/`, `ios/`, `windows/`, `binding.gyp`, `*.so`,
  `*.dylib`, `*.dll`. Se uno di questi artefatti è presente: STOP
  (violazione purezza pure-JS di `@noble/ciphers`).

- [ ] `"@noble/ciphers": "^1.0.0"` aggiunto in `dependencies`
- [ ] `"react-native-get-random-values": "^1.11.0"` aggiunto in `dependencies`
- [ ] `npm install` exit code 0
- [ ] `node_modules/@noble/ciphers/` esiste senza binding nativi
- [ ] `node_modules/react-native-get-random-values/` esiste

---

### T3 — `index.js` (PATCH)

- **File:** `index.js`
- **Azione:** Aggiungere `import 'react-native-get-random-values';` come
  prima riga assoluta del file, prima di qualsiasi altro import o statement.
- **Dipende da:** T2 (Gate F1 superato)
- **Gate F2:**
  ```bash
  head -n 1 index.js
  ```
  La prima riga deve essere esattamente `import 'react-native-get-random-values';`.
  Nessun altro import, statement o commento deve precedere il polyfill.

- [ ] Prima riga di `index.js` è `import 'react-native-get-random-values';`
- [ ] Nessun altro statement o commento precede il polyfill
- [ ] Import preesistenti mantenuti nell'ordine originale dopo il polyfill
- [ ] `head -n 1 index.js` restituisce `import 'react-native-get-random-values';`

---

### T4 — `src/lib/crypto.ts` (PATCH)

- **File:** `src/lib/crypto.ts`
- **Azione:** Riscrivere `encryptData` e `decryptData` usando `gcm` di
  `@noble/ciphers/aes`. Le funzioni `hashPin` e `verifyPin` non devono
  essere toccate.
- **Dipende da:** T3 (Gate F2 superato)
- **Gate F3:**
  ```bash
  grep -n "crypto\.subtle" src/lib/crypto.ts
  npx tsc --noEmit
  ```
  `grep crypto.subtle` deve restituire 0 occorrenze. `npx tsc --noEmit`
  exit 0. `git diff src/lib/crypto.ts` non deve mostrare modifiche sulle
  righe di `hashPin` e `verifyPin`.

> **NOTA V8 — CHECK ANTI-Math.random**
>
> Dopo la modifica di `crypto.ts`, eseguire:
> ```bash
> grep -nE "Math\.random|Date\.now" src/lib/crypto.ts
> ```
> Il comando deve restituire 0 occorrenze. In produzione ogni IV deve
> essere generato esclusivamente con `crypto.getRandomValues`.
> Questo check non è nel gate ufficiale del PLAN §6.6 ma è raccomandato
> come verifica aggiuntiva (V8 del PLAN §10 e DESIGN §4.2).

- [ ] `encryptData` riscritto con `gcm` di `@noble/ciphers/aes`
- [ ] `decryptData` riscritto con `gcm` di `@noble/ciphers/aes`
- [ ] `hashPin` non modificata
- [ ] `verifyPin` non modificata
- [ ] Firma `encryptData(plaintext: string, key: string): Promise<string>` invariata
- [ ] Firma `decryptData(payload: string, key: string): Promise<string>` invariata
- [ ] Formato payload preservato: `Base64( IV[12] | Ciphertext[N] | AuthTag[16] )`
- [ ] `grep -n "crypto\.subtle" src/lib/crypto.ts` = 0 occorrenze
- [ ] `grep -nE "Math\.random|Date\.now" src/lib/crypto.ts` = 0 occorrenze
- [ ] `npx tsc --noEmit` exit 0

---

### T5 — Esecuzione golden test post-migrazione (RUN)

- **File:** `__tests__/crypto/golden.test.ts` (esecuzione)
- **Azione:** Eseguire i golden test dopo aver completato le Fasi 1→3
  (T2, T3, T4). Tutti e tre i vettori G1, G2, G3 devono passare.
- **Dipende da:** T4 (Gate F3 superato)
- **Gate F4:**
  ```bash
  npx jest __tests__/crypto/golden.test.ts
  ```
  Tutti e tre i test (G1, G2, G3) devono passare con exit code 0.

> **NOTA DIAGNOSTICA — SE UN GOLDEN TEST FALLISCE POST-MIGRAZIONE**
>
> Se G1, G2 o G3 fallisce dopo la migrazione: **STOP**.
> Produrre report con:
> - Valore Base64 prodotto vs valore Base64 atteso
> - Delta byte-per-byte (decodificare entrambi e confrontare byte a byte)
> - Lunghezza buffer prodotto vs lunghezza attesa
>
> Nessuna altra modifica prima della risoluzione (V4 del PLAN §10).

- [ ] G1 passa: output Base64 = `AAAAAAAAAAAAAAABISANl2PDhDno5kCjLeQlUbd7CRo=`
- [ ] G2 passa: output Base64 = `Dx4tPEtaaXiHlqW0qBWeSTgueeBK8EEb+LdvPBzW6Pkddholq67CoFJgFMs4wJOxtTblft7zrE1mvvsCpAw=`
- [ ] G3 passa: decifratura del Base64 di G1 restituisce `ciao`
- [ ] `npx jest __tests__/crypto/golden.test.ts` exit code 0

---

### T6 — `__tests__/crypto/encrypt-decrypt.test.ts` (CREATE)

- **File:** `__tests__/crypto/encrypt-decrypt.test.ts`
- **Azione:** Creare la suite di test funzionali e di sicurezza con i casi
  R1, E1, E2, E3, A1, S1. Riferimento: PLAN §8.2 e DESIGN §Appendice.
- **Dipende da:** T5 (Gate F4 superato)
- **Gate F5:**
  ```bash
  npx jest __tests__/crypto/encrypt-decrypt.test.ts
  npx tsc --noEmit
  ```
  Tutti i casi devono passare con exit code 0.

#### Descrizione dei casi

**R1 — Round-trip**: cifrare una stringa con una chiave, decifrare con la
stessa chiave; il plaintext recuperato deve essere identico all'originale.
Verificare con almeno due plaintext diversi (uno ASCII breve, uno contenente
caratteri Unicode).

**E1 — Chiave errata**: cifrare con chiave A, tentare la decifratura con
chiave B diversa; l'operazione deve sollevare un errore (autenticazione
AES-GCM fallita). Dimostra che il meccanismo di autenticazione è attivo.

**E2 — Payload manomesso**: cifrare una stringa, modificare un singolo byte
nel ciphertext (byte in posizione > 11, non nell'IV), tentare la decifratura;
l'operazione deve sollevare un errore. AES-GCM deve rilevare la manomissione
tramite l'authTag.

**E3 — Payload troncato**: cifrare una stringa, troncare il buffer a meno di
28 byte totali, tentare la decifratura del Base64 troncato; l'operazione deve
sollevare un errore controllato, non un crash non gestito.

> Soglia 28 byte: `28 = 12 byte IV + 16 byte AuthTag`
> (payload AES-GCM minimo valido con plaintext vuoto).
> Un buffer con meno di 28 byte non può contenere nessun payload valido.

**A1 — Contratto asincrono**: verificare che `encryptData(...)` e
`decryptData(...)` restituiscono istanze di `Promise`. Verificare sia con
`expect(result).toBeInstanceOf(Promise)` sia che il valore sia incatenabile
tramite `.then()`. Garantisce che la firma pubblica asincrona sia preservata
dopo la migrazione interna a `@noble/ciphers` (sincrona internamente).

**S1 — IV casuale**: cifrare il medesimo plaintext due volte consecutive con
la medesima chiave; i due output Base64 devono essere distinti.

> Se i due valori Base64 risultano identici, l'IV non è casuale:
> la sicurezza di AES-GCM è compromessa in modo irreversibile.
> Non si tratta di un semplice fallimento del test, ma di una violazione
> diretta del vincolo V7 (PLAN §10) e V8 (DESIGN §4.2).

- [ ] Caso R1 implementato (almeno 2 plaintext: ASCII + Unicode)
- [ ] Caso E1 implementato (chiave errata → errore atteso)
- [ ] Caso E2 implementato (payload manomesso → errore atteso)
- [ ] Caso E3 implementato (buffer < 28 byte → errore controllato)
- [ ] Caso A1 implementato (`toBeInstanceOf(Promise)` + `.then()` chainable)
- [ ] Caso S1 implementato (due cifrature = due Base64 distinti)
- [ ] `npx tsc --noEmit` exit 0 sul file

---

### T7 — `__tests__/crypto/pin.test.ts` (CREATE)

- **File:** `__tests__/crypto/pin.test.ts`
- **Azione:** Creare il file di regressione per `hashPin` e `verifyPin`.
  Riferimento: PLAN §8.3 e DESIGN §Appendice.
- **Dipende da:** T5 (Gate F4 superato; parallela a T6)
- **Gate F5:**
  ```bash
  npx jest __tests__/crypto/pin.test.ts
  npx tsc --noEmit
  ```
  Tutti i casi devono passare con exit code 0.

#### Casi da implementare

- Hash di un PIN tramite `hashPin`; verifica con `verifyPin` con lo stesso
  PIN: deve restituire `true`.
- Verifica con `verifyPin` usando un PIN diverso: deve restituire `false`.

- [ ] Caso round-trip: `verifyPin(pin, await hashPin(pin))` = `true`
- [ ] Caso PIN diverso: `verifyPin(altroPIN, hash)` = `false`
- [ ] `npx tsc --noEmit` exit 0 sul file

---

### T8 — Esecuzione suite completa (RUN)

- **File:** `__tests__/crypto/` (intera directory)
- **Azione:** Eseguire l'intera suite crypto per la convalida finale.
- **Dipende da:** T6, T7 (entrambi completati)
- **Gate chiusura:**
  ```bash
  npx jest __tests__/crypto/
  npx tsc --noEmit
  ```
  Entrambi i comandi devono terminare con exit code 0.

- [ ] `npx jest __tests__/crypto/` exit code 0
- [ ] `npx tsc --noEmit` exit code 0
- [ ] G1, G2, G3 passano
- [ ] R1, E1, E2, E3, A1, S1 passano
- [ ] Test regressione `hashPin`/`verifyPin` passano

---

## 4. Precondizioni di avvio

Verificare prima di iniziare T1. Se anche una sola precondizione non è
soddisfatta: STOP.

| Precondizione | Comando di verifica | Esito atteso |
|---------------|---------------------|--------------|
| DESIGN 001 implementato (Metro avvia, alias `@/` risolve) | `npm start` | avvia senza errori |
| DESIGN 002 implementato (provider bootstrap stabile) | avvio app | nessun crash al mount context |
| N11 attivo — no `"types": ["node"]` in `tsconfig.json` | `grep -E '"types"\s*:\s*\["node"\]' tsconfig.json` | 0 occorrenze |
| `bcryptjs` presente in `dependencies` | `grep "bcryptjs" package.json` | almeno 1 riga |
| `__tests__/crypto/` assente | `ls __tests__/crypto/ 2>/dev/null` | errore file not found |

---

## 5. Note Operative

### NOTA 1 — Branch operativo

Operare sul branch principale (`main`). Non creare branch alternativi o
feature branch per questo PLAN. Ogni commit va su `main` direttamente.

### NOTA 2 — Perimetro stretto

Il perimetro di questo PLAN è limitato a:

- `src/lib/crypto.ts` — solo le funzioni `encryptData` e `decryptData`
- `index.js` — solo il polyfill in prima riga
- `package.json` — solo le due nuove dipendenze
- `__tests__/crypto/` — nuovi file di test

`hashPin` e `verifyPin` sono fuori perimetro assoluto. Qualsiasi modifica
a quelle funzioni viola V1 del PLAN §10 ed è vietata.

### NOTA 3 — Tradeoff accettato

`@noble/ciphers` è pure-JS senza certificazione FIPS. Il tradeoff è
documentato nel DESIGN 005 §4.4 ed è esplicitamente accettato per questa
applicazione (finanza personale, nessun requisito di conformità normativa).
Non sostituire con altre librerie senza una nuova approvazione.

### NOTA 4 — Stato repository all'avvio

Al momento della creazione di questo TODO (2026-05-22):

- `src/lib/crypto.ts` usa ancora `crypto.subtle` (legacy, non funzionante
  su Hermes)
- `__tests__/crypto/` non esiste
- `@noble/ciphers` non è in `package.json`
- `react-native-get-random-values` non è in `package.json`

---

## 6. Log Validazione

| Data | Blocco | Agente | Esito | Note |
|------|--------|--------|-------|------|
| 2026-05-22 | DESIGN 005 + PLAN 005 + TODO 005 | Consiglio AI | APPROVATO | Convalida incrociata golden vectors e vincoli V1–V8 completata. PLAN pronto per implementazione. |

---

## 7. Gate di chiusura

Riproduzione integrale della checklist del PLAN §9.
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
- [ ] `@noble/ciphers` è pure-JS (verificato in T2 Gate F1).
- [ ] `grep -n "crypto\.subtle" src/lib/crypto.ts` = 0 occorrenze.
- [ ] `npx tsc --noEmit` exit code 0.
- [ ] `npx jest __tests__/crypto/` exit code 0.
