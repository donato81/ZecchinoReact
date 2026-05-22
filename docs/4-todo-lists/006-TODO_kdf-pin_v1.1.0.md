---
tipo: todo
titolo: "TODO — Key Derivation Function per PIN privato (DESIGN 006)"
riferimento-design: docs/2-projects/006-DESIGN_kdf-pin_v0.3.0.md
riferimento-plan: docs/3-coding-plans/006-PLAN_kdf-pin_v1.1.0.md
versione: 1.1.0
data-creazione: 2026-05-22
stato: PENDING
agente: —
data-completamento: —
note-stato: >-
  Documento operativo derivato dal PLAN 006 v1.1.0. Tutti i task
  PENDING. Avvio subordinato al completamento di PLAN 005
  (DESIGN 005 implementato e mergiato su main).
---

# TODO 006 — Key Derivation Function per PIN privato

## 1. Stato / Snapshot

| Campo | Valore |
|-------|--------|
| Ultimo Agente Attivo | — |
| Blocco in Carico | — |
| Last Completed Task | — |
| Next Action | Fase 0 — Esecuzione benchmark PBKDF2-SHA256 (script `bench-pbkdf2.ts` su device Windows) |
| Open Threads | — |

---

## 2. Precondizioni di avvio (GATE BLOCCANTE)

Riferimento: PLAN 006 §1 — DESIGN 006 §2.

| Precondizione | Comando di verifica | Esito atteso |
|---------------|---------------------|--------------|
| DESIGN 005 implementato e mergiato su `main` | stato del documento `005-DESIGN_sostituzione-crypto-N4_v0.5.0.md` = `IMPLEMENTED`; verifica `git log --oneline main` | branch PLAN 005 mergiato su `main` |
| `@noble/ciphers` installata (da PLAN 005) | `ls node_modules/@noble/ciphers/` | cartella presente, nessun binding nativo |
| Golden test G1/G2/G3 di PLAN 005 passano | `npx jest __tests__/crypto/golden.test.ts` | exit code 0, tutti e tre i casi PASSED |

> **GATE INVALICABILE**
>
> Questo gate è invalicabile. Se anche una sola condizione non è
> soddisfatta: STOP, non scrivere nessuna riga di codice di PLAN 006.
> La dipendenza è tecnica, non solo documentale: senza `@noble/ciphers`
> e i golden test G1/G2/G3 passanti, la Fase 0 e il vettore K3 non sono
> verificabili.

---

## 3. Stato task

| Task | File target | Azione | Gate | Stato |
|------|-------------|--------|------|-------|
| T1 | `scripts/bench-pbkdf2.ts` (temporaneo) | RUN (benchmark PBKDF2) | Gate F0 | ☐ |
| T2 | `package.json` | PATCH (aggiungi `@noble/hashes`) | Gate F1 | ☐ |
| T3 | `docs/6-sql/P40-add-pin-kdf-salt.sql` | CREATE | Gate F2 | ☐ |
| T4 | `src/lib/supabase/types.ts` | PATCH (`pin_kdf_salt` / `pinKdfSalt`) | Gate F3 | ☐ |
| T5 | `src/lib/supabase/repositories/impostazioni-utente.ts` | PATCH (`updatePinSalt` + `fieldMap`) | Gate F4 | ☐ |
| T6 | `src/lib/crypto.ts` | PATCH (`derivePinKey` + `PBKDF2_ITERATIONS` + payload versionato) | Gate F5 | ☐ |
| T7 | `src/lib/supabase/repositories/impostazioni-utente.ts` | PATCH (`updatePinHashAndSalt` + `updateFields`) | Gate F6 | ☐ |
| T8 | `__tests__/crypto/kdf.test.ts` | CREATE (K1, K2, K3) | Gate F7 | ☐ |
| T9 | [esecuzione suite completa] | RUN | Gate chiusura | ☐ |

---

## 4. Task atomici

### T1 — Benchmark PBKDF2-SHA256 su Hermes (RUN)

- **File:** `scripts/bench-pbkdf2.ts` (temporaneo, **non committare**)
  oppure `__tests__/crypto/benchmark.test.ts` (rimuovere prima del
  commit finale).
- **Azione:** Misurare il tempo mediana di PBKDF2-SHA256 per i valori
  di iterazioni `100000`, `150000`, `200000`, `300000`, `450000`, `600000`
  su device Windows. Eseguire 10 invocazioni per valore con PIN
  rappresentativo (`'1234'`) e salt fisso di 16 byte. Calcolare la
  mediana ms. Selezionare il valore di iterazioni più alto la cui
  mediana rientra nel budget 100–300 ms.
