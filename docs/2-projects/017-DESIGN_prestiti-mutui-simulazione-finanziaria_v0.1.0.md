---
tipo: DESIGN
titolo: "DESIGN 017 — Prestiti, Mutui e Simulazione Finanziaria"
versione: "0.1.0"
data: "2026-05-28"
stato: DRAFT
sorgente:
  - docs/2-projects/015-DESIGN_repository-notifiche-notification-service_v0.1.0.md
  - src/lib/supabase/repositories/budget.ts
  - src/lib/supabase/repositories/transazioni.ts
  - src/lib/types.ts
  - src/lib/supabase/types.ts
  - src/context/AppDataContext.tsx
  - src/lib/helpers.ts
  - src/locales/it.ts
  - src/lib/budget-alerts.ts
  - src/lib/notification-service.ts
perimetro: "Dominio prestiti, mutui e simulazione finanziaria con persistenza Supabase, RPC atomiche per i rimborsi e integrazione fail-soft nel bootstrap dati applicativo."
---

# DESIGN 017 — Prestiti, Mutui e Simulazione Finanziaria

## Sezione 2 — Contesto e motivazione

Questo documento definisce il dominio unico che copre simulazione finanziaria, contratti di mutuo o finanziamento attivi, prestiti personali tra privati e promozione da simulazione a contratto reale. La motivazione architetturale è separare in modo netto il calcolo puro, la persistenza Supabase e l'idratazione applicativa, seguendo il pattern repository già confermato in src/lib/supabase/repositories/budget.ts e mantenendo il bootstrap di AppDataContext in modalità fail-soft.

Il codice letto conferma che il progetto usa mapping snake_case/camelCase, RepositoryError come errore infrastrutturale del layer Supabase, tipi dominio in src/lib/types.ts e cache offline orchestrata da AppDataContext e src/lib/supabase/cache.ts. DESIGN 017 estende questo modello senza introdurre aggiornamenti client-side diretti del saldo residuo.

## Sezione 3 — Perimetro

In scope:
- Simulazione finanziaria interattiva per importo, tasso e durata in mesi.
- Salvataggio opzionale di simulazioni persistite con stato simulazione.
- Gestione contratti attivi di mutuo o finanziamento con piano francese.
- Gestione prestiti personali tra privati con rimborsi liberi.
- Promozione da simulazione ad attivo tramite aggiornamento del record esistente.
- Rimborsi persistiti tramite RPC atomiche Supabase.
- Slice dedicati in AppDataContext e cache offline separata per prestiti reali e simulazioni.

Fuori scope:
- Creazione automatica di righe nella tabella transazioni quando si registra un rimborso.
- Promemoria e notifiche rate in scadenza.
- Distinzione tra piano teorico e consuntivo reale del piano di ammortamento oltre i campi base del rimborso.
- Automazioni UI, componenti React Native e dettagli di layout.

## Sezione 4 — Decisioni architetturali

### Decisione 1 — Tipo limitato a mutuo_finanziamento e prestito_personale
Testo: il campo tipo ammette esclusivamente i valori mutuo_finanziamento e prestito_personale. Il valore simulazione non appartiene mai al campo tipo.

Motivazione: la natura del contratto e il suo ciclo di vita sono assi distinti. Separare tipo da stato evita ambiguità nelle query e mantiene coerente il pattern dei repository già presenti, dove ogni campo rappresenta una sola dimensione del dominio.

### Decisione 2 — Stato limitato a simulazione, attivo e chiuso
Testo: il campo stato ammette solo i valori simulazione, attivo e chiuso. Il valore simulazione appartiene al campo stato, non al campo tipo.

Motivazione: il ciclo di vita deve essere interrogabile in modo indipendente dalla tipologia contrattuale, in particolare per la promozione da simulazione ad attivo e per la chiusura automatica via RPC.

### Decisione 3 — Valuta autonoma con default EUR
Testo: il campo valuta è autonomo, con valore predefinito EUR, e non viene ereditato da eventuali conti associati.

Motivazione: il dominio prestiti deve restare indipendente dal dominio conti, coerentemente con la separazione già presente nel repository transazioni e con l'assenza di accoppiamenti automatici tra entità finanziarie diverse.

