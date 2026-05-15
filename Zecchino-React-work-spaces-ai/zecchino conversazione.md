```markdown

\# TODO-MASTER.md



\---



\## 1. Metadata e Context Header



\- \*\*Project Name:\*\* \[Nome univoco del progetto]

\- \*\*Version:\*\* \[SemVer — es. 0.1.0]

\- \*\*Owner:\*\* \[Nome dell'architetto responsabile]

\- \*\*Core Technology Stack:\*\* \[es. React Native, Supabase, TypeScript, Expo]

\- \*\*Environment Sync:\*\* \[Specificare se l'agente opera su: Local / Staging / Production]

\- \*\*Ultimo Agente Attivo:\*\* \[Nome o ID dell'agente che ha lavorato per ultimo — es. Copilot-Agent-01]

\- \*\*Blocco in Carico:\*\* \[ID del blocco che l'agente stava eseguendo — es. B2.3]

\- \*\*Context Refresh Threshold:\*\* Se la sessione supera i 40 layout di prompt o i 50.000 token, l'agente deve eseguire un riassunto dello Snapshot di Ripresa e riavviare la sessione per svuotare la memoria cache, evitando la perdita di contesto delle direttive primarie.



\### Stato Globale Corrente



\- \*\*Active Phase:\*\* \[es. Phase 2 — Fix Provider Bootstrap]

\- \*\*Active Block:\*\* \[es. B2.1 — N11 tsconfig cleanup]

\- \*\*Last Updated:\*\* \[YYYY-MM-DD HH:MM]



\### Mappa Documentale



\- \*\*Design Docs:\*\* \[path relativo — es. /docs/design/]

\- \*\*Coding Plans:\*\* \[path relativo — es. /docs/coding-plans/]

\- \*\*Todo per Piano:\*\* \[path relativo — es. /docs/todos/]

\- \*\*Test Suites:\*\* \[path relativo — es. /tests/]

\- \*\*Architecture Decisions:\*\* \[path relativo — es. /docs/adr/]



\---



\## 2. Snapshot di Ripresa (Session Snapshot)



> Questa sezione viene aggiornata al termine di ogni sessione di lavoro.

> Permette la ripresa immediata senza esplorazione manuale dello stato.



\- \*\*Last Completed Task:\*\* \[ID e descrizione dell'ultimo task completato e validato — es. T1.2.3 — Aggiunto plugin module-resolver a babel.config.js]

\- \*\*Last Validated Block:\*\* \[ID del blocco il cui gate è stato superato — es. B1.1]

\- \*\*Files Modified But Not Validated:\*\* \[lista dei file toccati nell'ultima sessione ma non ancora coperti da un gate — es. src/context/AuthContext.tsx, src/env.d.ts]

\- \*\*Open Threads:\*\* \[problemi o decisioni rimaste in sospeso — es. "Verificare compatibilità onKeyDown su RN Windows prima di procedere con N6"]

\- \*\*Next Action:\*\* \[prima azione da eseguire alla ripresa — deve essere atomica e non interpretabile — es. "Eseguire npx tsc --noEmit e verificare che compaiano errori su document.addEventListener in use-inactivity-timer.ts"]



\---



\## 3. Definizione delle Fasi



Per ogni fase del progetto compilare un blocco separato con questa struttura.



\---



\### Phase ID: \[es. P1]



\- \*\*Phase Title:\*\* \[es. Fix Blocchi di Avvio]

\- \*\*Phase Objective:\*\* \[descrizione dello stato finale atteso — es. "L'app si avvia su Metro senza errori di risoluzione moduli. Nessun crash sincrono al primo import."]

\- \*\*Entry Conditions:\*\* \[cosa deve essere vero prima di aprire questa fase — es. "Dipendenze npm installate. File .env presente con valori placeholder."]

\- \*\*Exit Conditions — Global Gate:\*\* \[standard di qualità che devono essere superati per dichiarare la fase chiusa — es. "npm start avvia Metro senza errori. npx tsc --noEmit non riporta errori sui moduli B1–B6."]

\- \*\*Estimated Blocks:\*\* \[numero indicativo di blocchi operativi]

\- \*\*Phase Status:\*\* \[ ] TODO / \[/] WIP / \[X] DONE



\---



\## 4. Struttura dei Blocchi Operativi



Per ogni blocco all'interno di una fase compilare un blocco separato con questa struttura.



\---



\### Block ID: \[es. B1.1]



\- \*\*Block Title:\*\* \[es. Fix alias @/\* e variabili .env]

\- \*\*Parent Phase:\*\* \[es. P1]

\- \*\*Reference Documents:\*\* \[lista dei file di design e coding plan associati — es. 001-DESIGN\_fix-blocchi-avvio\_v0\_1\_0.md, 001-CODING-PLAN\_fix-blocchi-avvio.md]

\- \*\*Technical Scope:\*\* \[ambito d'azione esplicito e limitato — es. "Solo babel.config.js e package.json. Nessuna modifica a file src/."]

\- \*\*Block Status:\*\* \[ ] TODO / \[/] WIP / \[X] DONE



\#### Mappa delle Dipendenze



\- \*\*Depends On:\*\* \[ID dei blocchi che devono essere completati E validati prima — es. "Nessuno — primo blocco"]

\- \*\*Unlocks:\*\* \[ID dei blocchi che diventano disponibili al completamento — es. B1.2, B1.3]



\#### Dry Run Check

\- \*\*BXX.X - Verification:\*\* Prima di eseguire il Task 1, l'agente deve verificare che tutti i file target elencati nella Atomic Task List esistano (o sia esplicitata la loro creazione nel blocco corrente) e siano accessibili in scrittura. Se un file è bloccato o mancante fuori dal piano, attiva immediatamente la Halt Condition senza alterare il codice.



\#### Atomic Task List



Per ogni task nel blocco:



\---



\##### Task ID: \[es. T1.1.1]



\- \*\*Action:\*\* \[azione atomica in forma imperativa, non interpretabile — es. "Aggiungi il plugin 'module-resolver' al campo plugins di babel.config.js seguendo la struttura definita in 001-DESIGN\_fix-blocchi-avvio\_v0\_1\_0.md sezione 2."]

\- \*\*Target Files:\*\* \[lista esatta dei file da creare o modificare — es. babel.config.js]

\- \*\*Depends On:\*\* \[ID dei task che devono precedere questo — es. "Nessuno"]

\- \*\*Success Metric:\*\* \[risultato atteso verificabile — es. "npm start non produce errori 'Unable to resolve module @/...' nel log Metro."]

\- \*\*Task Status:\*\* \[ ] TODO / \[/] WIP / \[X] DONE



\---



\#### Block Gate



Procedura di validazione obbligatoria prima di procedere al blocco successivo.



\- \*\*Validation Steps:\*\*

&#x20; 1. \[Comando o verifica da eseguire — es. "Eseguire npm install"]

&#x20; 2. \[es. "Eseguire npx tsc --noEmit"]

&#x20; 3. \[es. "Eseguire npm start e osservare il log Metro"]

\- \*\*Expected Outputs:\*\*

&#x20; 1. \[Output atteso per ogni step — es. "Exit code 0, nessun errore in node\_modules"]

&#x20; 2. \[es. "Nessun errore TS2307 sui moduli sonner o @/components/ui/button"]

&#x20; 3. \[es. "Metro avvia senza errori di risoluzione moduli"]

\- \*\*Gate Status:\*\* \[ ] OPEN / \[X] PASSED / \[!] FAILED



\---



\## 5. Protocollo di Gestione Errori



\### Conflict Resolution



Istruzioni operative per i casi in cui un task entra in conflitto con codice o stato esistente.



\- \*\*Priority Rule:\*\* Il codice esistente validato ha precedenza assoluta. Non sovrascrivere file validati senza escalation verso l'architetto.

\- \*\*Safe Actions:\*\* Azioni che l'agente può eseguire autonomamente per risolvere conflitti minori — es. rinominare file duplicati aggiungendo suffisso `\_bak`, aggiungere commenti TODO nel codice per segnalare aree da rivedere.

\- \*\*Forbidden Actions:\*\* Azioni che l'agente non può mai eseguire in autonomia:

&#x20; - Eliminare file o dati

&#x20; - Modificare file fuori dal Technical Scope del blocco attivo

&#x20; - Procedere al blocco successivo se il gate corrente è FAILED

&#x20; - Interpretare un requisito ambiguo senza chiedere chiarimento



\### Security \& Privacy Constraints



Regole mandatorie per la gestione dei dati e del codice.



\- \*\*Data Privacy:\*\* Mai inserire valori numerici reali, nomi utente o dati sensibili nei log di debug o nei commenti del codice.

\- \*\*Validation Logic:\*\* Ogni funzione di calcolo finanziario deve includere test obbligatori per la gestione dei decimali e l'arrotondamento.

\- \*\*Credential Handling:\*\* Mai scrivere API Key o segreti direttamente nei file sorgente. Usare esclusivamente variabili d'ambiente o il modulo `@env`.

\- \*\*Database Transactionality:\*\* Tutti i task che comportano la modifica di schemi o dati su Supabase devono essere eseguiti tramite transazioni isolate o script di migrazione controllati. È fatto divieto di eseguire mutazioni dirette sul database che non possano essere annullate in sicurezza dalle procedure di Rollback.



\### Halt Conditions



Casi in cui l'agente deve interrompere l'autonomia e richiedere intervento dell'architetto.



1\. Un task produce un output diverso dal Success Metric dopo due tentativi consecutivi.

2\. Un file target non esiste e la sua creazione non è prevista nel piano.

3\. Un gate fallisce per ragioni non coperte dal Conflict Resolution.

4\. Emergono dipendenze non dichiarate che coinvolgono moduli fuori scope.

5\. Il rollback di livello 2 (vedi sezione 8) non ripristina uno stato pulito dopo due tentativi.

6\. Viene rilevata una contraddizione tra due documenti di riferimento (es. il design doc dice una cosa, il coding plan dice un'altra).



\### Escalation Format



Formato standard del messaggio di escalation verso l'architetto. Da usare ogni volta che si raggiunge una Halt Condition.





```