- **Dipende da:** Gate bloccante §2 superato.
- **Gate F0:**
  - Valore di iterazioni scelto ≥ 100.000.
  - Mediana del valore scelto in 100–300 ms.
  - Oppure: criticità aperta documentata (PLAN §2.5).
  - Report Fase 0 citato nel commit message di Fase 0 o allegato al PR.

> **NOTA DIVIETO ASSOLUTO DI COMMIT — FASE 0**
>
> Nessun commit e nessun push di `src/lib/crypto.ts` è ammesso prima
> che la Fase 0 sia completata. Se `PBKDF2_ITERATIONS` contiene ancora
> il placeholder `/* valore da Fase 0 */`, il file non può essere
> committato.
>
> Pre-commit check obbligatorio:
> ```bash
> grep -n "valore da Fase 0" src/lib/crypto.ts
> ```
> Deve restituire 0 occorrenze prima di ogni commit che tocchi
> `src/lib/crypto.ts`. Riferimento: PLAN §2.4.1.

> **NOTA CASO CRITICO — FLOOR NON RAGGIUNGIBILE**
>
> Se nessun valore ≥ 100.000 iterazioni rientra nel budget 100–300 ms
> sul device di riferimento:
> - **NON silenziare** il problema.
> - **NON abbassare il floor** sotto 100.000.
> - Documentare la criticità nel report di Fase 0 come "criticità
>   aperta", segnalando esplicitamente che il tradeoff
>   sicurezza/usabilità richiede istruzione esterna prima di procedere.
> - **STOP** — attendere istruzione dal proponente del piano.
>
> Riferimento: PLAN §2.5 e DESIGN §4 (floor invalicabile) + §7
> (tradeoff). Il floor (V3) prevale sul budget (V7).

- [ ] Script benchmark creato e **non committato**
- [ ] Benchmark eseguito su device Windows (modello, OS, RAM, versione Hermes/RN documentati)
- [ ] Tabella `iterazioni → mediana ms` compilata (6 righe: 100k, 150k, 200k, 300k, 450k, 600k)
- [ ] Valore di iterazioni scelto documentato (≥ 100.000)
- [ ] Mediana del valore scelto in 100–300 ms
      **OPPURE** criticità aperta documentata con istruzione esterna ricevuta
- [ ] Script benchmark rimosso o escluso dal commit
- [ ] Report Fase 0 citato nel commit message o allegato al PR

---

### T2 — `package.json` (PATCH)

- **File:** `package.json`
- **Azione:** Aggiungere `"@noble/hashes": "^1.5.0"` in `dependencies`,
  in ordine alfabetico accanto a `"@noble/ciphers"` già presente da
  PLAN 005.
- **Dipende da:** T1 (Gate F0 superato).
- **Gate F1:**
  ```bash
  npm install
  ls node_modules/@noble/hashes/
  ```
  `npm install` exit code 0. `node_modules/@noble/hashes/` esiste e
  non deve contenere `android/`, `ios/`, `windows/`, `binding.gyp`,
  `*.so`, `*.dylib`, `*.dll`.

> **NOTA VERIFICA PURE-JS**
>
> `@noble/hashes` deve essere libreria JavaScript pura senza binding
> nativi. Se uno degli artefatti elencati è presente nella cartella:
> STOP, produrre report diagnostico. Vincolo derivato da V4 del
> PLAN §11 e dal DESIGN §4.

- [ ] `"@noble/hashes": "^1.5.0"` aggiunto in `dependencies`
- [ ] Ordine alfabetico rispettato (accanto a `@noble/ciphers`)
- [ ] `npm install` exit code 0
- [ ] `node_modules/@noble/hashes/` esiste
- [ ] Nessun binding nativo presente (no `android/`, `ios/`, `windows/`, `binding.gyp`, `*.so`, `*.dylib`, `*.dll`)

---

### T3 — `docs/6-sql/P40-add-pin-kdf-salt.sql` (CREATE)

- **File:** `docs/6-sql/P40-add-pin-kdf-salt.sql`
- **Azione:** Creare la migration SQL reversibile con blocco UP
  (`ADD COLUMN IF NOT EXISTS pin_kdf_salt text`) e blocco DOWN
  (`DROP COLUMN IF EXISTS pin_kdf_salt`). Seguire la convenzione
  di naming `P{NN}-descrizione.sql` già usata in `docs/6-sql/`
  (prossimo slot libero: P40, dopo P25 e P35).
