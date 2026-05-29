---
titolo: PLAN 017 - Prestiti, Mutui e Simulazione Finanziaria
versione: 0.1.0
data: 2026-05-29
stato: REVIEWED
design_riferimento: docs/2-projects/017-DESIGN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
autore: Agent-Orchestrator
dipendenze: nessuna
---

# PLAN 017 - Prestiti, Mutui e Simulazione Finanziaria

## 1. Obiettivo del Piano

Introdurre il dominio prestiti, mutui e simulazione finanziaria con motore di calcolo puro, repository Supabase dedicati, RPC atomiche per i rimborsi, cache offline separata e integrazione fail-soft in AppDataContext.

## 2. Perimetro (Scope)

File sorgente da creare o modificare:
- modello tipi client del dominio prestiti
- modello tipi Supabase del dominio prestiti
- src/lib/helpers.ts - questo file riceve l'aggiunta della funzione roundCurrency. DESIGN 017 e il documento proprietario di questa funzione. I DESIGN 018 e futuri la riutilizzeranno senza ridefinirla.
  
	PLAN 017 è il documento proprietario delle funzioni roundCurrency ed extractDatePart. Entrambe vengono introdotte in src/lib/helpers.ts da questo PLAN. I PLAN 018, 019 e successivi le riutilizzano senza ridefinirle.
- motore di simulazione finanziaria puro
- repository prestiti
- repository rimborsi prestiti
- cache offline del dominio
- snapshot cache del dominio dati
- context dati applicativo
- registro di localizzazione italiano
- docs/6-sql/P52-prestiti-mutui.sql
- docs/6-sql/P53-rpc-rimborsi-prestiti.sql
- docs/6-sql/P54-prestiti-rimborsi.sql
- docs/6-sql/schema database supabase.md
- __tests__/loan-calculator.test.ts
- __tests__/prestiti.repository.test.ts
- __tests__/prestiti-rimborsi.repository.test.ts

Fuori perimetro:
- creazione automatica di transazioni nella tabella transazioni a fronte dei rimborsi
- promemoria rate o notifiche di scadenza
- UI React Native per simulazione, dettagli contratto o registrazione rimborso
- distinzione completa fra piano teorico e consuntivo reale oltre i campi base del design

## 3. Prerequisiti Bloccanti

- Nessun prerequisito architetturale esterno: DESIGN 017 e il primo blocco della sequenza 017-019.
- Verifica infrastrutturale obbligatoria: le migrazioni placeholder P52, P53 e P54 devono essere create in docs/6-sql prima di avviare l'implementazione dei repository.
- Verifica contrattuale obbligatoria: roundCurrency ed extractDatePart devono essere introdotte nelle helper condivise del progetto in questo blocco, perche i blocchi 018 e 019 dipendono dalla loro disponibilita.

## 4. Architettura e Decisioni Chiave

- Decisione 1 - Il dominio separa tipo e stato. Conseguenza pratica: LoanType ammette solo mutuo_finanziamento e prestito_personale, mentre LoanStatus ammette simulazione, attivo e chiuso.
- Decisione 2 - Il saldo residuo e aggiornato solo tramite RPC atomiche. Conseguenza pratica: nessun task puo introdurre update client-side diretti del saldo_residuo.
- Decisione 3 - DESIGN 017 introduce roundCurrency ed extractDatePart nelle helper condivise del progetto. Conseguenza pratica: i task che preparano 018 e 019 devono esportare queste utility in modo condiviso e senza ridefinizioni future.
- Decisione 4 - loan-calculator.ts resta puro. Conseguenza pratica: il motore non puo dipendere da React, Supabase o AppDataContext.
- Decisione 5 - Le simulazioni locali non salvate restano effimere. Conseguenza pratica: AppDataContext non deve chiamare repository o RPC per simulazioni create solo nello stato locale React.
- Decisione 6 - La cache distingue prestiti attivi da simulazioni. Conseguenza pratica: cache tables, snapshot e TTL devono trattare separatamente i due insiemi.
- Decisione 7 - Tutte le stringhe utente passano dal registro di localizzazione italiano. Conseguenza pratica: repository, context e test non devono introdurre messaggi hardcoded.

## 5. Task Atomici

