---
tipo: plan
titolo: Key Derivation Function per PIN privato
versione: 1.1.0
data: 2026-05-22
data-revisione: 2026-05-24
stato: UPDATED
design: docs/2-projects/006-DESIGN_kdf-pin_v0.4.0.md
perimetro: >
  src/lib/crypto.ts,
  src/lib/supabase/types.ts,
  src/lib/supabase/repositories/impostazioni-utente.ts,
  docs/6-sql/,
  __tests__/crypto/
---

# PLAN 006 — Key Derivation Function per PIN privato

> **Fonte di verità**: ogni decisione tecnica di questo piano è derivata
> da
> [docs/2-projects/006-DESIGN_kdf-pin_v0.4.0.md](../2-projects/006-DESIGN_kdf-pin_v0.4.0.md).
> In caso di discrepanza, il documento di design prevale.

---

## 1. Precondizioni di avvio (GATE BLOCCANTE)

Questo gate è **invalicabile**. Se anche una sola condizione non è
soddisfatta: STOP, non scrivere nessuna riga di codice di Plan 006.

- **DESIGN 005 implementato e mergiato**: stato del documento
  `005-DESIGN_sostituzione-crypto-N4_v0.5.0.md` = IMPLEMENTED. Il branch
  che ha implementato DESIGN 005 deve essere mergiato su `main`.
- **`@noble/ciphers` installata**: verificare con:
  ```bash
  ls node_modules/@noble/ciphers/
  ```
  La cartella deve esistere e non contenere binding nativi.
- **Golden test G1, G2, G3 di Plan 005 passano**:
  ```bash
  npx jest __tests__/crypto/golden.test.ts
  ```
  exit code 0; tutti e tre i casi PASSED.

Riferimento: DESIGN 006 §2.

---

## 2. Fase 0 — Benchmark PBKDF2-SHA256 con `react-native-quick-crypto` (COMPLETATA)

Questa fase è prerequisito a tutto il resto del Plan. Risulta **COMPLETATA**
su Windows con backend nativo OpenSSL. Vedi §2.4 per i risultati definitivi.
Il valore di `PBKDF2_ITERATIONS` è fissato a **600.000** (target operativo
corrente). Le altre fasi possono procedere.

### 2.1 Obiettivo

Misurare il tempo di esecuzione di PBKDF2-SHA256 con
`react-native-quick-crypto` (backend OpenSSL nativo) sul device di
riferimento per individuare il numero di iterazioni che soddisfi il
floor invalicabile di **100.000 iterazioni** (OWASP) con margine di
sicurezza adeguato. Riferimento: DESIGN 006 §4 e §12.

> Nota DESIGN 006 v0.4.0 §7: con backend crittografici nativi (OpenSSL),
> il parametro di sicurezza determinante è il numero di iterazioni e il
> costo computazionale reale, non il tempo assoluto. Tempi inferiori al
> range 100–300 ms originario sono accettabili se ottenuti aumentando
> significativamente il numero di iterazioni rispetto al floor OWASP.

### 2.2 Device di riferimento

Target di calibrazione primario: **Windows** (piattaforma primaria della
v1.0 di ZecchinoReact). Riferimento: DESIGN 006 §7.

Target secondario di verifica: Android low-end (se disponibile). Il
valore scelto su Windows si applica a tutti i target; se su Android
risultasse fuori budget, documentare il tradeoff come criticità aperta
in questo Plan, senza abbassare il floor.

### 2.3 Procedura

1. Creare uno script di benchmark isolato (es. `scripts/bench-pbkdf2.ts`
   o, in alternativa, un file di test temporaneo dedicato sotto
   `__tests__/crypto/benchmark.test.ts` da rimuovere prima del commit
   finale).
2. Importare l'API PBKDF2 da `react-native-quick-crypto` (Web Crypto
   compatibile via binding OpenSSL nativi).
3. Eseguire la derivazione su un PIN rappresentativo (`'1234'`) con un
   salt fisso di 16 byte, per ciascuno dei seguenti valori di iterazioni:
   `100000`, `150000`, `200000`, `300000`, `450000`, `600000`.