- **Dipende da:** T1 (Gate F0 superato). Parallelizzabile con T2.
- **Gate F2:**
  - Il file `docs/6-sql/P40-add-pin-kdf-salt.sql` esiste.
  - Contiene blocco UP e blocco DOWN distinti e commentati.
  - La colonna `pin_kdf_salt` è di tipo `text` nullable.
  - Il naming `P40-add-pin-kdf-salt.sql` rispetta la convenzione.

> **NOTA INVARIANTE — COMMENTO OBBLIGATORIO NEL BLOCCO UP**
>
> Il commento nel blocco UP deve riportare testualmente:
>
> ```
> -- Invariante: pin_kdf_salt e pin_privato_hash devono essere
> -- entrambi NULL o entrambi non-NULL. La coerenza è applicata
> -- a livello applicativo (vedi Fase 6 — Atomicità impostazione PIN).
> ```

> **NOTA BLOCCO DOWN — AMBIENTI AMMESSI**
>
> Il blocco DOWN è ammesso esclusivamente in:
> - **Sviluppo locale**: sempre ammesso.
> - **Staging/Test**: ammesso se i dati non sono reali.
> - **Produzione**: **NO** — è da considerarsi no-op documentato.
>   Eseguire `DROP COLUMN` in produzione elimina i salt degli utenti
>   reali, rendendo i loro PIN irrecuperabili.
>
> Prima di eseguire il DOWN in qualsiasi ambiente:
> ```bash
> grep -E "^SUPABASE_URL" .env
> ```
> In caso di dubbio: STOP, attendere conferma esplicita.

- [ ] File `docs/6-sql/P40-add-pin-kdf-salt.sql` creato
- [ ] Blocco UP con `ALTER TABLE impostazioni_utente ADD COLUMN IF NOT EXISTS pin_kdf_salt text;`
- [ ] Blocco DOWN con `ALTER TABLE impostazioni_utente DROP COLUMN IF EXISTS pin_kdf_salt;`
- [ ] Commento invariante presente nel blocco UP
- [ ] Nota ambienti ammessi per il blocco DOWN presente
- [ ] Naming `P40-add-pin-kdf-salt.sql` rispettato

---

### T4 — `src/lib/supabase/types.ts` (PATCH)

- **File:** `src/lib/supabase/types.ts`
- **Azione:** Aggiungere `pin_kdf_salt: string | null` in
  `DbUserSettings` dopo `pin_privato_hash`; aggiungere
  `pinKdfSalt: string | null` in `UserSettings` dopo `pinPrivatoHash`.
  Entrambi i campi devono avere il commento JSDoc con l'invariante
  obbligatorio.
- **Dipende da:** T2 (Gate F1 superato).
- **Gate F3:**
  ```bash
  npx tsc --noEmit
  ```
  exit code 0. `pin_kdf_salt` presente in `DbUserSettings` con tipo
  `string | null`. `pinKdfSalt` presente in `UserSettings` con tipo
  `string | null`. Commento JSDoc con invariante presente su entrambi.

> **NOTA JSDoc OBBLIGATORIO**
>
> Il commento sopra ciascun campo è obbligatorio. Deve riportare
> testualmente l'invariante:
>
> ```
> /**
>  * Salt PBKDF2 in Base64 (16 byte).
>  * INVARIANTE: pinKdfSalt e pinPrivatoHash devono essere
>  * entrambi null o entrambi non-null. Vedi Plan 006 §8 (atomicità).
>  */
> ```
>
> (variante snake_case in `DbUserSettings`: `pin_kdf_salt` e
> `pin_privato_hash`). Omettere il commento viola il contratto
> documentale del PLAN §5.3.

- [ ] `pin_kdf_salt: string | null` aggiunto in `DbUserSettings`
- [ ] `pinKdfSalt: string | null` aggiunto in `UserSettings`
- [ ] Posizione corretta: dopo `pin_privato_hash` / `pinPrivatoHash`
- [ ] Commento JSDoc con invariante presente in `DbUserSettings`
- [ ] Commento JSDoc con invariante presente in `UserSettings`
- [ ] `npx tsc --noEmit` exit code 0

---

### T5 — `impostazioni-utente.ts`: `updatePinSalt` + `fieldMap` (PATCH)

