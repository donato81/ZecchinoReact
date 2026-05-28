---
Titolo: DESIGN 013 — Repository Ricorrenze
Versione: 0.1.0
Data: 2026-05-28
Stato: APPROVATO E VALIDATO
Prerequisiti: nessuno
DebitiTecniciOriginati: nessuno
---

# DESIGN 013 — Repository Ricorrenze

Sezione 1 — Intestazione e metadati
- Titolo: DESIGN 013 — Repository Ricorrenze
- Versione: 0.1.0
- Data: 2026-05-28
- Stato: APPROVATO E VALIDATO
- Prerequisiti: nessuno
- Debiti tecnici originati: nessuno da questo design

Sezione 2 — Obiettivo
Introdurre il repository per la tabella `ricorrenze` nel database.
Le ricorrenze sono transazioni programmate che si ripetono automaticamente
a intervalli regolari (giornalieri, settimanali, mensili, annuali).
Il repository espone le operazioni CRUD necessarie per creare, leggere,
aggiornare e disattivare le ricorrenze dell'utente autenticato.

Sezione 3 — Invarianti architetturali specifiche di questo design
- Nessuna stringa visibile all'utente o annunciata dallo
  screen reader può essere scritta direttamente nel codice.
  Ogni testo passa obbligatoriamente da src/locales/it.ts.
  Senza eccezioni.
- `RecurrenceType` è `'entrata' | 'uscita'` e non include `'trasferimento'`.
- Il repository non espone mai la funzione `remove()` con cancellazione fisica.
  L'unica operazione di eliminazione consentita è `deactivate(id)` che imposta `attiva = false`.
- Il calcolo della data della prossima generazione NON è responsabilità del repository.
  Il repository riceve la nuova data già calcolata dal layer superiore e la salva.
- Il filtro `data_fine` nella funzione `getDue` deve essere eseguito lato database
  nella query Supabase, non lato JavaScript dopo il caricamento.

Sezione 4 — Struttura della tabella
Rimandare a `docs/6-sql/schema-database-supabase.md` per lo schema completo della tabella `ricorrenze`.
Campi presenti (come nel file schema):
- `id`, `user_id`, `conto_id`, `categoria_id`, `tipo`, `importo`, `descrizione`, `frequenza`,
  `data_inizio`, `data_fine`, `ultima_generazione`, `prossima_generazione`, `attiva`, `created_at`, `updated_at`.

Sezione 5 — File da modificare
- `src/lib/supabase/types.ts`
  - Aggiungere interfaccia `DbRecurrence` con tutti i campi in snake_case.
  - Addizione pura, zero rischio regressione.

- `src/lib/types.ts`
  - Aggiungere `type RecurrenceType = 'entrata' | 'uscita'`.
  - Aggiungere interfaccia `Recurrence` con campi in camelCase.
  - Riutilizzare `RecurrenceFrequency` esistente.
  - Aggiungere campo `ricorrenze: Recurrence[]` in `AppState`.

- `src/context/AppDataContext.tsx`
  - Aggiungere caricamento ricorrenze in `loadDomainSnapshot()` come quinta voce del `Promise.all`.
  - Aggiungere `setRicorrenze` al blocco di reset al logout.
  - Aggiungere `ricorrenze` alla pipeline `writeCache`.

- `src/locales/it.ts`
- Aggiungere le seguenti chiavi:
  - errors.ricorrenze.loadFailed
  - errors.ricorrenze.createFailed
  - errors.ricorrenze.updateFailed
  - errors.ricorrenze.deactivateFailed
  - errors.ricorrenze.notFound
  - confirm.ricorrenze.created
  - confirm.ricorrenze.updated
  - confirm.ricorrenze.deactivated

Sezione 6 — File da creare
- `src/lib/supabase/repositories/ricorrenze.ts`
  - Funzioni pubbliche:
    - `getAll(filtri?)` con filtri opzionali su `attiva` e `contoId`.
    - `getById(id)`.
    - `getDue(dataRiferimento?)` con filtri su `prossima_generazione`, `attiva = true`,
      `data_fine IS NULL` oppure `data_fine >= dataRiferimento`; usare indice `idx_ricorrenze_prossima`.
    - `create(input)` con iniezione automatica `user_id`.
    - `update(id, input)` aggiornamento parziale.
    - `deactivate(id)` imposta `attiva = false`, non cancella.

- `__tests__/ricorrenze.repository.test.ts`
  - Scenari obbligatori documentati nel file (getAll, getDue, create, update, deactivate, error handling).

Sezione 7 — Mappings approvati
- `categoriaId` in `toClient`: `row.categoria_id ?? undefined`.
- `categoriaId` in `toDb`: `if ('categoriaId' in data) out.categoria_id = data.categoriaId ?? null`.
- Data locale per `getDue`: `YYYY-MM-DD` costruita con `getFullYear()`, `getMonth()+1`, `getDate()` con padding a due cifre.

Sezione 8 — Rischi residui
R1 — Calcolo data prossima generazione non di competenza del repository.
R2 — Filtro `data_fine` lato database, non JavaScript.
