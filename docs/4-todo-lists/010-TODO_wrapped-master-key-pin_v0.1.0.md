---
tipo: todo-specifico
titolo: Wrapped Master Key per PIN privato — Wrapped Master Key Architecture
versione: 0.1.0
data: 2026-05-27
stato: APERTO
sorgente: docs/3-coding-plans/010-PLAN_wrapped-master-key-pin_v0.1.0.md
ramo: main
---

# TODO 010 — Wrapped Master Key per PIN privato

## Sezione 1 — Metadata

- tipo: todo-specifico
- titolo: Wrapped Master Key per PIN privato — Wrapped Master Key Architecture
- versione: 0.1.0
- data: 2026-05-27
- stato: APERTO
- sorgente: docs/3-coding-plans/010-PLAN_wrapped-master-key-pin_v0.1.0.md

## Sezione 2 — Riepilogo operativo

Prima va chiuso il prerequisito di schema con le due migration coordinate,
poi vanno estesi repository e crypto helper per gestire la Wrapped Master
Key. Solo dopo si possono aggiornare i flussi PIN in AuthContext e i relativi
test, mantenendo tutti i messaggi su src/locales/.

## Sezione 3 — Lista task operativi

1. Eseguire le due migration SQL in intervento coordinato unico prima di ogni
   modifica applicativa.
   File o percorso coinvolto: docs/6-sql/P40-add-pin-kdf-salt.sql e nuova
   migration per pin_master_key_encrypted.
   Criterio di accettazione associato: CA-1.
   Stato iniziale: APERTO.

2. Aggiornare i tipi Supabase e il mapping repository per il nuovo campo
   pin_master_key_encrypted.
   File o percorso coinvolto: src/lib/supabase/types.ts,
   src/lib/supabase/repositories/impostazioni-utente.ts.
   Criterio di accettazione associato: CA-1.
   Stato iniziale: APERTO.

3. Implementare helper crypto per generazione, wrap, unwrap e validazione del
   payload JSON versionato della Master Key.
   File o percorso coinvolto: src/lib/crypto.ts.
   Criterio di accettazione associato: CA-1, CA-3.
   Stato iniziale: APERTO.

4. Introdurre o estendere il metodo atomico del repository per aggiornare
   pin_kdf_salt, pin_master_key_encrypted e pin_privato_hash con verifica
   esplicita di response.error.
   File o percorso coinvolto:
   src/lib/supabase/repositories/impostazioni-utente.ts.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

5. Integrare il nuovo materiale crittografico nel flusso setPin della creazione
   del conto privato.
   File o percorso coinvolto: src/context/AuthContext.tsx,
   src/lib/crypto.ts.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

6. Aggiornare changePin per ricifrare solo la Master Key esistente con il nuovo
   PIN.
   File o percorso coinvolto: src/context/AuthContext.tsx,
   src/lib/crypto.ts,
   src/lib/supabase/repositories/impostazioni-utente.ts.
   Criterio di accettazione associato: CA-3.
   Stato iniziale: APERTO.

7. Rendere distruttivo il reset PIN con cancellazione dei tre campi e logout
   globale.
   File o percorso coinvolto: src/context/AuthContext.tsx,
   src/lib/supabase/repositories/impostazioni-utente.ts.
   Criterio di accettazione associato: CA-4.
   Stato iniziale: APERTO.

8. Sostituire tutti i messaggi hardcoded del flusso PIN con chiavi locali e
   announcement dedicati.
   File o percorso coinvolto: src/context/AuthContext.tsx, src/locales/it.ts,
   src/announcements/auth.ts.
   Criterio di accettazione associato: CA-5.
   Stato iniziale: APERTO.

## Sezione 4 — Task di test

1. Verificare la serializzazione/deserializzazione del payload versionato della
   Master Key.
   File o percorso coinvolto: __tests__/crypto/ o nuova suite dedicata.
   Criterio di accettazione associato: CA-1.
   Stato iniziale: APERTO.

2. Verificare il caso pin_master_key_encrypted = null prima della configurazione
   del PIN.
   File o percorso coinvolto: __tests__/crypto/ o nuova suite dedicata.
   Criterio di accettazione associato: CA-1.
   Stato iniziale: APERTO.

3. Verificare il trattamento del payload malformato come errore di business
   senza crash.
   File o percorso coinvolto: __tests__/crypto/ o nuova suite dedicata.
   Criterio di accettazione associato: CA-1.
   Stato iniziale: APERTO.

4. Verificare la scrittura atomica dei tre campi tramite mock repository o mock
   Supabase con failure parziale simulata.
   File o percorso coinvolto: __tests__/ dedicate al repository PIN.
   Criterio di accettazione associato: CA-2.
   Stato iniziale: APERTO.

5. Verificare che changePin ricifri solo la Master Key e lasci invariati i dati
   reali.
   File o percorso coinvolto: __tests__/AuthContext o suite dedicate PIN.
   Criterio di accettazione associato: CA-3.
   Stato iniziale: APERTO.

6. Verificare che reset PIN cancelli i materiali crittografici e attivi il
   logout globale.
   File o percorso coinvolto: __tests__/AuthContext o suite dedicate PIN.
   Criterio di accettazione associato: CA-4.
   Stato iniziale: APERTO.

7. Verificare che i messaggi del flusso PIN usino chiavi locali e non stringhe
   hardcoded.
   File o percorso coinvolto: __tests__/AuthContext e moduli announcement.
   Criterio di accettazione associato: CA-5.
   Stato iniziale: APERTO.

## Sezione 5 — Debiti tecnici

- DT-010-01: Funzioni PostgreSQL per operazioni crittografiche del PIN.
  Stato: DA PIANIFICARE.

## Sezione 6 — Note operative

- Le due migration sono un gate architetturale invalicabile e vanno eseguite
  insieme.
- Nessuna stringa hardcoded e ammessa nei flussi PIN; ogni messaggio deve usare
  src/locales/.
- L'update dei tre campi PIN su Supabase deve restare atomico e controllare
  esplicitamente response.error.
- Il reset PIN e distruttivo e deve includere il logout globale su tutti i
  device.