### Decisione 4 — Saldo residuo aggiornato solo tramite RPC atomiche
Testo: il saldo residuo non viene mai aggiornato direttamente dal codice TypeScript lato client. L'aggiornamento passa esclusivamente per le RPC Supabase rpc_aggiungi_rimborso e rpc_elimina_rimborso. Ogni RPC esegue in un'unica operazione atomica inserimento o eliminazione del rimborso, aggiornamento del saldo residuo e chiusura automatica del prestito quando il saldo raggiunge zero.

Motivazione: il saldo residuo è un dato derivato critico e deve essere protetto da race condition, rimborsi concorrenti e stati intermedi incoerenti. L'atomicità lato database è l'unico modo per rispettare il vincolo saldo mai negativo e rollback coerente su errore.

### Decisione 5 — Nessuna transazione automatica in versione 1
Testo: la versione 1 del design non crea automaticamente transazioni nella tabella transazioni quando viene registrato un rimborso.

Motivazione: il briefing richiede confini netti tra dominio prestiti e dominio movimenti. Il repository transazioni mostra già un perimetro chiaro; introdurre side effect cross-domain anticiperebbe un accoppiamento non ancora validato.

### Decisione 6 — Promozione tramite update del record esistente
Testo: la promozione da simulazione ad attivo avviene tramite update del record esistente. L'identificatore del record resta invariato.

Motivazione: preservare l'identità del record evita duplicazioni, semplifica cache e riferimenti ai rimborsi, e mantiene una storia coerente del contratto nel client e nel database.

### Decisione 7 — Parametri editabili al momento della promozione
Testo: in fase di promozione l'utente può modificare importo, tasso e durata; il piano viene ricalcolato prima del salvataggio.

Motivazione: una simulazione è una bozza. Consentire l'adeguamento dei parametri prima dell'attivazione rispecchia il flusso reale senza introdurre un secondo record o una copia temporanea nel database.

### Decisione 8 — Metodo francese come standard di calcolo
Testo: il calcolo per mutuo_finanziamento usa il metodo francese. La rata mensile resta costante lungo l'intera durata, mentre quota interessi e quota capitale variano per periodo.

Motivazione: il briefing impone lo standard bancario italiano ed europeo. Il motore di calcolo puro deve quindi produrre un piano deterministico, testabile e coerente con gli output persistiti nel repository.

### Decisione 9 — Arrotondamento monetario centralizzato e deterministico
Testo: ogni arrotondamento monetario usa la formula parseFloat(value.toFixed(2)) con persistenza su NUMERIC(14,2). DESIGN 017 introduce esplicitamente la utility roundCurrency in src/lib/helpers.ts e il motore loan-calculator.ts la usa in tutti i punti di calcolo monetario. DESIGN 018 e DESIGN 020 riusano la stessa utility senza ridefinirla.

Motivazione: formalizzare DESIGN 017 come punto di introduzione di roundCurrency elimina la contraddizione interna con gli scenari di test che la trattano come utility già disponibile e impedisce ridefinizioni divergenti nei design successivi. Una sola regola evita divergenze tra rata, totale interessi, piano e saldo residuo, e allinea il motore con i vincoli di colonna database.

### Decisione 10 — Simulazioni temporanee solo in stato locale React
Testo: le simulazioni temporanee non salvate esplicitamente vivono solo nello stato locale React e non vengono mai scritte nel database.

Motivazione: separare simulazioni effimere da dati persistiti riduce rumore in cache offline, evita record inutili e rende esplicito il passaggio tra prova locale e simulazione salvata.

### Decisione 11 — Cache offline separata tra reali e simulazioni
Testo: la cache offline separa prestiti reali da simulazioni e consente TTL potenzialmente differenti, con durata più breve per le simulazioni.

Motivazione: il codice letto conferma che la cache usa chiavi per tabella e TTL configurabili. Prestiti attivi e simulazioni hanno esigenze di freschezza diverse e non devono condividere lo stesso ciclo di invalidazione.

## Sezione 5 — Invariante: nessuna stringa hardcoded