HALT — \[Task ID o Block ID]

Motivo: \[descrizione in una riga del problema]

Halt Condition attivata: \[numero della condizione — es. HC-1]

Stato al momento dell'halt: \[cosa era stato completato, cosa era in corso]

File coinvolti: \[lista dei file toccati prima dell'halt]

Opzioni identificate: \[1-3 opzioni concrete con pro e contro]

Decisione richiesta: \[domanda specifica a cui l'architetto deve rispondere per sbloccare]



```



\---



\## 6. Registro di Stato (State Ledger)



Panoramica dello stato globale di tutti i blocchi e task. Aggiornare dopo ogni task completato.



| ID | Titolo | Status | Gate |

|----|--------|--------|------|

| B1.1 | \[Titolo blocco] | \[ ] TODO | \[ ] OPEN |

| B1.2 | \[Titolo blocco] | \[ ] TODO | \[ ] OPEN |

| B2.1 | \[Titolo blocco] | \[ ] TODO | \[ ] OPEN |



\### Log di Validazione



Per ogni gate superato aggiungere una riga.



| Data | Block ID | Validato Da | Risultato | Note |

|------|----------|-------------|-----------|------|

| YYYY-MM-DD | B1.1 | \[es. Copilot-Agent / Architetto] | \[es. 3/3 step superati] | \[eventuali anomalie minori non bloccanti] |



\---



\## 7. Archivio Decisioni (Decision Log)



Per ogni deviazione dal piano originale o scelta architetturale rilevante.



\---



\### Decision ID: \[es. ADR-001]



\- \*\*Date:\*\* \[YYYY-MM-DD]

\- \*\*Context:\*\* \[situazione che ha reso necessaria la decisione — es. "Il perimetro di B2 non includeva client.ts, ma la modifica è indispensabile per risolvere B2."]

\- \*\*Decision:\*\* \[cosa è stato deciso]

\- \*\*Alternatives Discarded:\*\* \[opzioni valutate e scartate con motivazione sintetica]

\- \*\*Consequences:\*\* \[impatto atteso sulla struttura del progetto o sui blocchi successivi]

\- \*\*Triggered By:\*\* \[es. Gate fallito su B1.2 / Richiesta architetto / Conflict Resolution]



\---



\## 8. Protocollo di Rollback



> Questa sezione definisce come l'agente deve comportarsi quando qualcosa va storto e occorre tornare indietro.

> Esistono tre livelli di rollback. L'agente deve sempre partire dal livello più basso possibile.



\### Livello 1 — Rollback di Task (danno limitato a un singolo file)



Si usa quando un singolo task produce un risultato sbagliato ma il problema è circoscritto al file target di quel task.



\*\*Quando applicarlo:\*\* il Success Metric del task non è soddisfatto e il file target è l'unico coinvolto.



\*\*Procedura:\*\*

1\. Annullare le modifiche al file target (ripristino dalla versione precedente via git o sovrascrittura manuale).

2\. Segnare il task come FAILED nel registro di stato.

3\. Rimanere nel blocco corrente — non retrocedere al blocco precedente.

4\. Rieseguire il task da zero seguendo le istruzioni del coding plan.

5\. Se il task fallisce una seconda volta, attivare la Halt Condition HC-1 e inviare il messaggio di escalation.



\*\*Limite di autonomia:\*\* l'agente può eseguire il rollback di livello 1 in autonomia per un massimo di 2 tentativi.



\---



\### Livello 2 — Rollback di Blocco (gate fallito dopo più task completati)



Si usa quando il gate di un blocco fallisce e il danno potrebbe coinvolgere più file modificati durante quel blocco.



\*\*Quando applicarlo:\*\* il gate del blocco è FAILED e non è possibile identificare un singolo task come causa isolata.



\*\*Procedura:\*\*

1\. Documentare nello Snapshot di Ripresa tutti i file toccati durante il blocco, con lo stato di ognuno prima e dopo le modifiche.

2\. Annullare le modifiche a tutti i file del blocco, tornando allo stato in cui si trovavano all'apertura del blocco.

3\. Segnare il blocco come FAILED e il gate come FAILED nel registro di stato.

4\. Rileggere integralmente il documento di design e il coding plan associati al blocco prima di ricominciare.

5\. Rieseguire il blocco dall'inizio, task per task.

6\. Se il gate fallisce una seconda volta, attivare la Halt Condition HC-3 e inviare il messaggio di escalation.



\*\*Limite di autonomia:\*\* l'agente può eseguire il rollback di livello 2 in autonomia per un massimo di 1 tentativo.



\---



\### Livello 3 — Rollback Inter-Blocco (il problema ha radici in un blocco già validato)



Si usa quando il fallimento non è causato dal blocco corrente ma da un errore in un blocco precedente che aveva già superato il gate.



\*\*Quando applicarlo:\*\* l'analisi del fallimento rivela che la causa è in codice prodotto da un blocco precedente già marcato DONE/PASSED.



\*\*Procedura:\*\*

1\. L'agente non può procedere in autonomia. Si ferma immediatamente.

2\. Documentare nello Snapshot di Ripresa: quale blocco precedente è probabilmente la causa, quale evidenza lo suggerisce, quali file sono coinvolti.

3\. Segnare il blocco corrente come FAILED — BLOCKED nel registro di stato.

4\. Inviare il messaggio di escalation con Halt Condition HC-3, specificando il blocco precedente sospettato e le conseguenze attese se venisse modificato.

5\. Attendere istruzione esplicita dell'architetto prima di toccare qualsiasi file.



\*\*Limite di autonomia:\*\* zero. Questo livello richiede sempre intervento umano.



\---



\### Punto di Non Ritorno



Alcune operazioni, una volta eseguite, non possono essere disfatte con sicurezza. Prima di eseguirle l'agente deve ottenere conferma esplicita dell'architetto, indipendentemente da quanto il piano sembri chiaro.



Queste operazioni includono:

\- Eliminazione di file o directory (anche se prevista dal piano)

\- Modifica di file di configurazione che influenzano l'intero progetto (es. package.json, babel.config.js, tsconfig.json)

\- Qualsiasi operazione su database reale (non placeholder)

\- Rinomina di file importati da più moduli



\*\*Formato di richiesta conferma:\*\*





```



CONFERMA RICHIESTA — \[Task ID]

Operazione: \[descrizione dell'operazione irreversibile]

File o risorse coinvolte: \[lista]

Motivo per cui è irreversibile: \[spiegazione in una riga]

Istruzione del piano che la richiede: \[riferimento al documento e sezione]

Confermare con: "PROCEDI \[Task ID]"



```



\---



\## 9. Glossario Operativo



Definizioni dei termini usati in questo documento per evitare interpretazioni ambigue da parte degli agenti.



| Termine | Definizione |

|---------|-------------|

| \*\*Task atomico\*\* | Un'azione che modifica uno e un solo file e produce un risultato verificabile in modo diretto. |

| \*\*Gate\*\* | Procedura di verifica obbligatoria al termine di un blocco. Un blocco non è concluso finché il gate non è PASSED. |

| \*\*Blocco validato\*\* | Un blocco il cui gate è stato superato e che è stato marcato DONE. Non può essere modificato senza rollback di livello 3. |

| \*\*Scope\*\* | L'insieme esplicito di file e operazioni consentite in un blocco. Qualsiasi modifica fuori scope è una Forbidden Action. |

| \*\*Escalation\*\* | Comunicazione formale verso l'architetto che sospende l'autonomia dell'agente. |

| \*\*Punto di non ritorno\*\* | Operazione irreversibile che richiede conferma esplicita prima dell'esecuzione. |

| \*\*Snapshot di Ripresa\*\* | Registro dello stato aggiornato a fine sessione che permette la ripresa senza esplorazione manuale. |



```

