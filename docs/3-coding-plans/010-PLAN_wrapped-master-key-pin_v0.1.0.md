---
tipo: coding-plan
titolo: Wrapped Master Key per PIN privato — Wrapped Master Key Architecture
versione: 0.1.0
data: 2026-05-27
stato: DRAFT
sorgente: docs/2-projects/010-DESIGN_wrapped-master-key-PIN_v0.1.0.md
perimetro: src/lib/crypto.ts, docs/6-sql/, src/lib/supabase/repositories/impostazioni-utente.ts
ramo: main
---

# PLAN 010 — Wrapped Master Key per PIN privato

## Sezione 1 — Metadata

- tipo: coding-plan
- titolo: Wrapped Master Key per PIN privato — Wrapped Master Key Architecture
- versione: 0.1.0
- data: 2026-05-27
- stato: DRAFT
- sorgente: docs/2-projects/010-DESIGN_wrapped-master-key-PIN_v0.1.0.md
- perimetro: src/lib/crypto.ts, docs/6-sql/, src/lib/supabase/repositories/impostazioni-utente.ts

## Sezione 2 — Obiettivo

Introdurre la Wrapped Master Key Architecture per il PIN privato senza
tabella separata delle chiavi, limitando l'esposizione della chiave
derivata dal PIN e consentendo il cambio PIN tramite ricifratura della
sola Master Key. Il piano copre schema, payload cifrato, atomicita della
persistenza su Supabase, cambio/reset PIN e allineamento dei messaggi utente
al sistema di localizzazione.

## Sezione 3 — Precondizioni

- DESIGN 006 deve essere gia disponibile come base del KDF PIN.
- DESIGN 004 deve essere applicabile a tutti i messaggi utente e annunci
  coinvolti nel flusso PIN.
- La migration esistente docs/6-sql/P40-add-pin-kdf-salt.sql e la nuova
  migration per pin_master_key_encrypted devono essere preparate ed eseguite
  insieme, nello stesso intervento coordinato, prima di qualsiasi modifica
  applicativa.
- Il repository Supabase deve poter aggiornare in una singola operazione
  UPDATE i campi pin_kdf_salt, pin_master_key_encrypted e pin_privato_hash.
- I flussi AuthContext che oggi gestiscono setPin, changePin e removePin
  devono essere disponibili per l'integrazione del nuovo materiale
  crittografico.

## Sezione 4 — Invariante stringhe hardcoded

Nessuna stringa hardcoded e consentita. Tutti i messaggi utente derivati da
operazioni PIN, inclusi reset, errori di payload, conferme e annunci screen
reader, devono usare esclusivamente src/locales/ come definito da DESIGN 004.

## Sezione 5 — Passi di implementazione

1. Eseguire il prerequisito schema-first con intervento coordinato unico.
   File: docs/6-sql/P40-add-pin-kdf-salt.sql e nuova migration SQL per la
   colonna pin_master_key_encrypted in impostazioni_utente.
   Sezione o funzione coinvolta: schema impostazioni_utente.
   Criteri soddisfatti: CA-1.

2. Estendere il contratto dati delle impostazioni utente per includere il
   payload cifrato versionato.
   File: src/lib/supabase/types.ts e
   src/lib/supabase/repositories/impostazioni-utente.ts.
   Sezione o funzione coinvolta: tipi DbUserSettings/UserSettings, toClient,
   fieldMap, updateFields.
   Criteri soddisfatti: CA-1, CA-2.

3. Introdurre in src/lib/crypto.ts la gestione della Master Key locale e del
   payload {version, iv, ciphertext, tag}, inclusa la validazione del caso
   NULL e del payload malformato come errore di business non crashante.
   File: src/lib/crypto.ts.
   Sezione o funzione coinvolta: helper di generazione chiave AES-256,
   cifratura/decifratura AES-GCM e serializzazione/deserializzazione payload.
   Criteri soddisfatti: CA-1, CA-3.

4. Adeguare il repository delle impostazioni per una scrittura atomica dei tre
   campi di sicurezza del PIN con verifica esplicita di response.error.
   File: src/lib/supabase/repositories/impostazioni-utente.ts.
   Sezione o funzione coinvolta: updateFields e metodo atomico per
   pin_kdf_salt, pin_master_key_encrypted, pin_privato_hash.
   Criteri soddisfatti: CA-2.

