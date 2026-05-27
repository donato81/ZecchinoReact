---
Titolo: DESIGN 016-bis — Utility Automatica Cleanup File Orfani Storage
Versione: 0.1.0
Data: 2026-05-28
Stato: APPROVATO E VALIDATO
DipendenzaDiretta: DESIGN 016
DebitoTecnicoOrigine: DT-016-02
DebitiTecniciOriginati: DT-016-bis-01, DT-016-bis-02, DT-016-bis-03
---

# DESIGN 016-bis — Utility Automatica Cleanup File Orfani Storage

Sezione 1 — Intestazione e metadati
- Titolo: DESIGN 016-bis — Utility Automatica Cleanup File Orfani Storage
- Versione: 0.1.0
- Data: 2026-05-28
- Stato: APPROVATO E VALIDATO
- Dipendenza diretta: DESIGN 016
- Debito tecnico di origine: DT-016-02
- Debiti tecnici originati: DT-016-bis-01, DT-016-bis-02, DT-016-bis-03

Sezione 2 — Premessa architetturale
Il rollback best-effort di DESIGN 016 può lasciare file orfani. Questo design
introduce un sistema di cleanup automatico, silenzioso e invisibile, attivato
in quattro trigger strategici del ciclo di vita dell'app.

Sezione 3 — Invarianti architetturali
- Cleanup non bloccante per bootstrap/login/logout/operazioni utente.
- Database è fonte di verità: non eliminare record DB se manca il file.
- Best effort: non propagare errori all'utente; ritentare silenziosamente.

Sezione 4 — Definizione di file orfano
File presente nel bucket `allegati-transazioni` sotto `{user_id}/...` senza
record corrispondente nella tabella `allegati_transazioni` con `storage_path` uguale.

Sezione 5 — File da creare
- `src/lib/storage-cleanup-service.ts` (service fire-and-forget, pattern simile a `export-service.ts`).

Aggiornamenti richiesti
- `src/context/AuthContext.tsx` — aggiungere trigger fire-and-forget al login e chiamata con timeout protetto al logout.

Sezione 6 — I quattro trigger automatici
TRIGGER 1 — Dopo upload fallito: `cleanupSpecificOrphan(storagePath)` (O(1)).
TRIGGER 2 — Al login: scan fire-and-forget limitato ultime 48 ore, `MAX_FILES_PER_SCAN=100`, safety window 3 minuti.
TRIGGER 3 — Dopo cancellazione transazione: scansione limitata a `{user_id}/{transazione_id}/`.
TRIGGER 4 — Al logout: `Promise.race([cleanup(), timeout(CLEANUP_LOGOUT_TIMEOUT_MS)])`.

Sezione 7 — Guardia concorrente globale
let `cleanupInProgress = false` (esente Trigger 1).

Sezione 8 — Throttle temporale globale
`MIN_CLEANUP_INTERVAL_MS = 900000` (15 minuti). Trigger 1 esentato.

Sezione 9 — Safety window
`CLEANUP_SAFETY_WINDOW_MS = 180000` (3 minuti).

Sezione 10 — Costanti TS obbligatorie
`CLEANUP_RECENCY_HOURS = 48`, `MAX_FILES_PER_SCAN = 100`, `MIN_CLEANUP_INTERVAL_MS = 900000`,
`CLEANUP_SAFETY_WINDOW_MS = 180000`, `CLEANUP_LOGOUT_TIMEOUT_MS = 1500`.

Sezione 11 — Algoritmo di scansione (tre fasi)
1) recupero lista file dallo storage paginata;
2) recupero percorsi noti dal DB in `Set<string>`;
3) confronto e cancellazione indipendente per ogni orfano.

Sezione 12 — Tipo `CleanupResult`
`type CleanupResult = { scanned: number, orphanFound: number, deleted: number, failed: number }`.

Sezione 13 — Logging tecnico
`console.warn('[storage-cleanup]', ...)` — nessun message UI.

Sezione 14 — Sicurezza e isolamento utenti
Operate solo su file con path che iniziano per `{user_id}/`.

Sezione 15 — Debiti tecnici aperti
DT-016-bis-01 — Script CLI manutenzione
DT-016-bis-02 — Edge Functions server-side
DT-016-bis-03 — Log opt-in per utenti avanzati

Sezione 16 — Test architetturali obbligatori (11 test)
- TEST 1..11 (visti nel design): coprire trigger, throttle, safety window, isolamento, guardia concorrente.