4. Per ogni valore, eseguire 10 invocazioni e calcolare la mediana del
   tempo (ms).
5. Selezionare il valore di iterazioni più alto che rientra entro un
   tempo accettabile per l'esperienza utente, dato il floor invalicabile
   di 100.000.

### 2.4 Esito e documentazione

**Esito Fase 0 (registrato il 2026-05-24)**:

- **Device**: Windows (piattaforma primaria v1.0 di ZecchinoReact).
- **Backend**: `react-native-quick-crypto` (OpenSSL nativo).
- **Tabella `iterazioni → mediana ms`** (riferimento DESIGN 006 §4 e §7):

  | Iterazioni | Mediana misurata |
  |-----------:|-----------------:|
  | 600.000    | 86 ms            |

  Il benchmark condotto con backend nativo OpenSSL ha confermato che
  600.000 iterazioni completano in 86 ms mediana su Windows: sei volte
  il floor OWASP entro un costo computazionale trascurabile per l'utente.
  La validazione multipiattaforma (Android, iOS) è delegata al Coding
  Plan 006 prima del rilascio sulle piattaforme secondarie.

- **Valore scelto**: **`PBKDF2_ITERATIONS = 600_000`** (target operativo
  corrente, ≥ floor OWASP 100.000).
- Il valore è fissato come **costante immutabile** del modulo
  `src/lib/crypto.ts` (`PBKDF2_ITERATIONS = 600_000`) e usato in tutte
  le derivazioni e in tutti i test K1, K2, K3.

