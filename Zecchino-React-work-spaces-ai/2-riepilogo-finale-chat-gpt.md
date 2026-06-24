fatto il giro del mio consiglio ai, facendo analizzare il rapporto di perplexity. ti incollo tutti i rapporti dei tuoi colleghi, esegui un analisi complessiva finale integrando le osservazioni dei tuoi colleghi alle tue, ed elabora un rapporto finale completo da restituire a perplexity. mostramelo in chat. 

Repository di riferimento da leggere:
https://github.com/donato81/ZecchinoReact

---

report di perplexity:
Ho letto tutti e tre i file nella loro interezza. Ecco il report completo.

***

# REPORT DI REVISIONE TECNICA — CODING PLANS 017, 018, 019
**Data:** 2026-05-29
**Preparato da:** Perplexity AI su incarico del Project Owner
**Oggetto:** Seconda analisi dei file PLAN dopo revisione degli agenti — valutazione di chiusura
**Repository:** [github.com/donato81/ZecchinoReact](https://github.com/donato81/ZecchinoReact)
**SHA analizzati:**
- PLAN 017: dee1574f6df825d320ff1dcedeebaa73a74d27b4
- PLAN 018: 17eb7465ea2fe3a66a22c66961cd026753514a5f
- PLAN 019: 274eba4515b3f70faf010b11f4f1a7dc964af0ae

***

## NOTA METODOLOGICA

Questo report nasce dalla lettura integrale dei tre file committati. Per ciascun PLAN viene verificata la completezza strutturale, la coerenza interna, la coerenza cross-documento e la corrispondenza con le anomalie segnalate nel report precedente del 2026-05-29 mattina. I tre file recano già stato REVIEWED nel frontmatter, ma questo report valuta se tale stato è giustificato dai contenuti effettivi.

***

## PLAN 017 — Prestiti, Mutui e Simulazione Finanziaria

**Dimensione:** 15.482 caratteri
**Stato dichiarato nel frontmatter:** REVIEWED

### Risoluzione delle anomalie precedenti

Anomalia 017-A1 — Proprietà di roundCurrency e extractDatePart: RISOLTA COMPLETAMENTE.
Il documento ora dichiara esplicitamente nel Perimetro Sezione 2 che PLAN 017 è il proprietario di entrambe le funzioni, che vengono introdotte in helpers.ts, e che i PLAN 018, 019 e successivi le riutilizzano senza ridefinirle. La stessa dichiarazione è ribadita nella Decisione 3 e nel Task T3. La catena di proprietà è ora tracciabile senza ambiguità.

Anomalia 017-A2 — Numeri di migrazione SQL mancanti: PARZIALMENTE RISOLTA, con nota da considerare.
Il documento ora dichiara P52, P53 e P54 in modo esplicito nella sezione Perimetro e nel Task T10. Tuttavia, nel Task T6, i numeri RPC specifici per rpc_aggiungi_rimborso e rpc_elimina_rimborso sono ancora indicati come placeholder P_017_01 e P_017_02 con istruzione di aggiornamento al momento dell'implementazione. Questo è accettabile come scelta consapevole di rinvio, ma il documento avrebbe dovuto formalizzare chi ha la responsabilità di aggiornare quei placeholder durante l'implementazione: l'agente che esegue T6 oppure il revisore finale. Raccomandazione residua: aggiungere una nota nel Task T6 che assegna esplicitamente la responsabilità di aggiornamento al task stesso durante l'esecuzione.

Anomalia 017-A3 — Test di non-persistenza simulazioni temporanee: RISOLTA COMPLETAMENTE.
La sezione Test Obbligatori ora contiene due scenari distinti e complementari: il primo verifica l'assenza di write Supabase durante la simulazione locale, il secondo aggiunge la verifica tramite query diretta sulla tabella. Il Gate G-017-4 referenzia entrambi. La copertura è adeguata.

### Nuove osservazioni sulla versione attuale

Osservazione 017-N1 — Il Gate G-017-5 richiede verifica manuale senza strumento automatizzato.
Il gate che verifica che saldoResiduo non venga mai aggiornato direttamente lato client è classificato come verifica manuale. Per un invariante così critico è auspicabile che i test di integrazione per il repository rimborsi coprano anche un tentativo di update diretto del saldo, che deve fallire o essere rigettato. Questa non è un'anomalia bloccante ma un miglioramento qualitativo raccomandato.

Osservazione 017-N2 — Il Rollback per roundCurrency e extractDatePart contiene una condizione da interpretare.
La sezione Rollback specifica di rimuovere le utility solo se nessun altro blocco successivo le sta già consumando. Questa condizione di rollback dipende da una verifica esterna che non è automatizzabile. È un approccio corretto ma richiede che l'agente che esegue il rollback abbia consapevolezza dello stato dei blocchi 018 e 019.

**Esito PLAN 017:** CONFERMATO REVIEWED. Le anomalie bloccanti precedenti sono state risolte. Le osservazioni residue sono migliorative e non impediscono la chiusura.

***

## PLAN 018 — Confronto Mese su Mese per Categoria

**Dimensione:** 9.442 caratteri
**Stato dichiarato nel frontmatter:** REVIEWED
**Dipendenze dichiarate nel frontmatter:** PLAN 017
**Dipendenti dichiarati nel frontmatter:** PLAN 019

### Risoluzione delle anomalie precedenti

Anomalia 018-A1 — extractDatePart non aveva un proprietario dichiarato: RISOLTA COMPLETAMENTE.
Il documento ora chiarisce nella sezione Perimetro che extractDatePart è definita e introdotta in PLAN 017, che questo PLAN la importa e la utilizza, e che non deve essere ridefinita. Il Gate G-018-4 riflette questa dipendenza. La Decisione 4 e il Task T2 confermano la stessa posizione in modo coerente e ripetuto.

Anomalia 018-A2 — Caso base zero non specificato: RISOLTA COMPLETAMENTE.
La Decisione 6 ora contiene una dichiarazione esplicita e dettagliata: se il valore del mese di riferimento per una categoria è zero, differenzaPercentuale viene restituito null, e il componente consumer deve trattare null come assenza di confronto disponibile. La specifica esclude esplicitamente Infinity, NegativeInfinity, NaN e undefined. Il test corrispondente è presente nella sezione Test Obbligatori.

Anomalia 018-A3 — Dipendenza verso PLAN 019 non dichiarata: RISOLTA COMPLETAMENTE.
Il frontmatter ora include il campo dipendenti con valore PLAN 019. La sezione Riferimenti include il link al PLAN 019. La catena bidirezionale è ora documentata.

### Nuove osservazioni sulla versione attuale

Osservazione 018-N1 — La sezione Perimetro contiene una voce di file che descrive una funzione non di competenza del PLAN.
Nella sezione 2 Perimetro, sotto la voce del modello tipi client, appare il testo: "src/lib/helpers.ts - questo file riceve l'aggiunta della funzione extractDatePart". Questa descrizione è fuorviante perché PLAN 017, non PLAN 018, è il proprietario dell'aggiunta a helpers.ts. Il testo successivo corregge l'equivoco specificando di non ridefinire, ma la struttura della voce può generare confusione per un agente che legge solo la lista dei file target senza leggere le note. Raccomandazione: riscrivere quella voce in modo che sia chiaro che helpers.ts è citato come dipendenza da consumare, non come file da modificare da parte di PLAN 018.

Osservazione 018-N2 — Il numero minimo di scenari obbligatori nel Task T5 è allineato con i test dichiarati.
Il Task T5 richiede almeno 12 scenari. La sezione Test Obbligatori ne elenca esattamente 12. La coerenza è verificata e positiva.

**Esito PLAN 018:** CONFERMATO REVIEWED con una raccomandazione editoriale residua sulla voce helpers.ts nel Perimetro, che non è bloccante per l'implementazione ma può generare confusione agli agenti.

***

## PLAN 019 — Notifiche Budget e Orchestrazione

**Dimensione:** 14.648 caratteri
**Stato dichiarato nel frontmatter:** REVIEWED
**Dipendenze dichiarate nel frontmatter:** PLAN 015, PLAN 017

### Risoluzione delle anomalie precedenti

Anomalia 019-A1 — Contraddizione tra PLAN 017 e PLAN 019 sulle notifiche rate prestiti: RISOLTA COMPLETAMENTE.
La sezione Fuori Perimetro contiene ora una Nota di Allineamento con DESIGN 017 che dichiara esplicitamente l'esclusione delle notifiche per le rate dei prestiti dalla versione 1, con motivazione che richiama il perimetro v1 di DESIGN 017. La nota aggiunge un'istruzione operativa diretta all'agente implementatore: ignorare la sezione fino a esplicita revisione del perimetro. Questo è un esempio eccellente di documentazione difensiva che risolve il conflitto senza cancellare la traccia della feature futura.

Anomalia 019-A2 — Soglie hardcoded: RISOLTA COMPLETAMENTE.
La Decisione 2 introduce BUDGET_ALERT_THRESHOLD_WARNING e BUDGET_ALERT_THRESHOLD_CRITICAL come costanti nominate con valori default dichiarati, in un file dedicato src/lib/budget-notification-config.ts. I Task T1 e T4 ribadiscono l'obbligo. Il Gate G-019-1 verifica la centralizzazione. La soglia di superamento al 100% è anch'essa nominata. La soluzione è corretta, configurabile in futuro e non introduce accoppiamenti.

Anomalia 019-A3 — Mancanza del meccanismo di deduplicazione: RISOLTA COMPLETAMENTE.
La Decisione 3 ora contiene una specifica dettagliata del meccanismo di deduplicazione a due livelli. Il registro in-memory è indicizzato per tipo più identificatore. Il reset avviene alla chiusura dell'app. Le notifiche di errore sono esplicitamente escluse dal meccanismo. Il Task T4 aggiunge la specifica della chiave composita tipo_notifica più id_budget più mese_anno in formato YYYY-MM e richiede che la logica di deduplicazione sia implementata come funzione pura e testabile separatamente. I test nella sezione Test Obbligatori coprono deduplicazione runtime, idempotenza mensile e invalidazione al cambio mese.

Anomalia 019-A4 — Budget eliminato con notifica pendente non specificato: RISOLTA COMPLETAMENTE.
Il Task T5 nella sezione Casi Limite dichiara esplicitamente il comportamento: l'orchestratore rimuove la notifica pendente dallo stato al momento della rilevazione dell'eliminazione, la rimozione è silenziosa e non genera errori. Il testo specifica anche che nessuna notifica riferita a un budget inesistente deve essere mostrata.

### Nuove osservazioni sulla versione attuale

Osservazione 019-N1 — La dipendenza da PLAN 018 non è dichiarata nel frontmatter, il che è coerente con il perimetro.
PLAN 019 non dichiara PLAN 018 come dipendenza nel frontmatter, e questo è corretto: la sezione Fuori Perimetro esclude esplicitamente l'integrazione immediata con il confronto mensile come sorgente attiva di eventi. Tuttavia, la sezione Riferimenti non include il link al PLAN 018, mentre PLAN 018 referenzia PLAN 019. Questa asimmetria non è bloccante ma crea una catena di riferimenti non bidirezionale. Raccomandazione editoriale: aggiungere il riferimento a PLAN 018 nella sezione Riferimenti di PLAN 019, con nota che la dipendenza è futura e non attiva in v1.

Osservazione 019-N2 — Il Gate G-019-6 verifica P55 manualmente senza criterio automatizzabile.
La migrazione P55 viene verificata manualmente. Per coerenza con gli altri gate che usano npx tsc e npx jest, sarebbe utile indicare almeno un criterio di validazione documentale formale, come la verifica della presenza di titolo_key, messaggio_key, livello e assenza di updated_at nel file SQL. Non è un difetto bloccante ma riduce la consistenza del sistema di gate.

Osservazione 019-N3 — Il Perimetro esclude la riscrittura completa di budget-alerts.ts ma non chiarisce cosa succede ai file parzialmente esistenti.
La voce Fuori Perimetro indica che la riscrittura completa di budget-alerts.ts è esclusa. Tuttavia i task del Perimetro includono il riallineamento del servizio di orchestrazione notifiche. Non è chiaro se budget-alerts.ts viene refactored parzialmente, rinominato o conservato in parallelo con notification-service.ts. Questo punto può generare ambiguità per l'agente implementatore. Raccomandazione: aggiungere una nota nella sezione Perimetro che specifica la relazione tra budget-alerts.ts esistente e notification-service.ts nuovo, indicando se il file viene modificato, dismesso o affiancato.

**Esito PLAN 019:** CONFERMATO REVIEWED con una raccomandazione operativa su budget-alerts.ts che è consigliabile risolvere prima dell'implementazione per evitare che l'agente faccia scelte non documentate su un file esistente.

***

## RIEPILOGO ESECUTIVO PER IL CONSIGLIO AI

### Stato complessivo

Tutti e tre i PLAN sono meritevoli dello stato REVIEWED. Le quattro anomalie bloccanti del report precedente sono state risolte in modo corretto e verificabile. I documenti dimostrano un netto miglioramento qualitativo rispetto alla versione di stamattina.

### Punti che richiedono attenzione prima dell'implementazione

Punto 1 — CONSIGLIATO, PLAN 017 Task T6: chiarire esplicitamente chi aggiorna i placeholder P_017_01 e P_017_02 durante l'esecuzione del task. La responsabilità va assegnata all'agente implementatore di T6, non lasciata implicita.

Punto 2 — CONSIGLIATO, PLAN 018 sezione Perimetro: riscrivere la voce helpers.ts per chiarire che PLAN 018 consuma quella utility ma non la introduce. Il rischio è che un agente tratti helpers.ts come file da modificare nell'ambito di PLAN 018.

Punto 3 — CONSIGLIATO, PLAN 019: aggiungere una nota che definisce la relazione tra budget-alerts.ts e notification-service.ts prima che l'agente inizi l'implementazione. Senza questa nota l'agente farà una scelta autonoma non documentata su un file esistente nel codebase reale.

### Punti di eccellenza documentale da preservare

Il meccanismo di deduplicazione con chiave composita in PLAN 019 è una specifica di qualità superiore alla media. La Nota di Allineamento in PLAN 019 che risolve la contraddizione con DESIGN 017 senza cancellare la feature futura è un pattern da replicare in tutti i documenti dove il perimetro v1 esclude feature pianificate. La struttura dei Gate di Chiusura in tutti e tre i PLAN è coerente e azionabile.

### Raccomandazione finale

I tre PLAN possono essere passati agli agenti Copilot per l'implementazione. Si raccomanda di comunicare agli agenti le tre note operative sopra elencate come istruzioni aggiuntive prima dell'avvio, per evitare che facciano scelte non documentate sui punti ancora aperti. Il blocco 017 deve essere implementato per primo e completato prima che 018 e 019 possano partire, in quanto la disponibilità di roundCurrency ed extractDatePart in helpers.ts è un prerequisito bloccante dichiarato da entrambi.

***

*Report generato il 2026-05-29 ore 15:53 CEST — ZecchinoReact — Consiglio AI*
*Analisi effettuata sui file presenti nel repository al commit: [4d30cf1980fec269e0b6ea0e7be4e64933d0fa55](https://github.com/donato81/ZecchinoReact/blob/4d30cf1980fec269e0b6ea0e7be4e64933d0fa55/docs/3-coding-plans/)*

--

report di chat gpt:
Ho verificato direttamente i tre file al commit `4d30cf1980fec269e0b6ea0e7be4e64933d0fa55`. Il report di Perplexity è migliorato, ma la sua conclusione “REVIEWED confermato” è **troppo ottimistica** per PLAN 017, 018 e soprattutto 019. In particolare, alcune correzioni che Perplexity dichiara risolte o non bloccanti risultano ancora aperte nei file reali.

Di seguito il rapporto finale da restituire.

---

# RAPPORTO FINALE DI VALIDAZIONE — CODING PLAN 017, 018, 019

## Verifica su commit `4d30cf1980fec269e0b6ea0e7be4e64933d0fa55`

**Data:** 29 maggio 2026
**Oggetto:** Validazione del report Perplexity e verifica diretta dei tre Coding Plan 017, 018, 019.
**Repository:** `donato81/ZecchinoReact`
**Esito finale del Consiglio AI:** **NON confermare ancora REVIEWED definitivo senza ultimo fix chirurgico.**

---

## 1. Stato verificato dei file

I tre PLAN risultano effettivamente in stato `REVIEWED` nel frontmatter:

* PLAN 017: `stato: REVIEWED` 
* PLAN 018: `stato: REVIEWED` 
* PLAN 019: `stato: REVIEWED` 

Tuttavia lo stato formale non coincide ancora pienamente con la qualità operativa richiesta. Rimangono anomalie documentali che possono guidare male gli agenti implementatori.

---

# 2. PLAN 017 — Prestiti, Mutui e Simulazione Finanziaria

## 2.1 Punti corretti

PLAN 017 dichiara chiaramente che introduce `roundCurrency` ed `extractDatePart` in `src/lib/helpers.ts`, e che PLAN 018, 019 e successivi devono riusarle senza ridefinizione. 

Il task T3 ribadisce correttamente il contratto tecnico:

* `roundCurrency` usa `parseFloat(value.toFixed(2))`;
* `extractDatePart` restituisce i primi dieci caratteri della stringa data. 

Il perimetro SQL P52, P53 e P54 è dichiarato. 

## 2.2 Problema ancora aperto: T5 non impone uso di `loan-calculator.ts`

Perplexity conferma `REVIEWED`, ma il punto che avevamo già segnalato non è stato chiuso del tutto.

T5 crea il repository prestiti e dipende da T4, quindi la dipendenza esiste. 
Però la metrica di successo parla solo di mapping, promozione, ricalcolo `dataFinePrevista` e assenza di mutazioni fuori contratto. 

Manca ancora la frase vincolante:

> il repository deve importare e usare `loan-calculator.ts` per derivare `rataMensile`, `totaleInteressi` e `dataFinePrevista`; è vietata la reimplementazione inline delle formule finanziarie nel repository.

Questa non è una questione cosmetica: serve a evitare duplicazione della logica finanziaria.

**Classificazione:** media, da correggere prima di considerare PLAN 017 pienamente chiuso.

## 2.3 Problema aperto: prerequisito SQL ambiguo

La sezione prerequisiti dice che P52, P53 e P54 devono essere create prima dell’implementazione dei repository. 
Ma T10 è proprio il task che crea P52, P53 e P54. 

Va chiarito che T10 produce i placeholder SQL e che i repository non devono essere chiusi finché T10 non è completato.

**Classificazione:** minore, ma consigliata.

## 2.4 Esito PLAN 017

**Quasi approvabile, ma non perfetto.**
Per `REVIEWED` robusto serve almeno aggiungere il vincolo anti-formule-inline in T5.

---

# 3. PLAN 018 — Confronto Mese su Mese per Categoria

## 3.1 Punti corretti

Il PLAN 018 dipende da PLAN 017 e dichiara PLAN 019 come dipendente. 

La discrepanza “17 scenari vs 12 scenari” risulta corretta: T5 ora cita almeno 12 scenari, e la sezione Test Obbligatori ne elenca 12.  

La gestione base zero è ben definita: `differenzaPercentuale` è `null`, e il modulo non può restituire `Infinity`, `-Infinity`, `NaN` o `undefined`. 

## 3.2 Problema ancora aperto: voce `helpers.ts` nel perimetro

Perplexity lo segnala correttamente. La sezione Perimetro contiene ancora:

> `src/lib/helpers.ts - questo file riceve l'aggiunta della funzione extractDatePart.`

Subito sotto il documento corregge parzialmente dicendo che `extractDatePart` è definita in PLAN 017 e che PLAN 018 la importa e non la ridefinisce. 

Ma la prima frase resta fuorviante: PLAN 018 non deve “ricevere l’aggiunta” di `extractDatePart`.

**Correzione richiesta:**

Sostituire la voce con:

> `src/lib/helpers.ts` — il PLAN 018 consuma `extractDatePart` e `roundCurrency` introdotte da PLAN 017; non aggiunge né ridefinisce helper condivise.

**Classificazione:** media-bassa, ma da correggere perché riguarda ownership inter-piano.

## 3.3 Problema ancora aperto: G-018-3 resta manuale

Il gate G-018-3 è ancora:

> `Comando: verifica manuale sul modulo puro di confronto mensile` 

Questo era già stato segnalato come migliorabile. Per un vincolo di purezza così importante, il gate dovrebbe essere riproducibile.

**Correzione consigliata:**

```bash
grep -RIn "supabase\|AppDataContext\|cache\|repositories" src/lib/monthly-comparison.ts
```

Esito atteso: zero occorrenze.

**Classificazione:** media, consigliata prima della chiusura definitiva.

## 3.4 Nota su test performance

Il test 12 ora è più misurabile: “tempo di esecuzione non supera i 100ms su un input di 1000 righe”. 
Questa correzione risolve il precedente “percettibilmente stabile”, anche se il benchmark temporale resta potenzialmente fragile su ambienti CI diversi. Non è bloccante.

## 3.5 Esito PLAN 018

**Sostanzialmente approvabile**, ma con due rifiniture consigliate:

1. correggere la voce `helpers.ts`;
2. rendere G-018-3 verificabile.

---

# 4. PLAN 019 — Notifiche Budget e Orchestrazione

## 4.1 Punti corretti

PLAN 019 dipende da PLAN 015 e PLAN 017. 

L’assenza di PLAN 018 tra le dipendenze è corretta, perché il file dichiara fuori perimetro l’integrazione immediata con il confronto mensile come sorgente attiva di eventi. 

Le soglie sono centralizzate in costanti nominate, con default warning 75%, critical 90%, e superamento 100%.  

La deduplicazione è descritta con meccanismo runtime e chiave composita nel task T4.  

## 4.2 Problema bloccante ancora presente: P55 è ancora dopo repository

Questo è il punto principale.

La sezione Prerequisiti dice:

> la migrazione P55 deve essere prodotta prima di riallineare repository e test al nuovo schema persistito. 

Però i task sono ancora ordinati così:

* T3: repository notifiche; 
* T7: migrazione P55. 

Inoltre T3 dipende solo da T2 e T1, non da T7. 

Quindi il problema segnalato nei cicli precedenti **non è stato risolto**. Perplexity lo considera ormai accettabile, ma dai file reali non lo è.

Un agente sequenziale può ancora implementare il repository notifiche prima che il file P55 esista.

**Correzione bloccante richiesta:**

Opzione preferita: rinumerare i task così:

```text
T1 — Configurazione soglie
T2 — Tipi client/Supabase
T3 — Migrazione P55
T4 — Repository notifiche
T5 — Notification-service
T6 — AppDataContext
T7 — Localizzazione
T8 — Test
```

Opzione minima:

```text
T3 Dipende da: T2, T1, T7
```

e nota esplicita:

> T3 non può iniziare finché `docs/6-sql/P55-notifiche.sql` non esiste ed è allineato allo schema finale.

**Classificazione:** bloccante prima del `REVIEWED` definitivo.

## 4.3 Problema aperto: G-019-1 resta manuale

Il gate G-019-1 è ancora:

> `Comando: verifica manuale sulla configurazione soglie, sul servizio notifiche e sui test correlati` 

Questo è un controllo automatizzabile e già richiesto nei cicli precedenti.

**Correzione consigliata:**

```bash
grep -RIn "0\.75\|0\.90\|0\.80\|0\.65\|0\.70\|75\|80\|90\|100" src/lib src/context __tests__ \
  | grep -v "budget-notification-config.ts"
```

Esito atteso: zero occorrenze di soglie budget numeriche cablate inline fuori dal file di configurazione.

**Classificazione:** media.

## 4.4 Osservazione su `budget-alerts.ts`

Perplexity segnala correttamente che PLAN 019 esclude la riscrittura completa di `budget-alerts.ts`, ma T1 dice che `notification-service`, `budget-alerts` e i test possono importare le soglie.  

Serve una frase in Perimetro o Note Operative:

> `budget-alerts.ts` non viene riscritto integralmente in PLAN 019; può essere solo adeguato in modo minimale per importare costanti di soglia e non duplicare letterali, mentre l’orchestrazione budget resta responsabilità di `notification-service.ts`.

**Classificazione:** consigliata, non bloccante quanto P55.

## 4.5 Esito PLAN 019

**Non confermerei REVIEWED definitivo** finché P55/T7 resta dopo T3 repository notifiche. Questo è l’unico vero blocco rimasto, ma è reale.

---

# 5. Classificazione finale corretta

## Bloccante

### B1 — PLAN 019: P55 deve precedere repository notifiche

La contraddizione è ancora presente: prerequisito dice P55 prima del repository, ma T3 repository precede T7 P55 e non dipende da T7.   

---

## Medie da correggere o comunicare agli agenti

### M1 — PLAN 017: T5 deve imporre uso di `loan-calculator.ts`

T5 dipende da T4 ma non vieta formule inline. 

### M2 — PLAN 018: correggere voce `helpers.ts`

La voce dice ancora che PLAN 018 riceve l’aggiunta di `extractDatePart`. 

### M3 — PLAN 018: rendere G-018-3 verificabile

Il gate resta manuale. 

### M4 — PLAN 019: rendere G-019-1 verificabile

Il gate resta manuale. 

### M5 — PLAN 019: chiarire rapporto `budget-alerts.ts` / `notification-service.ts`

La riscrittura completa di `budget-alerts.ts` è fuori perimetro, ma T1 lo cita come consumer delle soglie.  

---

## Minori

* PLAN 017: chiarire che T10 crea P52/P53/P54, non che devono preesistere.  
* PLAN 017: assegnare esplicitamente all’agente T6 la responsabilità di sostituire i placeholder `P_017_01` e `P_017_02`. 
* PLAN 019: spostare la nota lunga su prestiti fuori dall’elenco Fuori Perimetro. 
* PLAN 019: spostare `Casi limite` fuori dai Task Atomici. 

---

# 6. Verdetto finale

Il report di Perplexity è corretto nel riconoscere il forte miglioramento dei tre documenti, ma **non è corretto nel confermare senza riserve lo stato REVIEWED**.

La decisione del Consiglio AI è:

```text
REVIEWED NON ANCORA CONFERMATO OPERATIVAMENTE
APPROVARE SOLO DOPO FIX B1 SU PLAN 019
```

Il fix minimo indispensabile è uno solo:

```text
PLAN 019: rendere P55 precedente o dipendenza esplicita del repository notifiche.
```

Dopo quel fix, i restanti punti possono essere:

* corretti nel documento prima del commit finale;
* oppure passati come note operative obbligatorie agli agenti Copilot.

La raccomandazione più sicura è fare un ultimo mini-commit chirurgico con:

1. PLAN 019: riordinare T7/P55 prima di T3 repository;
2. PLAN 017: aggiungere vincolo `loan-calculator.ts` in T5;
3. PLAN 018: correggere voce `helpers.ts`;
4. PLAN 018 e 019: sostituire gate manuali principali con grep;
5. PLAN 019: chiarire `budget-alerts.ts`.

Dopo questo, il passaggio a `REVIEWED` sarà pienamente giustificato.

---

# 7. Risposta sintetica da restituire a Perplexity

Perplexity, il Consiglio AI conferma che i tre PLAN sono molto migliorati, ma non conferma ancora senza riserve lo stato `REVIEWED`.

Il punto bloccante ancora aperto è PLAN 019: il documento dichiara che P55 deve essere prodotta prima del riallineamento repository/test, ma T3 è ancora il repository notifiche e T7 è ancora la migrazione P55. Inoltre T3 non dipende da T7. Questa contraddizione operativa deve essere corretta prima della chiusura definitiva.

Sono inoltre raccomandate queste correzioni medie:

* PLAN 017: T5 deve imporre esplicitamente l’uso di `loan-calculator.ts`;
* PLAN 018: la voce `helpers.ts` deve dire che il PLAN consuma `extractDatePart` da PLAN 017, non che la aggiunge;
* PLAN 018: G-018-3 va reso verificabile;
* PLAN 019: G-019-1 va reso verificabile;
* PLAN 019: va chiarita la relazione tra `budget-alerts.ts` e `notification-service.ts`.

Verdetto:

```text
APPROVABILE DOPO ULTIMO FIX CHIRURGICO
NON ANCORA REVIEWED PIENO
```

Sequenza implementativa confermata:

```text
PLAN 017 → PLAN 018 → PLAN 019
```

--

report di deepseek:
# CONSIGLIO MASTRO — VERDETTO FINALE SUI CODING PLANS 017, 018, 019

**Data:** 2026-05-29  
**Oggetto:** Analisi, verifica e convalida dei file di coding plans 017, 018, 019  
**Fonti esaminate:**  
- Rapporto di Perplexity (terza revisione, 2026-05-29 ore 15:53 CEST)  
- Rapporto di ChatGPT (validazione su commit `4d30cf1980fec269e0b6ea0e7be4e64933d0fa55`)  
**Repository di riferimento:** [github.com/donato81/ZecchinoReact](https://github.com/donato81/ZecchinoReact)  

---

## PREMESSA

Il Consiglio Mastro ha letto integralmente entrambi i rapporti.  
Il rapporto di Perplexity documenta un netto miglioramento dei tre file e li giudica meritevoli di `REVIEWED`.  
Il rapporto di ChatGPT, sulla base di una verifica diretta dei file al commit indicato, rileva che **alcune correzioni critiche non sono state ancora applicate**, in particolare nel PLAN 019.

Il Consiglio Mastro **accoglie la valutazione di ChatGPT** perché più granulare, verificabile e allineata con la necessità di evitare ambiguità operative per gli agenti implementatori.

---

## VERDETTO SULLO STATO ATTUALE

I tre Coding Plan **NON SONO ANCORA PRONTI** per lo stato `REVIEWED` definitivo.

Nonostante i significativi miglioramenti, permangono:

- **Una anomalia bloccante** (PLAN 019 – ordine dei task P55 / repository)
- **Diverse anomalie medie** che possono generare scelte non documentate da parte degli agenti

Lo stato formale dichiarato nei frontmatter (`REVIEWED`) è **prematuro** e non corrisponde pienamente alla qualità operativa richiesta.

---

## ANOMALIE RESIDUE – CLASSIFICAZIONE FINALE

### 🔴 BLOCANTE (da correggere assolutamente prima di REVIEWED)

**B1 – PLAN 019: P55 deve precedere il repository notifiche**

- **Problema:** La sezione Prerequisiti dichiara che la migrazione P55 deve essere prodotta prima di riallineare repository e test. Tuttavia il task T3 (repository notifiche) è numerato prima di T7 (migrazione P55) e non dipende da T7.
- **Rischio:** Un agente che segue l’ordine numerico potrebbe implementare il repository prima che lo schema SQL esista.
- **Correzione richiesta (opzione preferita):**  
  Rinumerare i task di PLAN 019 come segue:
  ```
  T1 – Configurazione soglie
  T2 – Tipi client/Supabase
  T3 – Migrazione P55 (attuale T7)
  T4 – Repository notifiche (attuale T3)
  T5 – Notification-service
  T6 – AppDataContext
  T7 – Localizzazione
  T8 – Test
  ```
  **Opzione minima:**  
  Modificare T3 aggiungendo `T7` come dipendenza esplicita e una nota che blocca l’inizio fino all’esistenza del file SQL.

---

### 🟠 ANOMALIE MEDIE (raccomandate prima di REVIEWED)

| ID | PLAN | Descrizione | Correzione |
|----|------|-------------|-------------|
| M1 | 017 | T5 non impone l’uso di `loan-calculator.ts` | Aggiungere vincolo esplicito: il repository deve importare il motore per derivare `rataMensile`, `totaleInteressi`, `dataFinePrevista`; vietata reimplementazione inline. |
| M2 | 018 | Voce fuorviante su `helpers.ts` nel Perimetro | Sostituire con: “`src/lib/helpers.ts` – PLAN 018 consuma `extractDatePart` e `roundCurrency` introdotte da PLAN 017; non aggiunge né ridefinisce helper condivise.” |
| M3 | 018 | Gate G-018-3 ancora manuale | Sostituire con comando grep verificabile (es. ricerca di import da supabase/context/cache). |
| M4 | 019 | Gate G-019-1 ancora manuale | Sostituire con comando grep che verifichi l’assenza di soglie numeriche fuori dal file di configurazione. |
| M5 | 019 | Relazione tra `budget-alerts.ts` e `notification-service.ts` non chiara | Aggiungere nota: `budget-alerts.ts` non viene riscritto; può solo importare costanti di soglia; l’orchestrazione budget è delegata a `notification-service.ts`. |

---

### 🟢 ANOMALIE MINORI / COSMETICHE (opzionali)

- PLAN 017: chiarire che T10 crea i placeholder SQL, non che devono preesistere.
- PLAN 017: assegnare esplicitamente all’agente T6 la responsabilità di sostituire i placeholder `P_017_01` e `P_017_02`.
- PLAN 019: spostare la nota lunga su prestiti fuori dall’elenco “Fuori Perimetro”.
- PLAN 019: spostare la sezione “Casi limite” in una posizione autonoma tra Task e Test.
- Ripristino degli accenti e apostrofi (migliora la leggibilità).

---

## RACCOMANDAZIONE OPERATIVA AL PROJECT OWNER

Prima di autorizzare l’implementazione da parte degli agenti Copilot, il Project Owner deve:

1. **Applicare la correzione bloccante B1** su PLAN 019 (riordinare P55 prima del repository).
2. **Applicare le correzioni medie M1, M2, M3, M4, M5** (o quantomeno comunicarle formalmente agli agenti come istruzioni vincolanti).
3. **Dopo le correzioni**, rieseguire una verifica leggera (o chiedere una quarta validazione).
4. **Solo allora** transitare i tre file a `REVIEWED` definitivo.

Una volta che i file saranno corretti e promossi a `REVIEWED`, l’implementazione dovrà avvenire in **sequenza stretta**:

```
PLAN 017 → PLAN 018 → PLAN 019
```

Il file `AppDataContext.tsx` è modificato sia da PLAN 017 sia da PLAN 019: il parallelismo è vietato.

---

## CONCLUSIONI

Il Consiglio Mastro **non convalida** i tre Coding Plan nella versione attuale come pronti per `REVIEWED`.  
Tuttavia, **li considera architetturalmente validi** e ritiene che le correzioni richieste siano limitate e ben circoscritte.

Si invita il Project Owner a eseguire l’ultimo ciclo chirurgico descritto prima di procedere.

---

**Firmato:**  
Consiglio Mastro — ZecchinoReact  
2026-05-29

--

report di geminy.
Ricevuto, Donato. Ho esaminato attentamente l'intero flusso dei tre rapporti (il cambio di passo di Perplexity, il filtraggio chirurgico di ChatGPT sul commit reale `4d30cf1` e il verdetto di sintesi del Consiglio Mastro di DeepSeek).

Il verdetto è unanime e insindacabile: **lo stato `REVIEWED` attualmente presente nei frontmatter dei file è prematuro**. Non possiamo dare il via libera agli agenti di coding finché la logica sequenziale dei piani presenta queste frizioni. Perplexity è stato troppo ottimista, mentre ChatGPT e DeepSeek hanno centrato i punti critici.

Dato che i file sono già nel tuo repository, per evitare di farti perdere tempo a rincorrere le modifiche a mano riga per riga, **ho preparato i blocchi di testo esatti e definitivi per l'applicazione delle patch**.

Puoi copiare e incollare direttamente queste sezioni nei rispettivi file per sanare il blocco prima del commit di sblocco reale.

---

## 🛠️ PATCH 1: `017-PLAN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md`

### 1. In Sezione Prerequisiti Bloccanti

Sostituisci il punto relativo ai file SQL con:

```markdown
*   Le migrazioni placeholder P52, P53 e P54 sono prodotte formalmente dal Task T10; i task operativi di persistenza e repository non possono essere considerati conclusi finché T10 non ha generato i relativi file strutturali in docs/6-sql/.

```

### 2. In Sezione 5 - Task T5 (Repository Prestiti)

Aggiungi alle Note Operative / Metriche di Successo:

```markdown
*   **Vincolo Architetturale:** Il repository deve importare e utilizzare obbligatoriamente il motore puro `loan-calculator.ts` per derivare i valori di `rataMensile`, `totaleInteressi` e `dataFinePrevista`. È vietata in alcun caso la reimplementazione inline o la duplicazione delle formule finanziarie all'interno del layer del repository.

```

### 3. In Sezione 5 - Task T6 (RPC Rimborsi)

Aggiungi in coda alla nota operativa:

```markdown
*   **Nota di Responsabilità:** L'agente implementatore di questo task (T6) ha l'obbligo esplicito di sostituire i placeholder strutturali `P_017_01` e `P_017_02` con i riferimenti reali generati nel file di migrazione finale.

```

---

## 🛠️ PATCH 2: `018-PLAN_confronto-mese-su-mese-categoria_v0.1.0.md`

### 1. In Sezione 2 - Perimetro di Intervento

Sostituisci la riga relativa a `helpers.ts` con:

```markdown
*   `src/lib/helpers.ts` — Il PLAN 018 consuma `extractDatePart` e `roundCurrency` introdotte da PLAN 017; il file viene letto e utilizzato come dipendenza pura, non riceve aggiunte né ridefinizioni di helper condivise in questo piano.

```

### 2. In Sezione 7 - Gate di Chiusura (G-018-3)

Sostituisci la riga del comando manuale con:

```markdown
*   **Comando di Verifica:** `grep -RIn "supabase\|AppDataContext\|cache\|repositories" src/lib/monthly-comparison.ts`
*   **Esito Atteso:** 0 occorrenze (il modulo deve rimanere puramente computazionale e privo di effetti collaterali o accoppiamenti di stato).

```

---

## 🛠️ PATCH 3: `019-PLAN_notifiche-budget-orchestrazione_v0.1.0.md`

### 1. In Sezione Note Operative / Perimetro

Aggiungi questo chiarimento fondamentale su `budget-alerts.ts`:

```markdown
*   **Relazione budget-alerts / notification-service:** La riscrittura completa di `budget-alerts.ts` è fuori perimetro. Il file esistente può essere unicamente modificato per importare le costanti centralizzate dal file di configurazione (`budget-notification-config.ts`) al fine di eliminare i letterali numerici hardcoded, mentre l'intera logica di nuova orchestrazione delle notifiche è delegata esclusivamente al nuovo `notification-service.ts`.

```

### 2. In Sezione 5 - Task Atomici (Risoluzione Bloccante B1)

Ristruttura l'ordine e le dipendenze dei task invertiti applicando questa sequenza:

```markdown
### T1: Configurazione Soglie Centralizzate
*   **File target:** `src/lib/budget-notification-config.ts`
*   **Dettaglio:** Definizione di BUDGET_ALERT_THRESHOLD_WARNING (0.75), BUDGET_ALERT_THRESHOLD_CRITICAL (0.90) e superamento (1.00).

### T2: Estensione Tipi Client / Supabase
*   **File target:** `src/types/supabase.ts` o file di estensione locale dei tipi notifiche.

### T3: Creazione File di Migrazione SQL (Ex T7)
*   **File target:** `docs/6-sql/P55-notifiche.sql`
*   **Dettaglio:** Creazione della struttura della tabella notifiche e degli indici correlati.

### T4: Riallineamento Repository Notifiche (Ex T3)
*   **Dipenda da:** T1, T2, T3
*   **Nota:** Non può essere avviato finché il file SQL di T3 non è presente nel workspace.

### T5: Aggiornamento ed Implementazione Notification Service (Ex T4)
*   **Dipende da:** T4

### T6: Estrazione e Disaccoppiamento Orchestrazione (Ex T5)
*   **File target:** `src/context/AppDataContext.tsx`

### T7: Chiavi di Localizzazione (Ex T6)
*   **File target:** `src/i18n/it.ts`

### T8: Suite di Test e Copertura Codice
*   **File target:** `__tests__/notification-service.test.ts`

```

### 3. In Sezione 7 - Gate di Chiusura (G-019-1)

Sostituisci il comando di verifica con:

```markdown
*   **Comando di Verifica:** `grep -RIn "0\.75\|0\.90\|0\.80\|0\.65\|0\.70\|75\|80\|90\|100" src/lib src/context __tests__ | grep -v "budget-notification-config.ts"`
*   **Esito Atteso:** 0 occorrenze (nessun valore di soglia deve essere espresso come costante letterale inline fuori dal file di configurazione).

```

---

## 🚀 Prossimi Passi

1. Sostituisci questi blocchi di testo nei file del tuo workspace.
2. Sposta la dicitura del frontmatter da `stato: REVIEWED` a un temporaneo `stato: REVIEWED PENDING` (o lasciala `REVIEWED` solo se esegui il commit contestualmente alle correzioni).
3. Esegui il push sul branch `main`.

Una volta completato questo allineamento, la catena di dipendenze $017 \rightarrow 018 \rightarrow 019$ sarà blindata sia per te che per qualsiasi agente AI che prenderà in carico lo sviluppo.

Procedi pure con i fix nel workspace; se hai bisogno di un controllo al volo sul file modificato o sui comandi grep, sono qui.