### T1
- Azione: Aggiungere LoanType, LoanStatus, LoanDirection, PianoAmmortamentoVoce, LoanSimulationResult, PrestitoMutuo e PrestitoRimborso al modello client.
- File target: src/lib/types.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit compila i nuovi tipi senza errori e senza collisioni con i tipi dominio esistenti.
- Note operative: dataFinePrevista deve restare opzionale nel tipo TypeScript ma obbligatoriamente ricalcolata dal repository per i contratti attivi.

### T2
- Azione: Aggiungere DbPrestitoMutuo e DbPrestitoRimborso con naming snake_case coerente al layer Supabase.
- File target: src/lib/supabase/types.ts
- Dipende da: T1
- Metrica di successo: npx tsc --noEmit accetta i nuovi tipi Db* e il mapping futuro puo avvenire senza cast unsafe.
- Note operative: mantenere i tipi Db* confinati al layer Supabase.

### T3
- Azione: Introdurre roundCurrency ed extractDatePart nelle helper condivise del progetto per calcoli monetari e parsing date timezone-safe.
- File target: src/lib/helpers.ts
- Dipende da: nessuno
- Metrica di successo: i nuovi helper sono esportati da helpers.ts, usano contratti deterministici e possono essere importati senza ridefinizione dai blocchi 018 e 019.
- Note operative: roundCurrency deve usare parseFloat(value.toFixed(2)); extractDatePart deve restituire i primi dieci caratteri della stringa data.

### T4
- Azione: Creare loan-calculator.ts con simulazione finanziaria, metodo francese, rata mensile, totale interessi, piano di ammortamento e saldo residuo a data.
- File target: src/lib/loan-calculator.ts
- Dipende da: T1, T3
- Metrica di successo: __tests__/loan-calculator.test.ts copre tasso zero, durata un mese, grandi valori, input negativi e arrotondamenti coerenti.
- Note operative: il motore deve usare roundCurrency in tutti i punti di calcolo monetario.

### T5
- Azione: Creare il repository prestiti con getAll, getById, getAttivi, create, update, promote, close e deleteSimulation.
- File target: src/lib/supabase/repositories/prestiti.ts
- Dipende da: T1, T2, T3, T4
- Metrica di successo: __tests__/prestiti.repository.test.ts dimostra mapping coerente, promozione con stesso id, ricalcolo dataFinePrevista e assenza di mutazioni fuori contratto.
- Note operative: create e update devono calcolare e persistere rataMensile, totaleInteressi e dataFinePrevista quando applicabile.

### T6
- Azione: Creare il repository prestiti-rimborsi con addRimborso e deleteRimborso basati esclusivamente sulle RPC atomiche rpc_aggiungi_rimborso (file SQL di migrazione: da assegnare - placeholder P_017_01 - aggiornare con numero progressivo reale al momento dell'implementazione) e rpc_elimina_rimborso (file SQL di migrazione: da assegnare - placeholder P_017_02 - aggiornare con numero progressivo reale al momento dell'implementazione).
- File target: src/lib/supabase/repositories/prestiti-rimborsi.ts
- Dipende da: T2, T5
- Metrica di successo: __tests__/prestiti-rimborsi.repository.test.ts dimostra atomicita, saldo mai negativo, rollback su errore e chiusura automatica del contratto.
- Note operative: nessun aggiornamento diretto del saldoResiduo e ammesso fuori dalle RPC.

### T7
- Azione: Estendere cache offline e snapshot applicativo per separare prestiti attivi, simulazioni persistite e rimborsi prestiti.
- File target: src/lib/supabase/cache.ts, src/context/app-data-cache.ts
- Dipende da: T1, T5, T6
- Metrica di successo: le nuove chiavi cache risultano registrate, con TTL differenziato, e DomainSnapshot serializza i nuovi slice senza rompere il bootstrap esistente.
- Note operative: la separazione reali vs simulazioni deve essere esplicita e non inferita lato consumer.

### T8
- Azione: Integrare i nuovi slice in AppDataContext con hydration fail-soft, refresh, reset logout e gestione delle simulazioni locali non persistite.
- File target: src/context/AppDataContext.tsx
- Dipende da: T1, T5, T6, T7
- Metrica di successo: i test del context dimostrano che il bootstrap non fallisce se il dominio prestiti va in errore e che le simulazioni locali non producono write Supabase.
- Note operative: le simulazioni temporanee devono vivere solo nello stato locale React fino a salvataggio esplicito.