Nessun messaggio visivo, nessun annuncio screen reader, nessuna label, nessun errore, nessun toast e nessun testo di conferma o dialog può essere scritto direttamente nel codice. Tutte le stringhe devono transitare da src/locales/it.ts.

Questo vale esplicitamente per:
- errori di validazione come saldo negativo non ammesso o tasso mancante;
- conferma di promozione da simulazione ad attivo;
- annunci NVDA, TalkBack e VoiceOver per creazione, modifica, chiusura ed eliminazione di prestiti;
- messaggi su categoria eliminata o controparte mancante in viste derivate del dominio.

## Sezione 6 — Schema dei tipi TypeScript

Tipi da aggiungere in src/lib/types.ts:

- LoanType: unione letterale con i valori mutuo_finanziamento e prestito_personale.
- LoanStatus: unione letterale con i valori simulazione, attivo e chiuso.
- LoanDirection: unione letterale con i valori devo e mi_devono.
- PianoAmmortamentoVoce:
  - numeroRata
  - dataScadenza
  - importoRata
  - quotaCapitale
  - quotaInteressi
  - saldoResiduo
- LoanSimulationResult:
  - rataMensile
  - totaleDaPagare
  - totaleInteressi
  - pianoAmmortamento
  - saldoResiduoAData come valore derivato opzionale quando richiesto dal motore
- PrestitoMutuo:
  - id
  - tipo
  - stato
  - direzione
  - controparteNome
  - importoIniziale
  - valuta
  - tassoAnnuo opzionale
  - durataMesi opzionale
  - rataMensile opzionale
  - totaleInteressi opzionale
  - dataInizio
  - dataFinePrevista opzionale
    - nota: campo opzionale a livello di tipo TypeScript, ma obbligatoriamente calcolato dal repository per tutti i contratti con stato attivo; viene ricalcolato automaticamente ad ogni variazione di dataInizio o durataMesi.
  - saldoResiduo
  - note opzionale
- PrestitoRimborso:
  - id
  - prestitoId
  - importo
  - dataRimborso
  - quotaCapitale opzionale
  - quotaInteressi opzionale
  - note opzionale

Tipi da aggiungere in src/lib/supabase/types.ts:

- DbPrestitoMutuo con naming snake_case coerente con DbBudget e DbTransaction.
- DbPrestitoRimborso con naming snake_case coerente con le convenzioni Db* già presenti.

Contratti repository da creare:

- src/lib/supabase/repositories/prestiti.ts:
  - getAll
  - getById
  - getAttivi
  - create
  - update
  - promote
  - close
  - deleteSimulation
- src/lib/supabase/repositories/prestiti-rimborsi.ts:
  - addRimborso tramite rpc_aggiungi_rimborso
  - deleteRimborso tramite rpc_elimina_rimborso

## Sezione 7 — Schema database

Tabella prestiti_mutui:

- id: UUID, chiave primaria, default generato automaticamente.
- user_id: UUID, obbligatorio, riferimento a auth.users, base RLS.
- tipo: TEXT, obbligatorio, valori ammessi mutuo_finanziamento e prestito_personale.
- stato: TEXT, obbligatorio, default simulazione, valori ammessi simulazione, attivo, chiuso.
- direzione: TEXT, obbligatorio, valori ammessi devo e mi_devono.
- controparte_nome: TEXT, obbligatorio.
- importo_iniziale: NUMERIC(14,2), obbligatorio.
- valuta: TEXT, obbligatorio, default EUR.
- tasso_annuo: NUMERIC(8,4), facoltativo; obbligatorio in validazione applicativa per mutuo_finanziamento.
- durata_mesi: INTEGER, facoltativo; obbligatorio in validazione applicativa per mutuo_finanziamento.
- rata_mensile: NUMERIC(14,2), facoltativo, calcolato in creazione o promozione.
- totale_interessi: NUMERIC(14,2), facoltativo.
- data_inizio: DATE, obbligatorio.
- data_fine_prevista: DATE, facoltativo, ricalcolata obbligatoriamente nel repository a ogni variazione di data_inizio o durata_mesi.
- saldo_residuo: NUMERIC(14,2), obbligatorio, inizialmente uguale a importo_iniziale; aggiornabile solo tramite RPC.
- note: TEXT, facoltativo.
- created_at: TIMESTAMPTZ, obbligatorio, default now().
- updated_at: TIMESTAMPTZ, obbligatorio, default now(), mantenuto da trigger.

