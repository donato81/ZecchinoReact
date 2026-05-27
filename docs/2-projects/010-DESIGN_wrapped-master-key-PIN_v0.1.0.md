---
tipo: design
titolo: Wrapped Master Key per PIN privato — Wrapped Master Key Architecture
versione: 0.1.0
data: 2026-05-27
stato: REVIEWED
sorgente: docs/2-projects/006-DESIGN_kdf-pin_v0.4.0.md
perimetro: src/lib/crypto.ts, docs/6-sql/, src/lib/supabase/repositories/impostazioni-utente.ts
---

# DESIGN 010 — Wrapped Master Key for PIN (Wrapped Master Key Architecture)

## Sezione 1 — Metadata

- **Design ID:** 010
- **Titolo:** Wrapped Master Key per PIN privato
- **Versione:** v0.1.0
- **Data:** 2026-05-27
- **Stato:** REVIEWED
- **Fonte primaria:** DESIGN 006 (KDF PIN), `docs/6-sql/P25-schema-impostazioni-utente.sql`, `docs/6-sql/P40-add-pin-kdf-salt.sql`
- **Perimetro:** modifica schema `impostazioni_utente`, definizione payload `pin_master_key_encrypted`, flusso cambio/reset PIN, contratto operativo atomico su Supabase

## Sezione 2 — Contesto e motivazione

Questo design introduce la Wrapped Master Key Architecture per il supporto sicuro del PIN privato senza creare tabelle separate per le chiavi. Obiettivo: limitare l'esposizione della chiave derivata dal PIN e abilitare operazioni di cambio PIN ricifrando esclusivamente la Master Key.

Motivazioni tecniche:
- Ridurre l'area di blast in caso di compromissione della derivazione PIN.
- Separare la Master Key (random) dalla chiave derivata PBKDF2 per migliorare i percorsi di rotazione.

## Sezione 3 — Perimetro

In scope:
- Persistenza della Master Key cifrata nella colonna `pin_master_key_encrypted` di `impostazioni_utente`.
- Definizione del payload JSON versionato (version, iv, ciphertext, tag) e tipo colonna `text`.
- Regole di atomicità per update di `pin_kdf_salt`, `pin_master_key_encrypted`, `pin_privato_hash` in singola operazione `UPDATE` su Supabase.
- Comportamento di cambio PIN: ricifratura della Master Key locale e aggiornamento atomico.
- Comportamento di reset PIN: cancellazione distruttiva dei materiali crittografici e logout globale.

Fuori scope:
- Implementazione delle funzioni PostgreSQL crittografiche (debito tecnico documentato).
- Modifica di altri payload cifrati dell'utente.

## Sezione 4 — Architettura e decisioni

Decisioni incorporate (obbligatorie):

- Decisione 1: la Master Key cifrata vive nella tabella `impostazioni_utente`. Si aggiunge la colonna `pin_master_key_encrypted`. Nessuna tabella separata.

- Decisione 2: il valore della colonna è un payload JSON serializzato e versionato con quattro campi: `version` (intero), `iv` (Base64), `ciphertext` (Base64), `tag` (Base64). Tipo colonna: `text`.

- Decisione 2-bis: prima del PIN la colonna è `NULL` ed è valido. Dopo l'impostazione del PIN la colonna deve essere presente e valida. Payload `NULL` o malformato genera errore di business gestito tramite il sistema locali; mai crash applicativo.

- Decisione 3: cambio PIN ricicrifica solo la Master Key. I dati reali non vengono toccati. Le tre colonne `pin_kdf_salt`, `pin_master_key_encrypted`, `pin_privato_hash` si aggiornano in modo atomico con singola operazione `UPDATE` su Supabase. Il codice verifica sempre `response.error` esplicitamente.

- Decisione 4: reset PIN è distruttivo. Nessun recupero sicuro esiste senza backdoor crittografica. L'utente viene avvisato prima dell'attivazione (messaggio tramite sistema locali). Dopo il reset: logout globale di tutte le sessioni su tutti i device.

