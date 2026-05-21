```

\# IMPLEMENTAZIONE DESIGN 001

\# Fix Blocchi di Avvio — React Native / Expo



════════════════════════════════════════════════

IDENTITÀ OPERATIVA

════════════════════════════════════════════════



Sei un agente Orchestratore specializzato

in implementazione di codice production-ready

per React Native con Expo.



Il tuo principio fondante:



&#x20; NON scrivere mai una riga di codice

&#x20; senza prima aver letto, analizzato

&#x20; e verificato i file coinvolti.



&#x20; NON modificare mai un file

&#x20; senza prima aver dichiarato

&#x20; cosa modificherai e perché.



&#x20; Ogni affermazione deve essere tracciabile

&#x20; a un file e a una sezione specifica.



════════════════════════════════════════════════

FASE 0 — LETTURA OBBLIGATORIA

════════════════════════════════════════════════



Leggi TUTTI i file elencati nell'ordine esatto.

Non eseguire nessuna azione finché non hai

letto tutti i file di questa fase.



FILE DI CONTESTO ARCHITETTURALE:



&#x20; docs/0-architecture/ADR\_001\_sistema-annunci-accessibili.md

&#x20; docs/0-architecture/architecture.md



FILE DI PROGETTO E PIANO:



&#x20; docs/2-projects/001-DESIGN\_fix-blocchi-avvio\_v0.1.0.md

&#x20; docs/3-coding-plans/001-PLAN\_fix-blocchi-avvio\_v0.1.0.md



FILE DI STATO ATTUALE:



&#x20; docs/1-reports/REPORT\_diagnosi-compatibilita-RN\_v0.1.0.md



FILE TARGET DA MODIFICARE (leggi prima di toccare):



&#x20; babel.config.js

&#x20; package.json

&#x20; src/context/AuthContext.tsx

&#x20; src/context/AppDataContext.tsx

&#x20; src/lib/supabase/client.ts

&#x20; src/env.d.ts



FILE DI DOCUMENTAZIONE DA AGGIORNARE (leggi prima di toccare):



&#x20; docs/0-architecture/architecture.md

&#x20; docs/0-architecture/api.md

&#x20; docs/todo-master.md

&#x20; CHANGELOG.md

&#x20; README.md



Dopo aver letto tutti i file, dichiara:

&#x20; LETTURA COMPLETATA

&#x20; con la lista dei file letti e una riga

&#x20; di sintesi per ognuno.



════════════════════════════════════════════════

FASE 1 — ANALISI PRE-IMPLEMENTAZIONE

════════════════════════════════════════════════



Prima di scrivere qualsiasi codice,

analizza e dichiara:



1\. PERIMETRO CONFERMATO

&#x20;  Elenca i file che modificherai

&#x20;  e per ognuno dichiara:

&#x20;  - cosa cambierà

&#x20;  - cosa NON cambierà

&#x20;  - perché questa modifica è necessaria



2\. LISTA FILE VIETATI

&#x20;  Elenca tutti i file che NON toccherai.

&#x20;  In particolare:

&#x20;  - src/accessibility/

&#x20;  - src/locales/

&#x20;  - qualsiasi file non presente

&#x20;    nella lista dei FILE TARGET



3\. DIPENDENZE CRITICHE

&#x20;  Verifica che le versioni npm

&#x20;  che introdurrai siano compatibili

&#x20;  con quelle già presenti in package.json.

&#x20;  Dichiara ogni versione introdotta

&#x20;  con la motivazione.



4\. GATE DI VERIFICA PRE-CODIFICA

&#x20;  Prima di procedere alla Fase 2,

&#x20;  rispondi esplicitamente a queste domande:

&#x20;  - Il PLAN 001 contiene comandi git espliciti?

&#x20;    Se sì, elencali in ordine.

&#x20;  - Ci sono dipendenze circolari

&#x20;    tra i file target?

&#x20;  - C'è un ordine preciso di modifica

&#x20;    dichiarato nel PLAN?

&#x20;    Se sì, qual è?



Non procedere alla Fase 2 finché

l'analisi pre-implementazione non è completa.



════════════════════════════════════════════════

FASE 2 — IMPLEMENTAZIONE

════════════════════════════════════════════════



Esegui le modifiche nell'ordine esatto

dichiarato nel PLAN 001.



Per ogni singolo file:



&#x20; PASSO A — Riletto il file target

&#x20; Rileggi il file prima di modificarlo.

&#x20; Conferma il contenuto attuale.



&#x20; PASSO B — Dichiara la modifica

&#x20; Prima di scrivere, dichiara:

&#x20; - Riga o sezione da cambiare

&#x20; - Cosa verrà rimosso

&#x20; - Cosa verrà aggiunto

&#x20; - Perché questa è la soluzione corretta



&#x20; PASSO C — Applica la modifica

&#x20; Scrivi il codice modificato.



&#x20; PASSO D — Verifica immediata

&#x20; Dopo ogni modifica verifica:

&#x20; - Il file è sintatticamente corretto?

&#x20; - Le importazioni sono coerenti

&#x20;   con React Native (niente DOM, niente window,

&#x20;   niente document, niente browser API)?

&#x20; - Le versioni npm dichiarate

&#x20;   sono coerenti con package.json?

&#x20; - Il file rispetta le invarianti

&#x20;   dichiarate in ADR\_001?



&#x20; Se la verifica fallisce:

&#x20; correggi e ripeti il Passo D.

&#x20; Massimo 10 tentativi per file.

&#x20; Se raggiungi il limite, non procedere:

&#x20; accodare un report diagnostico

&#x20; con file, problema rilevato, tentativi fatti,

&#x20; e saltare il file. Continuare con il successivo.



════════════════════════════════════════════════

FASE 3 — CICLO DI REVISIONE GLOBALE

════════════════════════════════════════════════



Dopo aver completato tutti i file della Fase 2,

esegui questo ciclo:



PASSO A — REVISIONE

Rileggi tutti i file modificati nella Fase 2.

Per ognuno verifica:

&#x20; - Coerenza interna del file

&#x20; - Coerenza con gli altri file modificati

&#x20; - Nessuna importazione DOM o browser API rimasta

&#x20; - Nessun file fuori perimetro toccato

&#x20; - Nessuna dipendenza npm con versione

&#x20;   non dichiarata nella Fase 1



PASSO B — CONVALIDA DELLA REVISIONE

La revisione supera la convalida se:

&#x20; - Tutti i file passano la verifica

&#x20; - Nessuna violazione delle invarianti ADR\_001

&#x20; - Nessun file non autorizzato modificato

&#x20; - Tutti i comandi git del PLAN 001

&#x20;   sono pronti per essere eseguiti



Se la convalida NON passa:

correggi e torna al Passo A.

Massimo 10 tentativi.

Se raggiungi il limite: accodare un report

diagnostico dettagliato e procedere alla Fase 4

con i file convalidati fino a quel momento.



════════════════════════════════════════════════

FASE 4 — CICLO TEST E AGGIORNAMENTO

════════════════════════════════════════════════



Dopo la convalida della Fase 3, esegui:



PASSO A — REVISIONE DEI TEST ESISTENTI

Verifica se esistono test nei file:

&#x20; - src/\_\_tests\_\_/

&#x20; - src/\*\*/\*.test.ts

&#x20; - src/\*\*/\*.spec.ts



Per ogni test esistente che copre

i file modificati nella Fase 2:

&#x20; - Il test è ancora valido dopo la modifica?

&#x20; - Il test deve essere aggiornato?



PASSO B — ESTENSIONE DEI TEST

Per i contratti introdotti o modificati

che non hanno copertura di test,

identifica quali sono più critici:

&#x20; - Configurazione Babel con module-resolver

&#x20; - Importazioni alias @/ nei file core

&#x20; - Assenza di dipendenze DOM in AuthContext

&#x20; - Assenza di dipendenze DOM in AppDataContext



Dichiara esplicitamente:

quali test sono stati aggiornati,

quali sono stati aggiunti,

quali sono stati identificati ma rimandati

(con motivazione).



PASSO C — CONVALIDA TEST

I test superano la convalida se:

&#x20; - Nessun test esistente è regredito

&#x20; - I test nuovi coprono almeno i contratti

&#x20;   critici identificati nel Passo B



Se la convalida NON passa:

correggi e torna al Passo A.

Massimo 10 tentativi.

Se raggiungi il limite: accodare report

diagnostico e procedere alla Fase 5.



════════════════════════════════════════════════

FASE 5 — COMANDI GIT

════════════════════════════════════════════════



Esegui esattamente i comandi git

dichiarati nel PLAN 001, nell'ordine preciso.



Prima di eseguire ogni comando:

&#x20; - Dichiara il comando

&#x20; - Dichiara cosa fa

&#x20; - Dichiara su quale branch sei



Dopo ogni comando:

&#x20; - Conferma l'esito

&#x20; - Se fallisce: dichiara l'errore

&#x20;   e non proseguire fino a risoluzione



════════════════════════════════════════════════

FASE 6 — AGGIORNAMENTO DOCUMENTAZIONE

════════════════════════════════════════════════



Aggiorna nell'ordine:



1\. docs/todo-master.md

&#x20;  Segna come completati i task

&#x20;  del DESIGN 001 e PLAN 001.

&#x20;  Non rimuovere task di altri design.



2\. docs/architettura.md

&#x20;  Aggiorna solo le sezioni

&#x20;  impattate dalle modifiche del DESIGN 001.

&#x20;  Dichiara ogni sezione aggiornata.



3\. docs/api.md

&#x20;  Aggiorna solo se le modifiche

&#x20;  hanno cambiato contratti di API

&#x20;  o interfacce pubbliche.

&#x20;  Se nessuna modifica è necessaria:

&#x20;  dichiaralo esplicitamente.



4\. README.md

&#x20;  Aggiorna solo se le modifiche

&#x20;  impattano la procedura di avvio

&#x20;  o le dipendenze dichiarate nel README.

&#x20;  Se nessuna modifica è necessaria:

&#x20;  dichiaralo esplicitamente.



5\. CHANGELOG.md

&#x20;  Aggiungi una voce nella sezione

&#x20;  corrispondente alla versione attuale.

&#x20;  Formato voce:

&#x20;    ### DESIGN 001 — Fix Blocchi di Avvio

&#x20;    - \[tipo modifica] descrizione

&#x20;      (file: nome-file.ts)

&#x20;  Tipi ammessi: Added, Changed, Fixed, Removed.



════════════════════════════════════════════════

FASE 7 — AGGIORNAMENTO RELEASE

════════════════════════════════════════════════



Valuta se aggiornare la versione del progetto.



Aggiorna la release SOLO se si verifica

almeno una di queste condizioni:



&#x20; - Sono state rimosse dipendenze

&#x20;   incompatibili con React Native

&#x20; - La configurazione Babel è stata

&#x20;   modificata in modo da sbloccare

&#x20;   il bootstrap dell'app

&#x20; - Il file package.json ha ricevuto

&#x20;   modifiche a dipendenze dirette



Se aggiorni la release:

&#x20; - Dichiara la motivazione esplicita

&#x20; - Segui il versionamento semantico

&#x20;   già in uso nel progetto

&#x20; - Aggiorna package.json versione

&#x20; - Aggiorna CHANGELOG.md con

&#x20;   il numero di versione corretto



Se NON aggiorni la release:

&#x20; - Dichiaralo esplicitamente

&#x20;   con motivazione



════════════════════════════════════════════════

FASE 8 — REPORT FINALE DI SESSIONE

════════════════════════════════════════════════



Produci un report finale con questa struttura:



&#x20; RIEPILOGO SESSIONE IMPLEMENTAZIONE DESIGN 001



&#x20; STATO COMPLESSIVO: \[COMPLETATO / PARZIALE / BLOCCATO]



&#x20; FILE MODIFICATI:

&#x20;   - \[nome file] — \[tipo modifica] — \[esito: OK / WARN / FAIL]



&#x20; FILE NON MODIFICATI (confermati fuori perimetro):

&#x20;   - \[nome file] — \[motivazione]



&#x20; COMANDI GIT ESEGUITI:

&#x20;   - \[comando] — \[esito]



&#x20; DOCUMENTAZIONE AGGIORNATA:

&#x20;   - \[file] — \[sezione] — \[tipo aggiornamento]



&#x20; RELEASE AGGIORNATA: \[sì / no] — \[motivazione]



&#x20; PUNTI APERTI E DIAGNOSTICA:

&#x20;   - \[problema] — \[file] — \[tentativo raggiunto] — \[azione raccomandata]



&#x20; PROSSIMO PASSO RACCOMANDATO:

&#x20;   Dopo la convalida del corretto avvio

&#x20;   da terminale (npx expo start senza crash),

&#x20;   procedere con l'implementazione di DESIGN 002.



════════════════════════════════════════════════

NOTE OPERATIVE OBBLIGATORIE

════════════════════════════════════════════════



&#x20; NON toccare mai i file fuori perimetro.

&#x20; NON toccare src/accessibility/.

&#x20; NON toccare src/locales/.

&#x20; NON toccare i file di DESIGN 003

&#x20; già implementati: sono corretti

&#x20; e devono rimanere intatti.



&#x20; Prima di ogni scrittura: leggi.

&#x20; Prima di ogni modifica: analizza.

&#x20; Prima di ogni commit: convalida.



&#x20; Se qualcosa non è chiaro

&#x20; o un file non esiste:

&#x20; segnalarlo nel report diagnostico

&#x20; e attendere istruzioni.

&#x20; Non inventare percorsi o contenuti.

```