5. Integrare il flusso di impostazione PIN nella fase di creazione del conto
   privato generando la Master Key locale, derivando il KEK dal PIN e
   persistendo hash, salt e payload cifrato con un'unica update.
   File: src/context/AuthContext.tsx, src/lib/crypto.ts,
   src/lib/supabase/repositories/impostazioni-utente.ts.
   Sezione o funzione coinvolta: setPin e relativo call path di creazione del
   conto privato.
   Criteri soddisfatti: CA-2, CA-5.

6. Aggiornare changePin per ricifrare esclusivamente la Master Key esistente,
   senza toccare i dati reali e senza riutilizzare la vecchia chiave.
   File: src/context/AuthContext.tsx, src/lib/crypto.ts,
   src/lib/supabase/repositories/impostazioni-utente.ts.
   Sezione o funzione coinvolta: changePin e helper di unwrap/rewrap della
   Master Key.
   Criteri soddisfatti: CA-2, CA-3.

7. Rendere distruttivo il reset PIN cancellando i tre campi crittografici e
   forzando il logout globale di tutte le sessioni su tutti i device.
   File: src/context/AuthContext.tsx,
   src/lib/supabase/repositories/impostazioni-utente.ts.
   Sezione o funzione coinvolta: removePin/reset PIN e flusso di logout.
   Criteri soddisfatti: CA-4, CA-5.

8. Eliminare i messaggi hardcoded dei flussi PIN e riallinearli a chiavi di
   localizzazione e annunci dedicati.
   File: src/context/AuthContext.tsx, src/locales/it.ts,
   src/announcements/auth.ts.
   Sezione o funzione coinvolta: unlockPrivate, setPin, changePin,
   removePin e generatori announcement PIN.
   Criteri soddisfatti: CA-5.

## Sezione 6 — Criteri di accettazione

- CA-1: `pin_master_key_encrypted` è presente nello schema e accetta payload JSON serializzato come definito.
  Nota implementativa: il controllo copre sia la nuova migration sia il mapping
  repository/tipi del nuovo campo.

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
  Nota implementativa: la verifica deve coprire setPin e changePin tramite il
  metodo atomico del repository.

- CA-3: Cambio PIN ricifra solo la Master Key; i dati reali rimangono invariati.
  Nota implementativa: serve prova tramite test che il flusso non rilegga o
  riscriva altri payload utente.

- CA-4: Reset PIN cancella i materiali crittografici e causa logout globale.
  Nota implementativa: il piano richiede cancellazione con set NULL dei tre
  campi e validazione del logout globale.

- CA-5: Tutti i messaggi utente usano `src/locales/` e non contengono stringhe hardcoded.
  Nota implementativa: includere messaggi di reset, conferme, errori di payload
  e annunci accessibili.

## Sezione 7 — Test da implementare

1. Test unitario della serializzazione/deserializzazione del payload
   versionato {version, iv, ciphertext, tag}.
2. Test unitario del caso pre-PIN con pin_master_key_encrypted = null.
3. Test unitario del payload malformato con esito di business gestito e senza
   crash applicativo.
4. Test repository per la scrittura atomica dei tre campi con singola update.
5. Test repository/mock Supabase che simula response.error e verifica il
   trattamento dell'operazione come interamente fallita.
6. Test del flusso setPin che genera Master Key, salt PBKDF2, hash e payload
   cifrato nello stesso passaggio.
7. Test del flusso changePin che decifra con vecchio PIN e ricifra con nuovo
   PIN lasciando invariati i dati reali.
8. Test del flusso reset PIN che porta i tre campi a null e attiva il logout
   globale.
9. Test dei messaggi utente per verificare che i flussi PIN leggano chiavi da
   src/locales/ e announcement dedicati senza stringhe hardcoded.

## Sezione 8 — Debiti tecnici da tracciare

- DT-010-01: Funzioni PostgreSQL per operazioni crittografiche del PIN (valutare funzioni server-side per auditing e centralizzazione). Priorità: bassa. Non bloccante.

## Sezione 9 — Dipendenze

- DESIGN 006 — KDF PIN.
- DESIGN 004 — Announcements / sistema locali.
- docs/6-sql/P40-add-pin-kdf-salt.sql.
- Nuova migration SQL per pin_master_key_encrypted.