- **File:** `src/lib/supabase/repositories/impostazioni-utente.ts`
- **Azione:** Aggiungere `pinKdfSalt: 'pin_kdf_salt'` in `fieldMap`.
  Aggiungere la funzione esportata `updatePinSalt(salt: string | null):
  Promise<void>` che delega a `updateField('pinKdfSalt', salt)`,
  identica nello stile a `updatePinHash`.
- **Dipende da:** T4 (Gate F3 superato).
- **Gate F4:**
  ```bash
  npx tsc --noEmit
  ```
  exit code 0. `updatePinSalt` è esportata. `fieldMap` contiene
  `pinKdfSalt: 'pin_kdf_salt'`. Firma:
  `(salt: string | null): Promise<void>`. Implementazione delega a
  `updateField('pinKdfSalt', salt)`.

> **NOTA VINCOLO CONSUMATORI (anticipata da T7)**
>
> `updatePinSalt` resta esportata ma il suo uso diretto per impostare
> il PIN è **vietato**. Il chiamante (UI impostazione PIN) deve usare
> esclusivamente `updatePinHashAndSalt` (T7). Aggiungere questo
> vincolo come commento JSDoc su `updatePinSalt` (e su `updatePinHash`
> esistente). Riferimento: PLAN §8.3.

- [ ] `pinKdfSalt: 'pin_kdf_salt'` aggiunto in `fieldMap`
- [ ] `updatePinSalt(salt: string | null): Promise<void>` creata
- [ ] Funzione esportata
- [ ] Implementazione delega a `updateField('pinKdfSalt', salt)`
- [ ] Commento JSDoc con invariante presente sulla funzione
- [ ] Commento vincolo "uso diretto vietato per impostare PIN" presente
- [ ] `npx tsc --noEmit` exit code 0

---

### T6 — `src/lib/crypto.ts` (PATCH — KDF e payload versionato)

- **File:** `src/lib/crypto.ts`
- **Azione:**
  - Aggiungere `import { pbkdf2 } from '@noble/hashes/pbkdf2';`
  - Aggiungere `import { sha256 } from '@noble/hashes/sha256';`
  - Dichiarare `PBKDF2_ITERATIONS` come costante fissa (valore da T1, ≥ 100.000).
  - Implementare `derivePinKey(pin: string, salt: Uint8Array): Uint8Array`
    che invoca `pbkdf2(sha256, pinBytes, salt, { c: PBKDF2_ITERATIONS, dkLen: 32 })`.
  - Dichiarare `KDF_VERSION = 0x01`, `SALT_LEN = 16`, `IV_LEN = 12`, `TAG_LEN = 16`.
  - Implementare il formato payload versionato
    `[KDF_VERSION(1) | SALT(16) | IV(12) | CT(N) | TAG(16)]` (totale 45+N byte).
  - Estendere `encryptData`/`decryptData` per il formato PIN versionato
    (Strategia B del PLAN §7.4) **oppure** aggiungere funzioni dedicate
    `encryptDataPin`/`decryptDataPin` (Strategia A). Documentare la
    scelta nel commit message.
  - Garantire retrocompatibilità: payload DESIGN 005 invariati e
    decifrabili dopo la modifica.
- **Dipende da:** T2 (Gate F1) **e** T1 completato (PBKDF2_ITERATIONS noto).
- **Gate F5:**
  ```bash
  grep -n "crypto\.subtle" src/lib/crypto.ts
  grep -nE "Math\.random|Date\.now" src/lib/crypto.ts
  grep -n "valore da Fase 0" src/lib/crypto.ts
  npx tsc --noEmit
  npx jest __tests__/crypto/golden.test.ts
  ```
  - `grep crypto.subtle` = 0 occorrenze.
  - `grep Math.random|Date.now` = 0 occorrenze.
  - `grep "valore da Fase 0"` = 0 occorrenze.
  - `npx tsc --noEmit` exit code 0.
  - `npx jest __tests__/crypto/golden.test.ts` exit code 0
    (G1, G2, G3 ancora passano).

> **NOTA KDF_VERSION — SERIALIZZAZIONE UInt8 OBBLIGATORIA**
>
> `KDF_VERSION = 0x01` deve essere serializzato come singolo byte
> `UInt8` (1 byte esatto, valore 0–255). Scrivere con:
>
> ```ts
> buffer[0] = KDF_VERSION; // UInt8, 1 byte esatto
> ```
>
> oppure tramite `DataView.setUint8(0, KDF_VERSION)`.
>
> **NON usare** `Int8`, `Int16`, `Uint16` o tipi multi-byte. Ogni
> variazione produce offset errati in `SALT`, `IV`, `CT`, `TAG`,
> causando decifratura silenziosa fallita. Riferimento: PLAN §7.3.