### T9
- Azione: Aggiungere tutte le chiavi di localizzazione necessarie per errori, conferme, label e annunci accessibilita del dominio prestiti.
- File target: src/locales/it.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit non segnala chiavi mancanti per il nuovo namespace prestiti e i test non usano stringhe inline.
- Note operative: includere chiavi per creazione, promozione, chiusura, eliminazione simulazione, saldo negativo non ammesso e controparte mancante.

### T10
- Azione: Creare i placeholder SQL P52, P53 e P54 e aggiornare la documentazione dello schema Supabase per tabelle, indici, trigger, RPC e policy RLS del dominio.
- File target: docs/6-sql/P52-prestiti-mutui.sql, docs/6-sql/P53-rpc-rimborsi-prestiti.sql, docs/6-sql/P54-prestiti-rimborsi.sql, docs/6-sql/schema database supabase.md
- Dipende da: T2
- Metrica di successo: i tre file SQL esistono, hanno il perimetro dichiarato dal design e la documentazione di schema riflette tutte le nuove entita.
- Note operative: P53 deve documentare sia rpc_aggiungi_rimborso sia rpc_elimina_rimborso.

### T11
- Azione: Creare e completare le suite di test per loan-calculator, repository prestiti e repository prestiti-rimborsi.
- File target: __tests__/loan-calculator.test.ts, __tests__/prestiti.repository.test.ts, __tests__/prestiti-rimborsi.repository.test.ts
- Dipende da: T3, T4, T5, T6, T8
- Metrica di successo: le suite coprono tutti gli scenari obbligatori del design, inclusa la simulazione locale non persistita e i rimborsi concorrenti.
- Note operative: aggiungere anche una verifica sul riuso delle utility roundCurrency ed extractDatePart per rendere esplicita la dipendenza che sblocca 018 e 019.

## 6. Test Obbligatori

- File spec: __tests__/loan-calculator.test.ts | Scenario: tasso zero con quota interessi nulla e quota capitale costante. | Tipo: unit
- File spec: __tests__/loan-calculator.test.ts | Scenario: durata un mese con una sola rata e saldo finale zero. | Tipo: unit
- File spec: __tests__/loan-calculator.test.ts | Scenario: valori molto grandi con stabilita numerica e arrotondamento a due decimali. | Tipo: unit
- File spec: __tests__/loan-calculator.test.ts | Scenario: rifiuto di importo, tasso o durata negativi. | Tipo: unit
- File spec: __tests__/loan-calculator.test.ts | Scenario: roundCurrency mantiene coerenza tra rata, quote e totale interessi. | Tipo: unit
- File spec: __tests__/prestiti.repository.test.ts | Scenario: create salva simulazioni persistite con stato simulazione. | Tipo: unit
- File spec: __tests__/prestiti.repository.test.ts | Scenario: promote mantiene lo stesso id e ricalcola i campi derivati. | Tipo: unit
- File spec: __tests__/prestiti.repository.test.ts | Scenario: update ricalcola dataFinePrevista quando cambiano dataInizio o durataMesi. | Tipo: unit
- File spec: __tests__/prestiti-rimborsi.repository.test.ts | Scenario: addRimborso usa la RPC atomica e chiude il contratto a saldo zero. | Tipo: integration
- File spec: __tests__/prestiti-rimborsi.repository.test.ts | Scenario: un rimborso eccedente viene rifiutato e il saldo non diventa negativo. | Tipo: integration
- File spec: __tests__/prestiti-rimborsi.repository.test.ts | Scenario: rimborsi concorrenti non producono stato incoerente. | Tipo: integration
- File spec: __tests__/prestiti-rimborsi.repository.test.ts | Scenario: rollback RPC su errore senza persistenza parziale. | Tipo: integration
- File spec: __tests__/AppDataContext.spec.ts | Scenario: una simulazione locale non salvata non genera alcuna write Supabase. | Tipo: integration
- File spec: __tests__/AppDataContext.spec.ts | Scenario: una simulazione temporanea creata nello stato locale React non viene mai scritta nel database e una query diretta a Supabase conferma che nessun record con flag di simulazione attivo e stato inserito nelle tabelle prestiti o rimborsi dopo il tempo di attesa previsto. | Tipo: integration
- Scenario aggiuntivo — Non-persistenza simulazioni: verificare che l'esecuzione del flusso di simulazione temporanea non produca alcuna scrittura nel database. Il test deve chiamare il simulatore con parametri validi e poi interrogare le tabelle prestiti e transazioni verificando che il conteggio dei record non sia aumentato rispetto allo stato iniziale.