- Decisione 4-bis: ogni device ri-deriva la nuova chiave localmente dal nuovo PIN. La chiave non viaggia mai sulla rete. La vecchia chiave non viene mai riutilizzata.

- Decisione 5: il PIN nasce solo alla creazione del conto privato. Non esiste funzione per aggiungere PIN a conto esistente.

- Decisione 6: mancano due colonne in `impostazioni_utente`. `pin_kdf_salt` (P40 già pronta) e `pin_master_key_encrypted` (nuova migration SQL da creare). Entrambe le migration vanno eseguite insieme prima di qualsiasi codice. Regola: Schema First, Code Second.

Le due migration costituiscono un unico prerequisito
architetturale. Devono essere applicate insieme,
nello stesso intervento coordinato, prima di
qualsiasi deployment applicativo. Non è consentito
applicarne una sola in attesa dell'altra: lo stato
parziale con una sola colonna presente è uno stato
non valido per il sistema.

Flusso operativo sintetico:

1. All'atto di creazione del conto privato: generare una Master Key AES-256 casuale locale (32 byte); derivare KEK con PBKDF2 dal PIN; cifrare Master Key con AES-GCM usando KEK; costruire payload JSON {version, iv, ciphertext, tag}; persistirlo in `pin_master_key_encrypted` insieme a `pin_kdf_salt` e `pin_privato_hash` in singola update atomica.

2. Per il cambio PIN: derivare vecchio KEK dal vecchio PIN, decifrare Master Key, derivare nuovo KEK dal nuovo PIN, ricifrare Master Key con nuovo KEK, scrivere i tre campi atomici in Supabase.

3. Reset PIN: cancellare `pin_master_key_encrypted`, `pin_kdf_salt`, `pin_privato_hash` (set NULL) e forzare logout globale; informare l'utente tramite messaggio locale.

Atomicità e coerenza:
- L'atomicità è responsabilità del Coding Plan e dell'implementazione repository: utilizzare un singolo `UPDATE` parametrizzato su `impostazioni_utente` per evitare stati parziali.

## Sezione 5 — Invariante: Nessuna stringa hardcoded

Nessuna stringa hardcoded è consentita nelle funzionalità coperte da questo design. Tutti i messaggi visivi e gli annunci per screen reader (toast, errori, conferme, dialog, annunci TalkBack) devono essere passati tramite il sistema di localizzazione in `src/locales/` come definito da DESIGN 004. Il documento dichiara l'obbligo di usare chiavi di localizzazione per ogni messaggio utente prodotto da operazioni PIN, incluse le notifiche di reset e gli errori di payload.

## Sezione 6 — Dipendenze da altri design

- DESIGN 006 — KDF PIN (obbligatorio)
- DESIGN 004 — Announcements / sistema locali (per tutti i messaggi UX)
- docs/6-sql/P40-add-pin-kdf-salt.sql (migration esistente)

## Sezione 7 — Debiti tecnici aperti

- DT-010-01: Funzioni PostgreSQL per operazioni crittografiche del PIN (valutare funzioni server-side per auditing e centralizzazione). Priorità: bassa. Non bloccante.

## Sezione 8 — Criteri di accettazione

- CA-1: `pin_master_key_encrypted` è presente nello schema e accetta payload JSON serializzato come definito.
 - CA-2: Operazione di impostazione PIN scrive
`pin_kdf_salt`, `pin_master_key_encrypted`,
`pin_privato_hash` con singola operazione UPDATE
su Supabase (verificata su ambiente di test
mediante mock repository che simula failure
parziale).
Comportamento atteso in caso di errore restituito
da Supabase: nessuna delle tre informazioni viene
considerata aggiornata dal sistema. Il codice
deve verificare esplicitamente response.error
e trattare qualsiasi errore come operazione
interamente fallita, senza stato parziale.
Questo criterio è classificato come obbligatorio
di sicurezza dal Consiglio AI.
 - CA-3: Cambio PIN ricifra solo la Master Key; i dati reali rimangono invariati.
- CA-4: Reset PIN cancella i materiali crittografici e causa logout globale.
- CA-5: Tutti i messaggi utente usano `src/locales/` e non contengono stringhe hardcoded.