> **NOTA REGRESSIONE OBBLIGATORIA — G1/G2/G3**
>
> Dopo ogni modifica a `crypto.ts`, eseguire immediatamente:
> ```bash
> npx jest __tests__/crypto/golden.test.ts
> ```
> Se G1, G2 o G3 fallisce: **STOP**. Produrre report con:
> - Valore Base64 prodotto vs atteso.
> - Delta byte-per-byte.
> - Lunghezza buffer prodotto vs attesa.
>
> Nessun'altra modifica prima della risoluzione.
> Riferimento: PLAN §7.5 (regressione).

> **NOTA STRATEGIA A/B — DOCUMENTAZIONE NEL COMMIT**
>
> La scelta tra Strategia A (funzioni dedicate `encryptDataPin` /
> `decryptDataPin`) e Strategia B (parametro opzionale su
> `encryptData` / `decryptData`) deve essere documentata nel commit
> message con motivazione esplicita. In entrambi i casi: il
> comportamento di `encryptData` e `decryptData` per payload non-PIN
> deve restare invariato. Riferimento: PLAN §7.4.

- [ ] `import { pbkdf2 } from '@noble/hashes/pbkdf2'` aggiunto
- [ ] `import { sha256 } from '@noble/hashes/sha256'` aggiunto
- [ ] `PBKDF2_ITERATIONS` dichiarato come costante ≥ 100.000
- [ ] `PBKDF2_ITERATIONS` = valore da T1 (non placeholder `/* valore da Fase 0 */`)
- [ ] `derivePinKey(pin: string, salt: Uint8Array): Uint8Array` implementata
- [ ] `KDF_VERSION = 0x01` dichiarato (UInt8, 1 byte)
- [ ] `SALT_LEN = 16`, `IV_LEN = 12`, `TAG_LEN = 16` dichiarati
- [ ] Strategia A o B implementata e documentata nel commit
- [ ] Retrocompatibilità payload DESIGN 005 preservata
- [ ] `grep -n "crypto\.subtle" src/lib/crypto.ts` = 0 occorrenze
- [ ] `grep -nE "Math\.random|Date\.now" src/lib/crypto.ts` = 0 occorrenze
- [ ] `grep -n "valore da Fase 0" src/lib/crypto.ts` = 0 occorrenze
- [ ] `npx tsc --noEmit` exit code 0
- [ ] `npx jest __tests__/crypto/golden.test.ts` exit code 0 (G1, G2, G3)

---

### T7 — `impostazioni-utente.ts`: `updatePinHashAndSalt` + `updateFields` (PATCH)

- **File:** `src/lib/supabase/repositories/impostazioni-utente.ts`
- **Azione:** Implementare la funzione privata `updateFields` (multi-campo)
  che costruisce un singolo UPDATE Supabase multi-colonna. Implementare
  ed esportare `updatePinHashAndSalt(hash: string | null, salt: string | null):
  Promise<void>` che include il check pre-condizione
  (`(hash === null) !== (salt === null)` → `throw Error`).
- **Dipende da:** T5 (Gate F4 superato) **e** T6 (Gate F5 superato).
- **Gate F6:**
  ```bash
  npx tsc --noEmit
  ```
  exit code 0. `updatePinHashAndSalt` è esportata. Check pre-condizione
  con `throw` esplicito presente. `updateFields` è implementata con
  contratto errore.

> **NOTA CONTRATTO ERRORE `updateFields` — OBBLIGATORIO**
>
> `updateFields` **DEVE** controllare `response.error` da Supabase.
> Se `response.error` è non-null: **DEVE** rilanciare un'eccezione
> esplicita con il messaggio dell'errore Supabase:
>
> ```ts
> if (response.error) {
>   throw new Error(
>     `updateFields: aggiornamento fallito — ${response.error.message}`
>   );
> }
> ```
>
> - **NON** è ammesso swallow silenzioso dell'errore.
> - **NON** è ammesso fallback implicito (continuare come se l'update
>   fosse avvenuto).
>
> La violazione di questo contratto rompe l'invariante architetturale
> di atomicità dichiarato dal PLAN §8.2.1.