## 7. Gate di Chiusura

- G-017-1 | Verifica: tipi dominio e helper condivisi compilano correttamente. | Comando: npx tsc --noEmit | Stato iniziale: OPEN
- G-017-2 | Verifica: loan-calculator copre simulazione, arrotondamento e input invalidi. | Comando: npx jest __tests__/loan-calculator.test.ts --runInBand | Stato iniziale: OPEN
- G-017-3 | Verifica: i repository prestiti e prestiti-rimborsi rispettano mapping, RPC atomiche e promozione a id invariato. | Comando: npx jest __tests__/prestiti.repository.test.ts __tests__/prestiti-rimborsi.repository.test.ts --runInBand | Stato iniziale: OPEN
- G-017-4 | Verifica: AppDataContext integra il dominio in modalita fail-soft e non persiste simulazioni locali. | Comando: npx jest __tests__/AppDataContext.spec.ts --runInBand | Stato iniziale: OPEN
- G-017-5 | Verifica: saldoResiduo non viene mai aggiornato direttamente lato client fuori dalle RPC. | Comando: verifica manuale sul repository rimborsi prestiti e sul context dati applicativo | Stato iniziale: OPEN
- G-017-6 | Verifica: roundCurrency ed extractDatePart sono esportate dalle helper condivise e riutilizzabili dai blocchi 018 e 019 senza ridefinizione. | Comando: verifica manuale sulle helper condivise e ricerca import nei moduli consumer | Stato iniziale: OPEN
- G-017-7 | Verifica: i placeholder SQL P52, P53 e P54 e la documentazione schema risultano allineati al design. | Comando: verifica manuale su docs/6-sql e schema database supabase.md | Stato iniziale: OPEN

## 8. Rollback

- modello tipi client: ripristinare i tipi precedenti rimuovendo il dominio prestiti e simulazione.
- modello tipi Supabase: rimuovere DbPrestitoMutuo e DbPrestitoRimborso.
- helper condivise: rimuovere roundCurrency ed extractDatePart solo se nessun altro blocco successivo le sta gia consumando.
- motore di simulazione finanziaria: eliminare il file se il motore non supera i gate.
- repository prestiti: eliminare il file se il repository non supera i gate.
- repository rimborsi prestiti: eliminare il file se le RPC o l'atomicita non superano i gate.
- cache offline del dominio e snapshot cache: ripristinare chiavi e snapshot allo stato pre-dominio prestiti.
- context dati applicativo: rimuovere slice, azioni e simulazioni locali del dominio prestiti.
- registro di localizzazione italiano: rimuovere le chiavi del dominio prestiti.
- docs/6-sql/P52-prestiti-mutui.sql, docs/6-sql/P53-rpc-rimborsi-prestiti.sql, docs/6-sql/P54-prestiti-rimborsi.sql: rimuovere i placeholder se il blocco viene annullato.
- __tests__/loan-calculator.test.ts, __tests__/prestiti.repository.test.ts, __tests__/prestiti-rimborsi.repository.test.ts: eliminare le suite se il piano viene dismesso.

## 9. Riferimenti

- docs/2-projects/017-DESIGN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
- docs/3-coding-plans/018-PLAN_confronto-mese-su-mese-categoria_v0.1.0.md
- docs/3-coding-plans/019-PLAN_notifiche-budget-orchestrazione_v0.1.0.md
- helper condivise del progetto
- motore di simulazione finanziaria
- repository prestiti
- repository rimborsi prestiti
- context dati applicativo
- docs/6-sql/P52-prestiti-mutui.sql
- docs/6-sql/P53-rpc-rimborsi-prestiti.sql
- docs/6-sql/P54-prestiti-rimborsi.sql