Vincoli tabella prestiti_mutui:

- check su tipo.
- check su stato.
- check su direzione.
- check saldo_residuo maggiore o uguale a zero.
- check importo_iniziale maggiore di zero.
- check rata_mensile, totale_interessi e tasso_annuo non negativi quando valorizzati.

Tabella prestiti_rimborsi:

- id: UUID, chiave primaria, default generato automaticamente.
- prestito_id: UUID, obbligatorio, riferimento a prestiti_mutui, cancellazione a cascata.
- user_id: UUID, obbligatorio, riferimento a auth.users, RLS attiva.
- importo: NUMERIC(14,2), obbligatorio.
- data_rimborso: DATE, obbligatorio.
- quota_capitale: NUMERIC(14,2), facoltativo.
- quota_interessi: NUMERIC(14,2), facoltativo.
- note: TEXT, facoltativo.
- created_at: TIMESTAMPTZ, obbligatorio, default now().

Vincoli tabella prestiti_rimborsi:

- check importo maggiore di zero.
- check quota_capitale e quota_interessi non negative quando valorizzate.
- check sulla coerenza utente tra rimborso e prestito applicato via RPC e policy.

nota architetturale: la tabella prestiti_rimborsi non prevede il campo updated_at né un trigger di aggiornamento. Questa è una scelta intenzionale. I rimborsi sono record immutabili per natura: una volta registrato, un rimborso non viene mai modificato, solo eliminato tramite la RPC atomica rpc_elimina_rimborso. Il campo created_at è sufficiente per il ciclo di vita del record. Aggiungere updated_at per simmetria con le altre tabelle introdurrebbe rumore semantico e falsa l'impressione che i record siano modificabili.

Indici obbligatori:

- indice su prestiti_mutui per user_id.
- indice composito su prestiti_mutui per user_id e stato.
- indice su prestiti_rimborsi per prestito_id.
- indice su prestiti_rimborsi per data_rimborso in ordine decrescente.

Trigger e procedure:

- trigger updated_at su prestiti_mutui.
- rpc_aggiungi_rimborso per inserimento atomico rimborso, aggiornamento saldo residuo e chiusura automatica.
- rpc_elimina_rimborso per eliminazione atomica rimborso, ripristino saldo residuo coerente e riapertura dello stato se necessario.

Policy RLS:

- SELECT, INSERT, UPDATE, DELETE su prestiti_mutui limitate a user_id uguale a auth.uid().
- SELECT, INSERT, DELETE su prestiti_rimborsi limitate a user_id uguale a auth.uid().
- le RPC validano sempre la titolarità del record prima di mutare saldo_residuo.

## Sezione 8 — File da creare e file da modificare

File da creare:

- src/lib/loan-calculator.ts — nuovo motore di calcolo puro senza effetti collaterali per rata mensile, piano di ammortamento, totale interessi e saldo residuo a data.
- src/lib/supabase/repositories/prestiti.ts — nuovo repository per prestiti_mutui, modellato sul pattern reale visto in src/lib/supabase/repositories/budget.ts.
- src/lib/supabase/repositories/prestiti-rimborsi.ts — nuovo repository per prestiti_rimborsi con passaggio obbligatorio attraverso RPC atomiche per le mutazioni.
- docs/6-sql/P52-prestiti-mutui.sql — placeholder provvisorio per la migrazione SQL della tabella prestiti_mutui con indici, trigger updated_at e policy RLS.
- docs/6-sql/P53-rpc-rimborsi-prestiti.sql — placeholder provvisorio per la migrazione SQL delle RPC atomiche rpc_aggiungi_rimborso e rpc_elimina_rimborso.
- docs/6-sql/P54-prestiti-rimborsi.sql — placeholder provvisorio per la migrazione SQL della tabella prestiti_rimborsi con indici e policy RLS.
- __tests__/loan-calculator.test.ts — nuova suite per il motore di calcolo.
- __tests__/prestiti.repository.test.ts — nuova suite per il repository prestiti.
- __tests__/prestiti-rimborsi.repository.test.ts — nuova suite per repository rimborsi e atomicità RPC.