> **NOTA VINCOLO CONSUMATORI**
>
> Il chiamante (UI impostazione PIN) deve usare **ESCLUSIVAMENTE**
> `updatePinHashAndSalt`. Le funzioni `updatePinHash` e `updatePinSalt`
> restano esportate per debug/diagnostica ma il loro uso diretto per
> impostare il PIN è **vietato** per non rompere l'invariante.
> Aggiungere questo vincolo come commento JSDoc su `updatePinHash`
> e `updatePinSalt`. Riferimento: PLAN §8.3.

- [ ] `updateFields(fields: Partial<...>): Promise<void>` implementata
- [ ] `updateFields` controlla `response.error` e rilancia eccezione esplicita
- [ ] `updateFields` non fa swallow silenzioso né fallback implicito
- [ ] `updatePinHashAndSalt(hash, salt): Promise<void>` esportata
- [ ] Check pre-condizione `(hash === null) !== (salt === null)` → `throw` presente
- [ ] Commento JSDoc su `updatePinHashAndSalt` con invariante
- [ ] Commento vincolo "uso diretto vietato" su `updatePinHash` e `updatePinSalt`
- [ ] `npx tsc --noEmit` exit code 0

---

### T8 — `__tests__/crypto/kdf.test.ts` (CREATE)

- **File:** `__tests__/crypto/kdf.test.ts`
- **Azione:** Creare la suite con i golden vectors K1, K2, K3. I valori
  numerici (hex chiavi, Base64 payload) devono essere calcolati offline
  **prima** di scrivere qualsiasi riga di test (sequenza obbligatoria
  sotto). I fixture di input (PIN, salt hex, IV hex, plaintext) sono già
  fissati nel PLAN §9.3–9.5; i valori di output attesi vanno calcolati.
- **Dipende da:** T6 (Gate F5 superato), T7 (Gate F6 superato).
- **Gate F7:**
  ```bash
  npx jest __tests__/crypto/kdf.test.ts
  npx tsc --noEmit
  ```
  Entrambi exit code 0. K1, K2, K3 passano.

#### Fixture di input (fissati nel PLAN)

| Vettore | PIN | Salt (hex, 16 byte) | IV (hex, 12 byte) | Plaintext |
|---------|-----|---------------------|-------------------|-----------|
| **K1**  | `'1234'` | `00112233445566778899aabbccddeeff` | — | — |
| **K2**  | `'1234'` | A: `00112233445566778899aabbccddeeff` ⟶ chiave K1 | — | — |
| **K2**  | `'1234'` | B: `ffeeddccbbaa99887766554433221100` | — | — |
| **K3**  | `'9876'` | `0102030405060708090a0b0c0d0e0f10` | `aabbccddeeff112233445566` | `'segreto privato'` |

Valori attesi (output): **da calcolare offline e hardcodare** secondo
la sequenza sotto.