Riferimento documentale: DESIGN 006 v0.4.0 §4 (Parametri PBKDF2), §7
(Budget prestazionale — Nota sull'interpretazione del budget temporale)
e §15 (Fasi di implementazione).

### 2.4.1 Divieto di commit prima del completamento della Fase 0

**DIVIETO ASSOLUTO**: nessun commit e nessun push di
`src/lib/crypto.ts` è ammesso prima che la Fase 0 sia
completata secondo il gate §2.6.

Questo divieto è bloccante. Se il valore di `PBKDF2_ITERATIONS`
è ancora un placeholder (`/* valore da Fase 0 */`), il file
non può essere committato.

Pre-commit check obbligatorio prima di ogni commit che tocchi
`src/lib/crypto.ts`:

```bash
grep -n "valore da Fase 0" src/lib/crypto.ts
```

Il comando deve restituire 0 occorrenze prima che il commit
sia eseguito. Se restituisce 1 o più: STOP, completare prima
il benchmark di Fase 0.

### 2.5 Gestione del caso critico

Se nessun valore ≥ 100.000 iterazioni rientra nel budget 100–300 ms sul
device di riferimento:

- **NON silenziare** il problema.
- **NON abbassare il floor** sotto 100.000.
- **Documentare** la criticità nel report di Fase 0 come "criticità
  aperta", segnalando esplicitamente che il tradeoff sicurezza/usabilità
  richiede istruzione esterna prima di procedere.
- **STOP** la Fase 0. Attendere istruzione dal proponente del piano.

Riferimento: DESIGN 006 §4 (floor invalicabile) e §7 (tradeoff).

### 2.6 Gate Fase 0

**Prima di procedere alla Fase 1, verificare che**:

- Il valore di iterazioni è stato scelto e documentato.
- Il valore scelto è ≥ 100.000.
- La mediana misurata sul device di riferimento rientra in 100–300 ms,
  oppure è stata aperta la criticità di §2.5 e l'istruzione esterna è
  arrivata.
- Il valore scelto è citato nel commit message della Fase 0 o nel report
  allegato al PR.

---

## 3. Fase 1 — Dipendenza `react-native-quick-crypto`

### 3.1 File toccati

`package.json`.

### 3.2 Modifica

Aggiungere in `dependencies` la dipendenza `react-native-quick-crypto`
con **versione esatta pinnata** (non range), come prescritto dalla
Dependency Governance di DESIGN 006 §14:

```diff
   "dependencies": {
     "@noble/ciphers": "^1.0.0",
+    "react-native-quick-crypto": "<versione fissata dal Coding Plan>",
```

Il valore esatto della versione è fissato dal Coding Plan 006 in fase
implementativa, dopo audit di sicurezza (DESIGN 006 §14). Il pinning
esplicito (non `^` né `~`) è obbligatorio per evitare upgrade impliciti
della dipendenza crittografica critica.

### 3.3 Verifica dipendenza nativa consolidata

```bash
ls node_modules/react-native-quick-crypto/
```

La libreria utilizza binding nativi OpenSSL della piattaforma ospite
(Android, iOS, Windows). La presenza di artefatti nativi è **attesa e
consentita** dal vincolo aggiornato (DESIGN 006 §4 — Nota sul vincolo
pure-JavaScript): è vietato solo codice nativo custom scritto o
mantenuto internamente al progetto; sono consentite librerie esterne
consolidate con binding nativi per operazioni crittografiche
standardizzate.

L'audit di sicurezza pre-aggiornamento prescritto da DESIGN 006 §14
deve essere eseguito prima di ogni upgrade della versione pinnata.

### 3.4 Gate Fase 1

**Prima di procedere alla Fase 2, verificare che**:

- `npm install` termina con exit code 0.
- `node_modules/react-native-quick-crypto/` esiste con i binding
  nativi attesi per la piattaforma corrente.
- La versione installata corrisponde esattamente al valore pinnato in
  `package.json` (no range).

---

## 4. Fase 2 — Migration SQL

### 4.1 File da creare

Convenzione naming in `docs/6-sql/`: prefisso `P{NN}-descrizione.sql`
(file esistenti: `P25-...`, `P35-...`). Prossimo slot libero: **P40**.

File: `docs/6-sql/P40-add-pin-kdf-salt.sql`.

### 4.2 Contenuto

Migration **reversibile** in due blocchi UP e DOWN, sullo stile dei file
esistenti in `docs/6-sql/`.

**Blocco UP**:

```sql
-- P40 — Aggiungi colonna pin_kdf_salt a impostazioni_utente
-- Branch: refactoring-architettura
-- Data: 2026-05-22
-- Riferimento: docs/2-projects/006-DESIGN_kdf-pin_v0.4.0.md §5 e §9
--
-- ISTRUZIONI DI ESECUZIONE:
-- 1. Verificare che la tabella impostazioni_utente esista (P25).
-- 2. Verificare che la colonna pin_kdf_salt NON esista già.
-- 3. Eseguire il blocco UP.

-- ============================================================
-- BLOCCO UP — Aggiunta colonna
-- ============================================================

ALTER TABLE impostazioni_utente
  ADD COLUMN IF NOT EXISTS pin_kdf_salt text;

-- Invariante: pin_kdf_salt e pin_privato_hash devono essere
-- entrambi NULL o entrambi non-NULL. La coerenza è applicata
-- a livello applicativo (vedi Fase 6 — Atomicità impostazione PIN).
```

**Blocco DOWN** (reversibilità):

```sql
-- ============================================================
-- BLOCCO DOWN — Rimozione colonna (rollback)
-- ============================================================

ALTER TABLE impostazioni_utente
  DROP COLUMN IF EXISTS pin_kdf_salt;
```

**Scope della migration DOWN**:

Il blocco DOWN è ammesso esclusivamente nei seguenti ambienti:

- **Sviluppo locale**: sempre ammesso.
- **Staging / Test**: ammesso se i dati non sono reali.
- **Produzione**: il blocco DOWN è da considerarsi
  **no-op documentato**. Eseguire il blocco DOWN in
  produzione elimina i salt già salvati per gli utenti
  reali, rendendo i loro PIN irrecuperabili.

Prima di eseguire il blocco DOWN in qualsiasi ambiente,
verificare che l'ambiente sia corretto con:

```bash
# Verifica ambiente dal .env attivo
grep -E "^SUPABASE_URL" .env
```

In caso di dubbio: STOP, attendere conferma esplicita
prima di procedere con il rollback.

### 4.3 Gate Fase 2

**Prima di procedere alla Fase 3, verificare che**:

- Il file `docs/6-sql/P40-add-pin-kdf-salt.sql` esiste.
- Contiene blocco UP e blocco DOWN distinti e commentati.
- Il naming rispetta la convenzione `P{NN}-descrizione.sql`.
- La colonna `pin_kdf_salt` è di tipo `text` nullable.

---

## 5. Fase 3 — Aggiornamento tipi TypeScript

### 5.1 File toccati

`src/lib/supabase/types.ts`.

### 5.2 Modifiche

**`DbUserSettings`** (interfaccia snake_case): aggiungere `pin_kdf_salt`
dopo `pin_privato_hash`.

```ts
export interface DbUserSettings {
  // ...campi precedenti...
  pin_privato_hash: string | null;
  /**
   * Salt PBKDF2 in Base64 (16 byte).
   * INVARIANTE: pin_kdf_salt e pin_privato_hash devono essere
   * entrambi null o entrambi non-null. Vedi Plan 006 §8 (atomicità).
   */
  pin_kdf_salt: string | null;
  // ...campi successivi...
}
```

**`UserSettings`** (interfaccia camelCase): aggiungere `pinKdfSalt`
dopo `pinPrivatoHash`.

```ts
export interface UserSettings {
  // ...campi precedenti...
  pinPrivatoHash: string | null;
  /**
   * Salt PBKDF2 in Base64 (16 byte).
   * INVARIANTE: pinKdfSalt e pinPrivatoHash devono essere
   * entrambi null o entrambi non-null. Vedi Plan 006 §8 (atomicità).
   */
  pinKdfSalt: string | null;
  // ...campi successivi...
}
```

### 5.3 Invariante (documentata in codice)

Il commento JSDoc sopra ciascun campo è **obbligatorio** e deve riportare
testualmente l'invariante: entrambi null o entrambi non-null.

### 5.4 Gate Fase 3

**Prima di procedere alla Fase 4, verificare che**:

- `pin_kdf_salt` è presente in `DbUserSettings` con tipo
  `string | null`.
- `pinKdfSalt` è presente in `UserSettings` con tipo `string | null`.
- Il commento JSDoc con l'invariante è presente su entrambi i campi.
- `npx tsc --noEmit` exit code 0.

---

## 6. Fase 4 — Funzione `updatePinSalt`

### 6.1 File toccati

`src/lib/supabase/repositories/impostazioni-utente.ts`.

### 6.2 Modifiche

**Estensione `fieldMap`**: aggiungere la mappatura camelCase → snake_case.

```ts
const fieldMap = {
  // ...mappature precedenti...
  pinPrivatoHash: 'pin_privato_hash',
  pinKdfSalt: 'pin_kdf_salt',
  // ...mappature successive...
} as const;
```

**Nuova funzione esportata**: identica nello stile a `updatePinHash`.

```ts
/**
 * Aggiorna il salt PBKDF2 del PIN privato.
 *
 * INVARIANTE: pinKdfSalt e pinPrivatoHash devono essere mantenuti
 * coerenti (entrambi null o entrambi non-null). L'atomicità tra
 * updatePinHash e updatePinSalt è gestita dal chiamante secondo
 * la strategia documentata in Plan 006 §8.
 *
 * @param salt Salt in Base64 (16 byte), oppure null per cancellare
 *             il PIN.
 */
export async function updatePinSalt(salt: string | null): Promise<void> {
  await updateField('pinKdfSalt', salt);
}
```

### 6.3 Gate Fase 4

**Prima di procedere alla Fase 5, verificare che**:

- `updatePinSalt` è esportata da `impostazioni-utente.ts`.
- La firma è `(salt: string | null): Promise<void>`.
- `fieldMap` contiene `pinKdfSalt: 'pin_kdf_salt'`.
- L'implementazione delega a `updateField('pinKdfSalt', salt)`.
- `npx tsc --noEmit` exit code 0.

---

## 7. Fase 5 — KDF PBKDF2-SHA256

### 7.1 File toccati

`src/lib/crypto.ts`.

### 7.2 Nuova funzione di derivazione

Aggiungere la funzione di derivazione della chiave (privata al modulo o
esportata, da decidere in implementazione; il DESIGN non vincola
l'esposizione).

```ts
// Import indicativo: l'API esatta è incapsulata nel modulo
// `KdfProvider` (livello di astrazione previsto dal Coding Plan 006).
// La dipendenza diretta da `react-native-quick-crypto` resta interna
// al provider; `src/lib/crypto.ts` consuma solo l'API del provider.
import { derivePbkdf2Sha256 } from './kdf-provider';

/**
 * Numero di iterazioni PBKDF2-SHA256.
 * Valore calibrato in Plan 006 Fase 0 su Windows con backend nativo
 * OpenSSL (mediana 86 ms). Floor invalicabile: 100.000 (OWASP,
 * DESIGN 006 §4).
 */
const PBKDF2_ITERATIONS = 600_000;

/**
 * Deriva una chiave AES-256 dal PIN tramite PBKDF2-SHA256.
 *
 * @param pin Stringa UTF-8 del PIN inserito dall'utente.
 * @param salt 16 byte casuali generati con crypto.getRandomValues.
 * @returns Uint8Array di 32 byte utilizzabile come chiave AES-256.
 */
function derivePinKey(pin: string, salt: Uint8Array): Uint8Array {
  const pinBytes = new TextEncoder().encode(pin);
  return derivePbkdf2Sha256(pinBytes, salt, PBKDF2_ITERATIONS, 32);
}
```

### 7.3 Formato payload versionato per PIN

Costante di versione e helper di costruzione/parsing.

```ts
const KDF_VERSION = 0x01;
const SALT_LEN = 16;
const IV_LEN = 12;
const TAG_LEN = 16;
```

**Serializzazione di `KDF_VERSION`**: la costante `0x01`
deve essere serializzata come un singolo byte `UInt8`
(1 byte esatto, valore 0–255). In fase di costruzione del
buffer, il byte deve essere scritto con:

```ts
buffer[0] = KDF_VERSION; // UInt8, 1 byte esatto
```

oppure tramite `DataView.setUint8(0, KDF_VERSION)`.

Non usare `Int8`, `Int16`, `Uint16` o tipi multi-byte.
Ogni variazione del tipo di serializzazione produce offset
errati in tutti i campi successivi (`SALT`, `IV`, `CT`,
`TAG`), causando decifratura silenziosa fallita.

Struttura del buffer per payload PIN:

```
[KDF_VERSION (1)] [SALT (16)] [IV (12)] [Ciphertext (N)] [AuthTag (16)]
```

Lunghezza totale decodificata: `1 + 16 + 12 + N + 16 = 45 + N` byte.

### 7.4 Estensione `encryptData` / `decryptData` per payload PIN

Riferimento: DESIGN 006 §6 e §10.

L'agente implementatore sceglie una delle due strategie equivalenti
(documentare la scelta nel commit):

- **A**: nuove funzioni dedicate `encryptDataPin(plaintext, pin, salt)`
  e `decryptDataPin(payload, pin)`, lasciando `encryptData` e
  `decryptData` invariate per i payload non-PIN.
- **B**: estendere `encryptData` e `decryptData` con un parametro opzionale
  che differenzia il formato (default: comportamento DESIGN 005
  invariato).

In entrambi i casi: la **retrocompatibilità del formato DESIGN 005 è
obbligatoria**. I payload prodotti dalle funzioni di DESIGN 005 devono
restare decifrabili dopo questa modifica.

### 7.5 Gate Fase 5

**Prima di procedere alla Fase 6, verificare che**:

- `PBKDF2_ITERATIONS` è una costante fissa, valorizzata dal risultato di
  Fase 0, ≥ 100.000.
- `derivePinKey` accetta `(pin: string, salt: Uint8Array)` e restituisce
  `Uint8Array` di 32 byte.
- `KDF_VERSION = 0x01` è dichiarato come costante.
- I payload non-PIN del formato DESIGN 005 restano decifrabili: rieseguire
  `npx jest __tests__/crypto/golden.test.ts` — G1, G2, G3 devono ancora
  passare. **Regressione: se uno dei tre fallisce, STOP**.
- `npx tsc --noEmit` exit code 0.

---

## 8. Fase 6 — Atomicità impostazione PIN

### 8.1 Decisione tecnica

Riferimento: DESIGN 006 §10. L'invariante "entrambi null o entrambi
non-null" tra `pin_privato_hash` e `pin_kdf_salt` deve essere garantito
in modo atomico tra le due chiamate `updatePinHash` e `updatePinSalt`.

**Opzioni valutate**:

| Strategia | Vantaggi | Svantaggi |
|-----------|----------|-----------|
| A — RPC Supabase con transazione SQL | Atomicità reale lato DB. | Richiede nuova RPC PostgreSQL su Supabase (modifica `docs/6-sql/`). |
| B — Sequenziale con rollback manuale | Nessuna modifica DB. | Atomicità best-effort: se il rollback fallisce, lo stato resta inconsistente. |
| C — Update unico via `updateField` esteso | Single round-trip, atomico lato API. | Richiede refactor di `updateField` per accettare multipli campi. |

**Decisione**: **Strategia C — update unico multi-campo**.

**Motivazione**:

- Non richiede modifiche al DB (no nuova RPC).
- È **atomica a livello di richiesta HTTP**: Supabase esegue l'UPDATE
  multi-colonna in una singola query SQL, quindi l'invariante è
  preservato a livello di transazione DB nativa di PostgreSQL.
- Mantiene la responsabilità dell'invariante nel layer repository,
  senza spostarla a livello applicativo (Strategia B) né a livello SQL
  custom (Strategia A).

### 8.2 Implementazione

In `src/lib/supabase/repositories/impostazioni-utente.ts`, aggiungere
una funzione dedicata per l'aggiornamento atomico:

```ts
/**
 * Aggiorna atomicamente hash PIN e salt PBKDF2.
 *
 * Garantisce l'invariante: pin_privato_hash e pin_kdf_salt restano
 * coerenti (entrambi null o entrambi non-null). L'atomicità è
 * garantita dal singolo UPDATE multi-colonna eseguito da Supabase.
 *
 * @param hash Hash bcrypt del PIN, oppure null per cancellare.
 * @param salt Salt PBKDF2 in Base64, oppure null per cancellare.
 */
export async function updatePinHashAndSalt(
  hash: string | null,
  salt: string | null,
): Promise<void> {
  // Pre-condizione: rispettare l'invariante.
  if ((hash === null) !== (salt === null)) {
    throw new Error(
      'updatePinHashAndSalt: hash e salt devono essere entrambi null o entrambi non-null',
    );
  }
  await updateFields({
    pinPrivatoHash: hash,
    pinKdfSalt: salt,
  });
}
```

### 8.2.1 Contratto errore di `updateFields`

La funzione `updateFields` che deve essere introdotta nello
stesso modulo ha il seguente contratto obbligatorio:

```ts
/**
 * Aggiorna atomicamente uno o più campi di impostazioni_utente.
 * Costruisce un singolo UPDATE Supabase multi-colonna.
 *
 * CONTRATTO ERRORE (obbligatorio, nessuna eccezione):
 * - Deve controllare response.error restituito da Supabase.
 * - Se response.error è non-null: deve rilanciare un'eccezione
 *   esplicita con il messaggio dell'errore Supabase.
 * - Non è ammesso swallow silenzioso dell'errore.
 * - Non è ammesso fallback implicito (es. continuare
 *   l'esecuzione come se l'update fosse avvenuto).
 */
async function updateFields(
  fields: Partial<
    Record<
      'pinPrivatoHash' | 'pinKdfSalt',
      string | number | null
    >
  >
): Promise<void> {
  // Costruire il mapping snake_case dai campi camelCase
  // tramite fieldMap esistente, poi eseguire:
  const response = await supabase
    .from('impostazioni_utente')
    .update(/* campi mappati */)
    .eq('user_id', /* user id corrente */);

  if (response.error) {
    throw new Error(
      `updateFields: aggiornamento fallito — ${response.error.message}`
    );
  }
}
```

L'implementatore DEVE rispettare questo contratto senza
eccezioni. Il mancato controllo di `response.error` rompe
l'invariante architetturale di atomicità dichiarato dal PLAN.

Dove `updateFields` è una variante multi-campo di `updateField` da
introdurre nello stesso modulo, che costruisce un singolo `update(...)`
Supabase con tutte le colonne specificate.

### 8.3 Vincolo sui consumatori

Il chiamante (UI di impostazione PIN) deve usare **esclusivamente**
`updatePinHashAndSalt`. Le funzioni `updatePinHash` e `updatePinSalt`
restano esportate per casi diagnostici o di debug, ma il loro uso diretto
per impostare il PIN è **vietato** per non rompere l'invariante.

### 8.4 Gate Fase 6

**Prima di procedere alla Fase 7, verificare che**:

- `updatePinHashAndSalt` è esportata.
- La pre-condizione "entrambi null o entrambi non-null" è enforced con
  `throw` esplicito.
- `updateFields` (multi-campo) è implementata e usata internamente.
- `npx tsc --noEmit` exit code 0.

---

## 9. Fase 7 — Golden vectors K1, K2, K3

### 9.1 File da creare

`__tests__/crypto/kdf.test.ts` con i tre vettori K.

### 9.2 Calcolo dei valori esatti

I valori numerici (hex, base64) dei vettori K devono essere
**calcolati offline in modo indipendente e fissati come
costanti prima di scrivere qualsiasi riga della test suite**.
Questa sequenza è obbligatoria e non invertibile.

Sequenza corretta:

1. Attendere il completamento di PLAN 005 e la disponibilità
   di `@noble/ciphers` installata e verificata.
2. Eseguire `derivePinKey(pin, salt)` in un REPL Node.js
   isolato (non nell'app, non in Jest) oppure tramite lo
   script dedicato `docs/scripts/generate-golden-vectors.js`
   se già disponibile.
3. Per ciascuno dei tre vettori K1, K2, K3: annotare
   l'output hex della chiave derivata e, per K3, il payload
   Base64 completo del buffer `[KDF_VERSION|SALT|IV|CT|TAG]`.
4. Verificare i valori con una seconda esecuzione indipendente
   (stesso REPL, stessa invocazione) per escludere errori
   di trascrizione.
5. Hardcodare i valori verificati come costanti nel file
   di test. I valori non devono mai essere calcolati
   dinamicamente in `beforeAll` o in qualsiasi hook di test.
6. Solo dopo il freeze dei valori, scrivere i test K1, K2, K3.

**Motivazione**: vettori calcolati dall'implementatore senza
verifica indipendente rischiano di creare test auto-consistenti
che validano l'implementazione su sé stessa senza garantire
la correttezza semantica dell'output crittografico.

### 9.3 K1 — Idempotenza della derivazione

| Campo | Valore |
|-------|--------|
| PIN | `'1234'` |
| Salt (hex, 16 byte) | `00112233445566778899aabbccddeeff` |
| Chiave attesa (hex, 32 byte) | **da calcolare e fissare** |

**Test**: invocare `derivePinKey('1234', salt)` due volte; i due output
devono essere identici bit per bit e identici al valore fissato.

### 9.4 K2 — Isolamento del salt

| Campo | Valore |
|-------|--------|
| PIN | `'1234'` |
| Salt A (hex) | `00112233445566778899aabbccddeeff` |
| Salt B (hex) | `ffeeddccbbaa99887766554433221100` |
| Chiave A | stessa di K1 |
| Chiave B | **da calcolare e fissare**, ≠ Chiave A |

**Test**: invocare `derivePinKey('1234', saltA)` e
`derivePinKey('1234', saltB)`; i due output devono essere diversi.

### 9.5 K3 — Pipeline completa PIN → AES-GCM → decifratura

**Semantica**: round-trip end-to-end.

1. Generare salt casuale e IV casuale (in produzione) — nel test, usare
   valori fissi per riproducibilità.
2. `derivePinKey(pin, salt)` → chiave AES-256.
3. Cifrare il plaintext con AES-GCM, IV fisso (solo per il test) e
   chiave derivata.
4. Costruire il buffer `[KDF_VERSION | SALT | IV | CT | TAG]`.
5. Decodificare il buffer, estrarre i campi, derivare la chiave dal
   PIN + salt estratto.
6. Decifrare AES-GCM.
7. Verificare che il plaintext recuperato è identico all'originale.

| Campo | Valore |
|-------|--------|
| PIN | `'9876'` |
| Salt (hex) | `0102030405060708090a0b0c0d0e0f10` |
| IV (hex) | `aabbccddeeff112233445566` |
| Plaintext | `'segreto privato'` |
| Payload Base64 atteso | **da calcolare e fissare** |
| Plaintext recuperato | `'segreto privato'` |

### 9.6 Gate Fase 7

**Prima di procedere al Gate di chiusura, verificare che**:

- K1 passa: idempotenza confermata.
- K2 passa: isolamento confermato.
- K3 passa: round-trip end-to-end confermato.
- I valori esatti dei vettori sono hardcoded nel file di test (non
  calcolati dinamicamente in `beforeAll`).
- `npx jest __tests__/crypto/kdf.test.ts` exit code 0.

---

## 10. Gate di chiusura Plan 006

Prima di dichiarare Plan 006 completato, verificare che **tutti** i
seguenti punti siano soddisfatti:

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
      multi-campo).
- [ ] Migration SQL `docs/6-sql/P40-add-pin-kdf-salt.sql` esiste, con
      blocco UP e blocco DOWN reversibile.
- [ ] **Regressione Plan 005**: G1, G2, G3 passano ancora
      (`npx jest __tests__/crypto/golden.test.ts` exit code 0).
- [ ] `npx tsc --noEmit` exit code 0.
- [ ] `npx jest __tests__/crypto/` exit code 0.
- [ ] Report Fase 0 (device, tabella iterazioni→ms, valore scelto)
      allegato al PR o citato nel commit message di Fase 0.

Se tutti i punti sono soddisfatti: stato del documento → **IMPLEMENTED**.

---

## 11. Vincoli e regole operative

Estratti operativi dal DESIGN 006 §12 ("Vincoli tecnici"). L'agente
implementatore deve rispettare ciascuno di questi vincoli senza
eccezioni.

### Vincoli bloccanti

- **V1**: DESIGN 005 deve essere implementato e mergiato prima di
  qualsiasi codice di Plan 006 (Gate §1).
- **V2**: algoritmo KDF = PBKDF2-SHA256 (DESIGN 006 §4). Scrypt e
  Argon2 sono esclusi.
- **V3**: **floor invalicabile 100.000 iterazioni** (OWASP). Nessun
  valore inferiore è accettabile, anche se rientrasse nel budget
  temporale.
- **V4**: vietato codice nativo custom interno al progetto. Sono
  consentite librerie esterne consolidate (`react-native-quick-crypto`)
  con binding nativi per operazioni crittografiche standardizzate.
  Riferimento: DESIGN 006 v0.4.0 §4 (Nota sul vincolo pure-JavaScript)
  e §12.
- **V5**: salt di **dimensione minima 16 byte** (128 bit).
- **V6**: salt generato **esclusivamente** con
  `crypto.getRandomValues` tramite il polyfill
  `react-native-get-random-values` introdotto da Plan 005.
- **V7**: budget prestazionale **100–300 ms** sul device di riferimento.
  Il floor (V3) prevale sul budget.
- **V8**: criticità floor-vs-budget = **non silenziare**. Se non
  raggiungibile, documentare come criticità aperta e attendere
  istruzione (vedi §2.5).

### Divieto esplicito su entropia

Riferimento: DESIGN 006 §5.

**DIVIETO ASSOLUTO**: non usare `Math.random()` né `Date.now()` come
fonte di entropia per il salt o per qualsiasi parametro crittografico.
Usare esclusivamente `crypto.getRandomValues()` (CSPRNG del sistema
operativo via polyfill).

Pre-commit check obbligatorio:

```bash
grep -nE "Math\.random|Date\.now" src/lib/crypto.ts
```

In `crypto.ts` il comando deve restituire 0 occorrenze (le eccezioni
debug-only, se necessarie, devono essere documentate con commento
esplicito).

### Invariante sistema

`pin_privato_hash` e `pin_kdf_salt` sono un'unità logica indivisibile.
Lo stato in cui una è null e l'altra non lo è è uno **stato invalido**
del sistema e non deve mai essere raggiunto. L'invariante è garantito
dalla Strategia C (Fase 6) e validato dal check pre-condizione di
`updatePinHashAndSalt`.
