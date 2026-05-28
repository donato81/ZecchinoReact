---
Titolo: DESIGN 017 — Motore Ricorrenze Automatico
Versione: 0.1.0
Data: 2026-05-28
Stato: DRAFT
Prerequisiti: DESIGN 013
DebitiTecniciOriginati: nessuno
---

# DESIGN 017 — Motore Ricorrenze Automatico

Sezione 1 — Intestazione e metadati
- Titolo: DESIGN 017 — Motore Ricorrenze Automatico
- Versione: 0.1.0
- Data: 2026-05-28
- Stato: DRAFT
- Prerequisiti: DESIGN 013 (repository ricorrenze) deve essere implementato e chiuso prima di avviare il coding plan di questo design.
- Debiti tecnici originati: nessuno previsto

Sezione 2 — Obiettivo
Implementare il motore che, ogni volta che l'app si avvia, legge tutte le ricorrenze in scadenza tramite la funzione getDue() del repository ricorrenze (DESIGN 013) e genera automaticamente le transazioni corrispondenti. Se oggi è il giorno in cui scatta la rata dell'affitto mensile, il motore crea la transazione e aggiorna la data della prossima generazione sulla ricorrenza. L'utente non deve fare nulla: la transazione appare già registrata quando apre l'app.
Il motore deve funzionare in modo silenzioso e non bloccante: se per qualsiasi motivo fallisce (rete assente, errore database), l'app si avvia comunque normalmente.

Sezione 3 — Invarianti architetturali specifiche
- Nessuna stringa visibile all'utente o annunciata dallo screen reader può essere scritta direttamente nel codice. Ogni testo passa obbligatoriamente da src/locales/it.ts. Senza eccezioni.
- Il motore non calcola date nel repository. Riceve da getDue() le ricorrenze scadute, genera le transazioni chiamando il repository transazioni, poi chiama update() sul repository ricorrenze passando la nuova data già calcolata dal layer di business logic del motore stesso.
- Il motore non blocca mai il bootstrap. Gira in parallelo con il caricamento dei dati, non in sequenza.
- Ogni transazione generata automaticamente porta un flag o una nota che la identifica come generata automaticamente da una ricorrenza, per trasparenza verso l'utente.
- Il calcolo della data della prossima generazione usa esclusivamente la data locale del dispositivo, mai toISOString() né UTC.

Sezione 4 — Struttura delle tabelle coinvolte
Riferimento schema completo: docs/6-sql/schema database supabase.md.

Tabella ricorrenze — campi rilevanti
- id: UUID, chiave primaria
- user_id: UUID, riferimento a auth.users
- conto_id: UUID, riferimento a conti
- categoria_id: UUID nullable, riferimento a categorie
- tipo: TEXT, entrata o uscita
- importo: NUMERIC(14,2)
- descrizione: TEXT
- frequenza: TEXT, giornaliero, settimanale, mensile, annuale
- data_inizio: DATE
- data_fine: DATE nullable
- ultima_generazione: DATE nullable
- prossima_generazione: DATE
- attiva: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

Tabella transazioni — campi rilevanti
- id: UUID, chiave primaria
- user_id: UUID, riferimento a auth.users
- conto_id: UUID, riferimento a conti
- conto_destinazione_id: UUID nullable, solo per trasferimenti
- categoria_id: UUID nullable, riferimento a categorie
- tipo: TEXT, entrata, uscita, trasferimento
- importo: NUMERIC(14,2)
- data: DATE
- descrizione: TEXT nullable
- note: TEXT nullable
- cifrato: BOOLEAN
- ricorrente: BOOLEAN
- frequenza_ricorrenza: TEXT nullable
- ricorrenza_fine: DATE nullable
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

Sezione 5 — Architettura del motore
Il motore è un servizio, non un repository.
Va creato in src/lib/services/ricorrenze-engine.ts.

Funzione pubblica principale:
processRecurrences(dataRiferimento?: string): Promise<ProcessResult>

ProcessResult contiene:
- generatedCount: numero di transazioni create
- errors: array di errori non fatali avvenuti durante la generazione (una singola ricorrenza in errore non blocca le altre)

Il motore viene chiamato da AppDataContext dopo che il caricamento dei dati principali è completato.

Sezione 6 — File da modificare o creare
src/lib/services/ricorrenze-engine.ts — nuovo file
- Funzione pubblica: processRecurrences()
- Funzione privata: calculateNextDate(ricorrenza) per calcolare la data della prossima generazione in base alla frequenza
- Dipende da: repository ricorrenze (getDue, update), repository transazioni (create)

src/context/AppDataContext.tsx — modifica
- Chiamata a processRecurrences() dopo il completamento di loadDomainSnapshot(). Wrapped in try/catch autonomo che non altera il flusso principale.

src/locales/it.ts — modifica
- Aggiungere le seguenti chiavi:
  - info.ricorrenze.processing
  - info.ricorrenze.processedCount
  - errors.ricorrenze.engineFailed
  - errors.ricorrenze.singleGenerationFailed

__tests__/ricorrenze-engine.test.ts — nuovo file
- Scenari obbligatori:
  - processRecurrences non genera nulla se getDue restituisce array vuoto
  - processRecurrences genera una transazione per ogni ricorrenza in scadenza
  - processRecurrences aggiorna prossima_generazione dopo la creazione della transazione
  - una singola ricorrenza in errore non blocca le altre
  - calculateNextDate calcola correttamente la data successiva per ogni frequenza (giornaliera, settimanale, mensile, annuale)
  - calcolo data successiva rispetta i mesi con numero di giorni diverso (es. febbraio)

Sezione 7 — Rischi e note operative
R1 — Mese con giorni diversi: il calcolo della data successiva per frequenza mensile deve gestire mesi corti. Es. una ricorrenza mensile con data_inizio al 31 gennaio deve generare la prossima al 28 o 29 febbraio, non andare fuori range.
R2 — Doppia generazione: se l'app viene aperta due volte nello stesso giorno, il motore non deve generare la stessa transazione due volte. Il campo ultima_generazione sulla tabella ricorrenze è la guardia principale contro questo rischio. Verificare nella logica del motore.
R3 — Ricorrenze future: getDue non restituisce ricorrenze con prossima_generazione nel futuro, ma il motore deve gestire il caso in cui il filtro fallisce e vengono restituite ricorrenze non ancora scadute.

Sezione 8 — Acceptance criteria
- npm test EXIT:0 con suite ricorrenze-engine.test.ts verde
- npx tsc --noEmit EXIT:0 senza errori nuovi
- Se la rete è assente, l'app si avvia normalmente senza bloccarsi sul motore
- Nessuna transazione duplicata generata su due avvii nella stessa giornata
- Tutte le stringhe utente passano da src/locales/it.ts