> **NOTA SEQUENZA CALCOLO VETTORI — OBBLIGATORIA (6 passi)**
>
> I valori dei vettori K devono essere calcolati **PRIMA** di scrivere
> i test, seguendo questa sequenza:
>
> 1. Attendere che `@noble/hashes` sia installata (T2) e
>    `derivePinKey` sia implementata (T6).
> 2. Eseguire `derivePinKey` in un **REPL Node.js isolato** (non in
>    Jest, non nell'app), oppure tramite lo script dedicato
>    `docs/scripts/generate-golden-vectors.js` se disponibile.
> 3. Per K1: derivare la chiave con `PIN='1234'` e salt hex
>    `00112233445566778899aabbccddeeff`. Annotare output hex 32 byte.
> 4. Per K2: derivare con stesso PIN e salt alternativo
>    `ffeeddccbbaa99887766554433221100`. Verificare che il risultato
>    sia **DIVERSO** da K1.
> 5. Per K3: derivare chiave con `PIN='9876'` e salt
>    `0102030405060708090a0b0c0d0e0f10`, cifrare `'segreto privato'`
>    con IV fisso `aabbccddeeff112233445566`, costruire il buffer
>    `[KDF_VERSION | SALT | IV | CT | TAG]`, codificare in Base64.
>    Annotare il payload Base64 completo.
> 6. Eseguire ciascuna derivazione **DUE VOLTE** in modo indipendente
>    e confrontare i risultati per escludere errori di trascrizione.
> 7. Hardcodare i valori verificati come **costanti** nel file di
>    test. **MAI** calcolare i valori in `beforeAll` o hook di test.
>
> Riferimento: PLAN §9.2.

> **NOTA K1 — IDEMPOTENZA**
>
> Due invocazioni identiche di `derivePinKey` con la stessa coppia
> `(PIN, salt)` devono restituire output identico **bit per bit**.
> Il test deve verificare:
> 1. che i due output siano identici tra loro (confronto bit-per-bit);
> 2. che entrambi corrispondano al valore **hardcoded** atteso.
>
> Questo verifica che PBKDF2-SHA256 sia deterministico e che l'encoding
> del PIN non introduca variabilità accidentale.

> **NOTA K2 — ISOLAMENTO DEL SALT**
>
> Stesso PIN, due salt diversi devono produrre due chiavi diverse.
> Se K1 e K2 producono la stessa chiave: il salt **non è incorporato**
> nella derivazione → la sicurezza è compromessa in modo strutturale.
> Non si tratta di un semplice fallimento del test, ma di una violazione
> diretta del DESIGN §5.

> **NOTA K3 — PIPELINE COMPLETA + POSIZIONI BUFFER**
>
> K3 verifica il round-trip end-to-end: KDF + AES-GCM + costruzione
> payload versionato + parsing + decifratura. Se K3 fallisce ma K1 e
> K2 passano, il problema è nel formato payload o nel parsing, non
> nella KDF.
>
> **Posizioni esatte dei campi nel buffer decodificato** (0-indexed):
>
> | Campo | Posizione byte | Lunghezza |
> |-------|----------------|-----------|
> | `KDF_VERSION` (= `0x01`) | byte 0 | 1 byte |
> | `SALT` | byte 1–16 | 16 byte |
> | `IV` | byte 17–28 | 12 byte |
> | `Ciphertext + AuthTag` | byte 29+ | N + 16 byte |
>
> Lunghezza totale: `1 + 16 + 12 + N + 16 = 45 + N` byte.
> Il payload K3 deve includere il byte `KDF_VERSION = 0x01` come
> **primo byte** del buffer (prima del SALT).
> Riferimento: PLAN §7.3, DESIGN §6 e §10.

- [ ] Valori K1 calcolati offline e verificati (2 esecuzioni indipendenti)
- [ ] Valori K2 (chiave B) calcolati offline e verificati
- [ ] Valori K3 calcolati offline e verificati (payload Base64 completo)
- [ ] Costanti hardcoded nel file, **non** calcolate in `beforeAll`
- [ ] Test K1: idempotenza (due invocazioni identiche tra loro **e** entrambe = valore hardcoded)
- [ ] Test K2: isolamento (chiave A ≠ chiave B con salt diversi)
- [ ] Test K3: round-trip (`'segreto privato'` recuperato + posizioni buffer verificate)
- [ ] `npx tsc --noEmit` exit code 0 sul file
- [ ] `npx jest __tests__/crypto/kdf.test.ts` exit code 0

---

### T9 — Esecuzione suite completa (RUN)

- **File:** `__tests__/crypto/` (intera directory)
- **Azione:** Eseguire l'intera suite crypto per la convalida finale,
  comprendendo sia i nuovi test KDF (K1/K2/K3) sia la **regressione**
  della suite di PLAN 005 (G1/G2/G3 + R1/E1/E2/E3/A1/S1 + test PIN).
- **Dipende da:** T8 completato.
- **Gate chiusura:**
  ```bash
  npx jest __tests__/crypto/
  npx tsc --noEmit
  ```
  Entrambi exit code 0.

- [ ] `npx jest __tests__/crypto/` exit code 0
- [ ] `npx tsc --noEmit` exit code 0
- [ ] K1, K2, K3 passano
- [ ] G1, G2, G3 **ancora** passano (regressione PLAN 005)
- [ ] R1, E1, E2, E3, A1, S1 **ancora** passano (regressione PLAN 005)
- [ ] Test regressione `hashPin`/`verifyPin` **ancora** passano (PLAN 005)

---

## 5. Note Operative

### NOTA 1 — Branch operativo

Operare esclusivamente sul branch principale (`main`). Non creare branch
alternativi o feature branch. Ogni commit va su `main` direttamente.

### NOTA 2 — Perimetro stretto

Il perimetro di questo PLAN è limitato a:

- `src/lib/crypto.ts`
- `src/lib/supabase/types.ts`
- `src/lib/supabase/repositories/impostazioni-utente.ts`
- `docs/6-sql/P40-add-pin-kdf-salt.sql`
- `__tests__/crypto/kdf.test.ts`

`hashPin` e `verifyPin` sono **fuori perimetro assoluto**. Qualsiasi
modifica a quelle funzioni viola V1 del PLAN §11 (riferimento incrociato
a DESIGN 005 §9 prima regola).

### NOTA 3 — Dipendenza bloccante da PLAN 005

PLAN 006 **NON può iniziare** se PLAN 005 non è completato e mergiato
su `main`. La dipendenza è tecnica, non solo documentale: senza
`@noble/ciphers` e i golden test G1/G2/G3 passanti, la Fase 0 e il
vettore K3 non sono verificabili. Riferimento: PLAN §1 — DESIGN §2.

### NOTA 4 — Stato repository all'avvio

Al momento della creazione di questo TODO (2026-05-22):

- PLAN 005 **non ancora completato** (precondizione bloccante attiva)
- `@noble/hashes` **non** è in `package.json`
- `pin_kdf_salt` **non esiste** in `impostazioni_utente` su Supabase
- `__tests__/crypto/kdf.test.ts` **non esiste**
- `src/lib/crypto.ts` **non ha** `derivePinKey` né `PBKDF2_ITERATIONS`

### NOTA 5 — Tradeoff accettato

`@noble/hashes` è pure-JS senza certificazione FIPS, come
`@noble/ciphers` già accettato in PLAN 005. PBKDF2 è scelto su scrypt
(rischio freeze memory su device low-end) e su Argon2 (nessuna
implementazione pure-JS compatibile Hermes). Il tradeoff è documentato
nel DESIGN 006 §4 (alternative scartate).

### NOTA 6 — Divieto entropia debole (V8 + divieto esplicito §11)

Pre-commit check obbligatorio prima di ogni commit che tocchi
`src/lib/crypto.ts`:

```bash
grep -nE "Math\.random|Date\.now" src/lib/crypto.ts
```

Deve restituire 0 occorrenze. Usare esclusivamente
`crypto.getRandomValues()` (CSPRNG di sistema via polyfill
`react-native-get-random-values` introdotto da PLAN 005).
Riferimento: PLAN §11 — DESIGN §5.

---

## 6. Log Validazione

| Data | Blocco | Agente | Esito | Note |
|------|--------|--------|-------|------|
| 2026-05-22 | DESIGN 006 v0.3.0 + PLAN 006 v1.1.0 + TODO 006 | Consiglio AI | APPROVATO | Convalida incrociata vincoli V1–V8, formato payload `[KDF_VERSION|SALT|IV|CT|TAG]` = 45+N byte, invariante atomicità (Strategia C) e precondizioni completata. PLAN pronto per implementazione a valle di PLAN 005. |

---

## 7. Gate di chiusura

Riproduzione integrale dei 12 punti del PLAN §10. Prima di dichiarare
Plan 006 completato, verificare che **tutti** i seguenti punti siano
soddisfatti:

- [ ] K1, K2, K3 passano (`npx jest __tests__/crypto/kdf.test.ts`).
- [ ] Floor 100.000 iterazioni rispettato (`PBKDF2_ITERATIONS >= 100000`).
- [ ] Formato versionato del payload corretto:
      `[KDF_VERSION | SALT | IV | CT | TAG]`, `KDF_VERSION = 0x01`.
- [ ] `updatePinSalt` esiste in `impostazioni-utente.ts`.
- [ ] `updatePinHashAndSalt` esiste e contiene il check
      "entrambi null o entrambi non-null".
- [ ] Invariante `pinKdfSalt`/`pinPrivatoHash` documentato in JSDoc su
      entrambi i campi in `types.ts`.
- [ ] Strategia di atomicità implementata (Strategia C — update unico
      multi-campo tramite `updateFields`).
- [ ] Migration SQL `docs/6-sql/P40-add-pin-kdf-salt.sql` esiste, con
      blocco UP e blocco DOWN reversibile.
- [ ] **Regressione PLAN 005**: G1, G2, G3 ancora passano
      (`npx jest __tests__/crypto/golden.test.ts` exit code 0).
- [ ] `npx tsc --noEmit` exit code 0.
- [ ] `npx jest __tests__/crypto/` exit code 0.
- [ ] Report Fase 0 (device, tabella iterazioni→ms, valore scelto)
      allegato al PR o citato nel commit message di Fase 0.