File da modificare:

- src/lib/types.ts — aggiunta dei nuovi tipi dominio prestiti e simulazione.
- src/lib/supabase/types.ts — aggiunta di DbPrestitoMutuo e DbPrestitoRimborso.
- src/context/AppDataContext.tsx — aggiunta degli slice prestiti e rimborsiPrestiti con idratazione fail-soft coerente con il bootstrap esistente.
- src/context/app-data-cache.ts — aggiunta di snapshot e lettura cache per prestiti e rimborsi, con distinzione prestiti reali e simulazioni.
- src/lib/supabase/cache.ts — registrazione nuove chiavi cache e TTL differenziati.
- src/locales/it.ts — aggiunta di chiavi per messaggi, label, annunci accessibilità, errori e conferme del dominio.
- docs/6-sql/schema database supabase.md — aggiornamento della documentazione di schema con tabelle, indici e RPC del dominio prestiti.

## Sezione 9 — Scenari di test obbligatori

1. Tasso zero: la rata coincide con quota capitale costante e totale interessi pari a zero.
2. Durata un mese: il piano contiene una sola rata e saldo finale zero.
3. Valori molto grandi: il motore mantiene stabilità numerica e arrotondamenti a due decimali.
4. Valori negativi non validi: input con importo, tasso o durata negativi sono rifiutati.
5. Arrotondamento: rata, quote e totale interessi rispettano roundCurrency e non divergono dal totale persistito.
6. Estinzione anticipata: un rimborso che porta il saldo a zero chiude automaticamente il contratto.
7. Saldo mai negativo: RPC rifiuta un rimborso eccedente il saldo residuo.
8. Rimborsi concorrenti: operazioni simultanee non producono saldo incoerente.
9. Rollback su errore: se la RPC fallisce nessun rimborso parziale resta persistito.
10. Isolamento tra utenti: un utente non vede né modifica prestiti o rimborsi di altri utenti.
11. Promozione da simulazione ad attivo: il record mantiene lo stesso id, aggiorna stato e ricalcola i campi derivati.
12. Ricalcolo data_fine_prevista: ogni modifica di data_inizio o durata_mesi aggiorna la scadenza prevista nel repository.
13. Simulazione locale non persistita: una simulazione creata solo nello stato React e mai salvata esplicitamente non genera alcuna write verso Supabase; fino al salvataggio esplicito non deve partire nessuna chiamata ai repository prestiti o prestiti-rimborsi.

## Sezione 10 — Dipendenze da altri design

Precondizioni obbligatorie:

- Coerenza con il pattern repository già osservato nel codice reale.
- Disponibilità di src/locales/it.ts come unico registro di stringhe utente.
- Presenza dell'infrastruttura cache usata da AppDataContext e src/lib/supabase/cache.ts.

Indipendenze confermate:

- Il dominio non dipende dal repository transazioni per registrare rimborsi nella versione 1.
- Il motore loan-calculator.ts è puro e non dipende da Supabase o React.

Confini con altri design:

- Mantiene separazione rispetto al dominio movimenti esistente.
- Prepara un'integrazione futura con notifiche, ma non la implementa.
- Non modifica le decisioni del design notifiche già presente in docs/2-projects/015-DESIGN_repository-notifiche-notification-service_v0.1.0.md.

## Sezione 11 — Debiti tecnici aperti

- DT-017-01 — Separazione futura tra piano teorico di ammortamento e pagamenti reali effettivi. Priorità: media. Stato: aperto.
- DT-017-02 — Collegamento opzionale futuro tra rimborso registrato e transazione nel conto corrente. Priorità: bassa. Stato: aperto.
- DT-017-03 — Promemoria e notifiche per rate in scadenza e prestiti personali fermi, da collegare al sistema notifiche esistente in un design successivo. Priorità: bassa. Stato: aperto.