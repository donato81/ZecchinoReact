# PIANO DI TEST DEI MODULI CORE (FASE A)
**Data di produzione:** 2026-06-27  
**Stato del report:** IN ATTESA DI REVISIONE ARCHITETTO

## Introduzione
Questo documento contiene il piano di test dettagliato per i sette moduli core del progetto **ZecchinoReact**. L'analisi è stata condotta leggendo integralmente ciascun modulo, mappandone lo scopo, le dipendenze esterne da simulare, i casi d'uso normali, i casi limite e i possibili scenari di errore.

I sette moduli analizzati in questa sessione sono:
1. [src/lib/budget-forecasting.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/budget-forecasting.ts)
2. [src/lib/budget-history.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/budget-history.ts)
3. [src/lib/budget-templates.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/budget-templates.ts)
4. [src/lib/kdf-provider.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/kdf-provider.ts)
5. [src/lib/helpers.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/helpers.ts)
6. [src/accessibility/engine.ts](file:///c:/Sviluppo/ZecchinoReact/src/accessibility/engine.ts)
7. [src/accessibility/detection.ts](file:///c:/Sviluppo/ZecchinoReact/src/accessibility/detection.ts)

---

## Schede di Test dei Moduli

### MODULO: [budget-forecasting.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/budget-forecasting.ts)
**SCOPO:** Calcola le previsioni di spesa del budget corrente basandosi sulla spesa del periodo attuale e sullo storico dei periodi passati.

**DIPENDENZE DA MOCKARE:**
- `src/lib/budget-history`: Mockare `getBudgetHistoricalData` e `calculateBudgetTrend` per restituire set di dati storici controllati e isolare la logica di calcolo predittivo del forecast.
- Funzione nativa `Date` / Ora di sistema: Mockare l'oggetto `Date` (es. tramite `jest.useFakeTimers` o ridefinendo `Date.now`) in quanto il modulo utilizza `new Date()` internamente per determinare il giorno corrente in cui si esegue il calcolo.

**CASI NORMALI:**
- **Caso 1: Periodo concluso (`now > budget.dataFine`)**
  - *Input atteso:* Budget con data di fine nel passato (es. terminato da 2 giorni) e transazioni registrate nel periodo.
  - *Output atteso:* Un oggetto `BudgetForecast` con `daysRemaining` pari a 0, `confidence` impostata su `'high'`, `forecastMethod` impostato su `'current-trend'` e spesa stimata (`projectedSpending`) pari esattamente all'importo speso nel periodo (`spent`).
- **Caso 2: Fase iniziale del periodo (`daysElapsed < 5`)**
  - *Input atteso:* Budget attivo iniziato da 3 giorni, storico dei periodi precedenti presente (es. 4 periodi storici).
  - *Output atteso:* `forecastMethod` impostato su `'historical-average'`, con spesa stimata (`projectedSpending`) pari alla media dei periodi passati (`averageHistoricalSpending`) e confidenza impostata su `'medium'` (poiché ci sono >= 3 periodi storici).
- **Caso 3: Primo quarto del periodo (`daysElapsed / totalDays < 0.25`)**
  - *Input atteso:* Budget attivo iniziato da 10 giorni su un totale di 60 (16.6% del tempo), storico presente.
  - *Output atteso:* `forecastMethod` impostato su `'weighted'`, con spesa stimata pari al 40% della proiezione del trend corrente (`currentTrendProjection`) e al 60% della media storica dei periodi passati (`historicalProjection`).
- **Caso 4: Metà del periodo (`daysElapsed / totalDays < 0.5`)**
  - *Input atteso:* Budget attivo da 20 giorni su un totale di 60 (33.3% del tempo), storico presente.
  - *Output atteso:* `forecastMethod` impostato su `'weighted'`, con spesa stimata pari al 60% della proiezione del trend corrente e al 40% della media storica dei periodi passati.
- **Caso 5: Seconda metà del periodo (`daysElapsed / totalDays >= 0.5`)**
  - *Input atteso:* Budget attivo da 40 giorni su un totale di 60 (66.6% del tempo), storico presente.
  - *Output atteso:* `forecastMethod` impostato su `'current-trend'`, con spesa stimata proiettata interamente sul trend corrente (`currentSpent + currentDailyAverage * daysRemaining`) e confidenza impostata su `'high'`.
- **Caso 6: Filtro transazioni per Categoria**
  - *Input atteso:* Budget con `categoriaId` impostato, transazioni appartenenti a diverse categorie ed entrate/uscite miste.
  - *Output atteso:* Spesa calcolata considerando esclusivamente le transazioni che presentano lo stesso `categoriaId` e con `tipo === 'uscita'`.
- **Caso 7: Filtro transazioni per Conto**
  - *Input atteso:* Budget con `contoId` impostato (e `categoriaId` assente), transazioni appartenenti a diversi conti ed entrate/uscite miste.
  - *Output atteso:* Spesa calcolata considerando esclusivamente le transazioni che presentano lo stesso `contoId` e con `tipo === 'uscita'`.

**CASI LIMITE:**
- **Storico assente:** Se il budget richiede una stima basata sullo storico (es. `daysElapsed < 5`) ma non esistono periodi storici precedenti nel database (`pastPeriodsData.length === 0`), il calcolo della media storica deve restituire 0 senza mandare in crash l'applicazione.
- **Target budget pari a zero (`importoTarget = 0`):** Con target nullo, il calcolo della percentuale prevista (`projectedPercentage = (projectedSpending / budget.importoTarget) * 100`) produrrà valori come `Infinity` o `NaN`. Il test deve verificare come risponde l'applicazione a questa casistica.
- **Transazioni del periodo assenti:** Se non ci sono uscite nel periodo corrente, `currentDailyAverage` deve valere 0 e la proiezione basata sul trend corrente deve sommare solo lo storico.
- **Date coincidenti (`dataInizio === dataFine`):** Il calcolo dei giorni totali restituisce 0. Questo causa una divisione per zero in `historicalDailyAverage = averageHistoricalSpending / totalDays`. Il comportamento deve essere monitorato per evitare che produca `Infinity`.

**CASI DI ERRORE:**
- **Date del budget non valide:** Se `dataInizio` o `dataFine` contengono stringhe non parseabili dal costruttore `Date`, i calcoli di differenza temporale restituiranno `NaN`, portando l'intero oggetto forecast ad avere valori numerici invalidi (`NaN`).
- **Data fine antecedente a data inizio (`dataFine < dataInizio`):** Provoca giorni totali negativi, alterando il calcolo delle percentuali e falsificando le soglie temporali condizionali dell'algoritmo.

**NOTE PER L'ARCHITETTO:**
- **Chiamata morta a `calculateBudgetTrend`:** Alla riga 118, viene invocata la funzione `calculateBudgetTrend(budget, transactions, historicalPeriods)`, ma il valore restituito non viene assegnato ad alcuna variabile né utilizzato. Questa chiamata esegue calcoli storici ridondanti e consuma CPU inutilmente. Si consiglia di rimuoverla o di integrarla se necessario.
- **Precedenza esclusiva Categoria/Conto in `getCurrentPeriodSpending`:** Se un budget possiede sia `categoriaId` che `contoId`, l'istruzione condizionale `if (budget.categoriaId)` esegue il return del filtro basato solo su categoria, ignorando completamente il filtro sul conto. Si raccomanda di verificare se questo sia il comportamento desiderato.
- **Divisione per zero con `totalDays = 0`:** Se `dataInizio === dataFine`, `totalDays` è 0. Questo porta `historicalDailyAverage` ad essere `Infinity`. È opportuno introdurre una guardia per impostare a 0 la media se `totalDays <= 0`.

---

### MODULO: [budget-history.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/budget-history.ts)
**SCOPO:** Calcola i dati storici del budget suddivisi per periodi (mensile, trimestrale, annuale) e ne analizza la tendenza e le variazioni.

**DIPENDENZE DA MOCKARE:**
- Funzione nativa `Date` / Ora di sistema: Mockare la data odierna per rendere deterministico il calcolo dei periodi relativi passati e le relative date di inizio e fine.

**CASI NORMALI:**
- **Caso 1: Storico budget mensile (`periodo = 'mensile'`)**
  - *Input atteso:* Budget mensile iniziato il "2026-06-01" e `periodsToShow = 3`.
  - *Output atteso:* Un array di 3 elementi, ordinati in senso temporale crescente (dal più vecchio al periodo corrente). Gli elementi avranno etichette coerenti (es. `"Apr 2026"`, `"Mag 2026"`, `"Giu 2026"`) e date di inizio/fine esatte per ciascun mese.
- **Caso 2: Storico budget trimestrale (`periodo = 'trimestrale'`)**
  - *Input atteso:* Budget trimestrale iniziato il "2026-06-01" e `periodsToShow = 2`.
  - *Output atteso:* Due periodi con etichette trimestrali (es. `"Q1 2026"`, `"Q2 2026"`) e intervalli di 3 mesi ciascuno.
- **Caso 3: Storico budget annuale (`periodo = 'annuale'`)**
  - *Input atteso:* Budget annuale iniziato il "2026-06-01" e `periodsToShow = 2`.
  - *Output atteso:* Due periodi con etichette annuali (es. `"2025"`, `"2026"`) e intervalli di 12 mesi ciascuno.
- **Caso 4: Analisi Trend Crescente (`trend = 'increasing'`)**
  - *Input atteso:* Storico in cui la spesa media dei periodi recenti supera quella dei periodi meno recenti di oltre il 10% (es. olderAvg = 100, recentAvg = 120).
  - *Output atteso:* Oggetto `BudgetTrendData` con `trend` = `'increasing'` e `changePercentage` = 20.
- **Caso 5: Analisi Trend Decrescente (`trend = 'decreasing'`)**
  - *Input atteso:* Storico in cui la spesa recente è inferiora a quella dei periodi passati di oltre il 10% (es. olderAvg = 100, recentAvg = 80).
  - *Output atteso:* Oggetto `BudgetTrendData` con `trend` = `'decreasing'` e `changePercentage` = -20.
- **Caso 6: Analisi Trend Stabile (`trend = 'stable'`)**
  - *Input atteso:* Variazione di spesa media tra periodi recenti e vecchi compresa tra -10% e +10% (es. olderAvg = 100, recentAvg = 105).
  - *Output atteso:* Oggetto `BudgetTrendData` con `trend` = `'stable'` e `changePercentage` = 5.
- **Caso 7: Confronto periodi (`compareBudgetPeriods`)**
  - *Input atteso:* Transazioni distribuite sul periodo corrente e precedente.
  - *Output atteso:* Restituzione della spesa del periodo corrente e precedente, con la differenza monetaria (`change`) e percentuale (`changePercentage`) calcolate correttamente.

**CASI LIMITE:**
- **Numero minimo di periodi da analizzare (`periodsToAnalyze < 2`):** Se viene richiesto di calcolare il trend su meno di 2 periodi, la funzione deve ritornare direttamente un trend `'stable'` con `changePercentage` = 0.
- **Spesa passata nulla (`olderAvg = 0` o `previousPeriod.spent = 0`):** Per evitare la divisione per zero nel calcolo di `changePercentage`, il codice verifica se il valore passato è maggiore di zero. Se è 0, deve restituire 0.
- **Target budget nullo (`importoTarget = 0`):** In `getBudgetHistoricalData`, se `importoTarget` è 0, la percentuale calcolata deve essere impostata a 0 per evitare errori matematici.

**CASI DI ERRORE:**
- **Periodo del budget non supportato:** Se il campo `periodo` del budget contiene un valore non valido o non contemplato dallo switch, le funzioni `getPeriodLabel` e `getPeriodDates` restituiranno `undefined`, provocando crash per mancata corrispondenza di proprietà a runtime.

**NOTE PER L'ARCHITETTO:**
- **Bug critico JS Date SetMonth (Roll-over su fine mese):** Nelle funzioni `getPeriodLabel` e `getPeriodDates`, la data di riferimento viene manipolata sottraendo mesi con `start.setMonth(start.getMonth() - periodIndex)`. In JavaScript, se la data di partenza cade sul 31 del mese (ad es. 31 Maggio) e sottraiamo 1 mese, il motore JS proverà a impostare 31 Aprile. Poiché Aprile ha solo 30 giorni, la data avanzerà automaticamente al 1° Maggio. Questo comporta il calcolo di date storiche duplicate e intervalli sovrapposti. Si raccomanda caldamente di normalizzare la data di inizio impostando temporaneamente il giorno a 1 prima di effettuare calcoli sui mesi, impostando poi l'ultimo giorno corretto.

---

### MODULO: [budget-templates.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/budget-templates.ts)
**SCOPO:** Definisce i modelli preconfigurati di budget con le rispettive categorie target, importi suggeriti, icone e colori, ed espone funzioni per mappare le categorie del database a quelle del template.

**DIPENDENZE DA MOCKARE:**
- Nessuna. Il modulo contiene costanti di configurazione e una funzione pura sincrona.

**CASI NORMALI:**
- **Caso 1: Elenco dei template standard**
  - *Input atteso:* Accesso alla costante `BUDGET_TEMPLATES`.
  - *Output atteso:* Un array non vuoto contenente esattamente gli 11 template standard definiti (es. Spesa Alimentare, Ristoranti, Trasporti, ecc.) dotati di campi validi e coerenti con i token colore di `DESIGN_COLORS.budget`.
- **Caso 2: Mappatura categorie esistenti (`findTemplateCategories`)**
  - *Input atteso:* Il template "Spesa Alimentare" (che ha come target `['Spesa alimentare']`) e un elenco di categorie disponibili nel database `[{ id: 'cat-101', nome: 'Spesa alimentare' }]`.
  - *Output atteso:* Un array di stringhe contenente solo gli ID corrispondenti: `['cat-101']`.
- **Caso 3: Mappatura categorie con target multipli**
  - *Input atteso:* Il template "Casa e Bollette" (target: `['Affitto/Mutuo', 'Bollette']`) ed elenco categorie disponibili `[{ id: 'cat-a', nome: 'Affitto/Mutuo' }, { id: 'cat-b', nome: 'Bollette' }, { id: 'cat-c', nome: 'Svago' }]`.
  - *Output atteso:* Array con gli ID mappati: `['cat-a', 'cat-b']`.

**CASI LIMITE:**
- **Nessuna categoria corrispondente:** Se nessuna delle categorie fornite corrisponde ai target del template, il metodo deve restituire un array vuoto `[]` senza sollevare eccezioni.
- **Template senza categorie target (`budget-totale`):** Il template del budget totale possiede `categorieTarget: []`. La funzione deve restituire correttamente `[]`.

**CASI DI ERRORE:**
- **Elenco categorie non definito (`undefined` / `null`):** Se viene passato un valore nullo per `availableCategories`, la chiamata a `.filter` fallirà con un `TypeError` irreversibile.

**NOTE PER L'ARCHITETTO:**
- **Sensibilità alle maiuscole/minuscole (Case-Sensitivity):** Il metodo di ricerca `.includes(cat.nome)` è strettamente case-sensitive. Ad esempio, il template `spesa-mensile` ha come target `'Spesa alimentare'` (con la "a" minuscola), ma se la categoria disponibile sul database è stata salvata come `'Spesa Alimentare'` (con la "A" maiuscola), la mappatura fallirà silenziosamente restituendo `[]`. Si consiglia di normalizzare il confronto a lettere minuscole (es. `.toLowerCase()`) per prevenire errori dovuti a discrepanze di inserimento da parte dell'utente.

---

### MODULO: [kdf-provider.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/kdf-provider.ts)
**SCOPO:** Fornisce un'implementazione cross-platform per la derivazione della chiave crittografica a partire da un PIN tramite l'algoritmo PBKDF2-SHA256, privilegiando l'estensione nativa su React Native e usando il modulo nativo di Node in ambiente di test.

**DIPENDENZE DA MOCKARE:**
- `react-native-quick-crypto`: per testare la corretta attivazione del blocco nativo React Native e simulare il comportamento in produzione.
- `crypto` (modulo core di Node.js): per validare il fallback utilizzato in ambiente di test locale (Jest/Node).

**CASI NORMALI:**
- **Caso 1: Derivazione corretta SHA-256 (`derivePbkdf2Sha256`)**
  - *Input atteso:* PIN `"1234"`, salt as `Uint8Array` di 16 byte, 600.000 iterazioni e lunghezza chiave di 32 byte.
  - *Output atteso:* Un array di byte (`Uint8Array`) di lunghezza esatta pari a 32, contenente la chiave derivata deterministica conforme agli standard crittografici (verificabile tramite vettori di test noti).

**CASI LIMITE:**
- **Valore di iterazioni minimo:** Testare che con `iterations = 1` l'algoritmo risponda in modo deterministico e immediato.
- **Lunghezza della chiave nulla (`keyLength = 0`):** Deve restituire un `Uint8Array` vuoto di 0 byte senza andare in errore.
- **PIN o Salt vuoti:** Se `pin` è stringa vuota o `salt` ha lunghezza 0, l'algoritmo deve comunque produrre un output derivato valido e deterministico.

**CASI DI ERRORE:**
- **Assenza di librerie crittografiche disponibili:** Qualora l'ambiente non disponga né di `react-native-quick-crypto` né del modulo `crypto` di Node (es. browser web standard senza shim), il blocco catch interno di `getPbkdf2Sync` richiederà `crypto` che fallirà, sollevando un'eccezione irreversibile all'avvio.
- **Valori numerici negativi:** Passare parametri negativi per iterazioni o lunghezza chiave solleverà eccezioni direttamente dalle implementazioni crittografiche sottostanti.

**NOTE PER L'ARCHITETTO:**
- **Rischio in Ambiente Web / Browser Puro:** La funzione si affida a `require('crypto')` di Node come ripiego se la libreria React Native non è installata. In scenari web (es. esecuzione in browser web classico), l'assenza di un bundler configurato con appositi polyfill per il modulo `crypto` causerà il blocco immediato dell'applicazione. Se l'app prevede una versione Web ufficiale, andrebbe implementata una chiamata a `window.crypto.subtle` come ulteriore fallback.

---

### MODULO: [helpers.ts](file:///c:/Sviluppo/ZecchinoReact/src/lib/helpers.ts)
**SCOPO:** Raccoglie funzioni di utilità generali per l'arrotondamento valutario, calcolo di saldi di conto, formattazione di valute e date, raggruppamenti statistici, esportazione CSV e proiezioni finanziarie di risparmio.

**DIPENDENZE DA MOCKARE:**
- Moduli globali `Intl.NumberFormat` e `Intl.DateTimeFormat`: Le funzioni di formattazione dipendono dal locale di sistema. In ambienti di test automatici (es. server CI), il locale italiano potrebbe non essere installato, causando differenze nella valuta o nella punteggiatura. Mockare `Intl` assicura asserzioni stringa affidabili.
- Funzione `generateId`: Mockare `Date.now` e `Math.random` per rendere prevedibile e testabile l'ID generato.

**CASI NORMALI:**
- **Caso 1: Arrotondamento valutario (`roundCurrency`)**
  - *Input atteso:* Un valore numerico decimale, es. `123.456`.
  - *Output atteso:* Il valore arrotondato matematicamente a due decimali: `123.46`.
- **Caso 2: Estrazione parte data (`extractDatePart`)**
  - *Input atteso:* Una data ISO string completa `"2026-06-27T17:25:20.000Z"`.
  - *Output atteso:* La sola stringa di data `"2026-06-27"`.
- **Caso 3: Calcolo saldo conto (`calculateAccountBalance`)**
  - *Input atteso:* Un conto con `saldoIniziale = 500` e un set di transazioni (un'entrata di 100, un'uscita di 50 e un trasferimento in uscita di 200).
  - *Output atteso:* Saldo finale calcolato: `350` (`500 + 100 - 50 - 200`).
- **Caso 4: Formattazione valuta e date (`formatCurrency`, `formatDate`)**
  - *Input atteso:* Importo `150.5` ed EUR, data string `"2026-06-27"`.
  - *Output atteso:* Stringhe formattate secondo lo standard italiano, es. `"150,50 €"` e `"27/6/2026"`.
- **Caso 5: Raggruppamento per Categoria (`groupTransactionsByCategory`)**
  - *Input atteso:* Elenco di transazioni con uscite miste collegate a categorie diverse, ed elenco categorie disponibili.
  - *Output atteso:* Array ordinato per importo totale speso in ordine decrescente.
- **Caso 6: Esportazione CSV (`exportToCSV`)**
  - *Input atteso:* Transazioni, conti e categorie.
  - *Output atteso:* Stringa in formato CSV con intestazioni corrette e record racchiusi tra doppi apici.
- **Caso 7: Proiezioni di Risparmio (`calculateSavingsProjection`)**
  - *Input atteso:* Obiettivo di risparmio attivo con data di inizio, scadenza e progresso corrente.
  - *Output atteso:* Oggetto contenente il risparmio settimanale/mensile richiesto per restare in traiettoria e la stima della data di completamento.

**CASI LIMITE:**
- **Trasferimento sullo stesso conto:** Se una transazione di trasferimento ha lo stesso conto sia come origine che come destinazione (`contoId === contoDestinazioneId`), il calcolo del saldo deve prima sottrarre e poi sommare l'importo, lasciando il saldo finale inalterato.
- **ID generati nello stesso millisecondo:** Verificare che chiamate concorrenti ravvicinate a `generateId()` non causino collisioni grazie al suffisso casuale.
- **Scadenze degli obiettivi scadute:** Se la data di scadenza di un obiettivo di risparmio è già passata e l'obiettivo non è completato, `isOverdue` deve essere `true` e `daysRemaining` negativo.
- **Target nullo (`importoTarget = 0`):** Nei progressi di budget e risparmio, se il target è 0, le percentuali devono essere impostate a 0 o 100 in modo sicuro senza causare errori matematici.

**CASI DI ERRORE:**
- **Presenza di virgolette nei campi delle transazioni nel CSV:** Se il campo descrizione contiene doppi apici (es. `Spesa "ufficio"`), il CSV risulterà malformato a causa di delimitatori non gestiti.
- **Date non parseabili:** Input di date invalide negli helper di formattazione o di progresso temporale produrrà valori `NaN` o stringhe `"Invalid Date"`.

**NOTE PER L'ARCHITETTO:**
- **Bug di Escaping in `exportToCSV`:** Alla riga 165, la funzione avvolge i valori semplicemente tra doppi apici: `row.map(cell => `"${cell}"`)`. Se la descrizione della transazione contiene delle virgolette doppie (es. `Cena "di lavoro"`), il CSV finale risulterà malformato ed i parser falliranno la lettura. Si raccomanda di effettuare l'escaping raddoppiando i doppi apici (`cell.replace(/"/g, '""')`).
- **Problema di timezone in `formatDateShort`:** La funzione ricava giorno e mese tramite `date.getDate()` e `date.getMonth()`, che si basano sul fuso orario locale del dispositivo. Se i test vengono eseguiti su un server con fuso orario UTC, una data registrata alle `2026-06-27T00:00:00Z` potrebbe essere interpretata come il giorno precedente (es. `26/06/26` se localizzato a ovest rispetto a UTC). Si raccomanda di utilizzare metodi UTC (`getUTCDate()`, `getUTCMonth()`) per garantire consistenza assoluta nei test e in produzione.

---

### MODULO: [engine.ts](file:///c:/Sviluppo/ZecchinoReact/src/accessibility/engine.ts)
**SCOPO:** Espone un motore singleton per la sintesi vocale di annunci di accessibilità (screen reader) in modo asincrono ed esente da eccezioni runtime (fire-and-forget).

**DIPENDENZE DA MOCKARE:**
- `AccessibilityInfo` di `react-native`: Dipendenza primaria da simulare per verificare se il metodo `announceForAccessibility` viene invocato con il testo corretto.
- Variabile globale `__DEV__`: Per testare se il log in console di errore viene eseguito unicamente in modalità sviluppo quando l'API non è supportata dal dispositivo.

**CASI NORMALI:**
- **Caso 1: Annuncio con testo valido**
  - *Input atteso:* Un oggetto `Announcement` con testo valido (es. `{ text: 'Finestra aperta', priority: 'polite' }`).
  - *Output atteso:* La funzione invoca correttamente `AccessibilityInfo.announceForAccessibility('Finestra aperta')` e non restituisce alcun valore.
- **Caso 2: Annuncio vuoto o con soli spazi**
  - *Input atteso:* Oggetto `Announcement` con testo vuoto `""` o contenente solo caratteri di spaziatura `"    "`.
  - *Output atteso:* La chiamata a `AccessibilityInfo` viene intercettata dall'early return e non viene eseguita alcuna azione.

**CASI LIMITE:**
- **Esecuzione in ambiente di test (senza API nativa):** Se `AccessibilityInfo.announceForAccessibility` non è definita (come in Jest o Node), l'engine deve eseguire un fallback silenzioso senza sollevare eccezioni. Se `__DEV__` è attivo, deve stampare un log in console.

**CASI DI ERRORE:**
- **Oggetto Announcement non definito o non conforme:** Se viene passato un valore `null` o un oggetto privo del campo `.text`, la funzione tenterà di eseguire `.trim()` su un valore indefinito, sollevando un'eccezione di runtime. Il sistema deve essere testato per assicurarsi che gestisca tali input in modo controllato.

**NOTE PER L'ARCHITETTO:**
- **Iniezione della variabile `__DEV__`:** Nei test Jest, la variabile globale `__DEV__` potrebbe non essere pre-dichiarata, sollevando errori di riferimento. Sarà necessario impostarla nel setup globale dei test per evitare crash improvvisi.
- **Campo `priority` inutilizzato:** Sebbene l'interfaccia `Announcement` preveda il campo `priority`, esso viene ignorato nel metodo `announce` a causa della mancanza di supporto nativo in React Native 0.82. Questo rappresenta un debito tecnico documentato per future versioni.

---

### MODULO: [detection.ts](file:///c:/Sviluppo/ZecchinoReact/src/accessibility/detection.ts)
**SCOPO:** Fornisce un hook React personalizzato per monitorare lo stato di attivazione dello screen reader (TalkBack/VoiceOver) e calcolare dinamicamente gli adattamenti dell'interfaccia utente (dimensione touch target, velocità animazioni, ritardi temporali), consentendo override manuali persistiti.

**DIPENDENZE DA MOCKARE:**
- `@/context/UserSettingsContext` (`useUserSettings`): Dipendenza obbligatoria. È necessario simulare lo stato delle impostazioni (`talkBackAdaptations` e `talkBackManualOverride`) e intercettare le funzioni asincrone di aggiornamento (`setTalkBackAdaptations` e `setTalkBackManualOverride`) collegate a Supabase.
- `AccessibilityInfo` di `react-native`: Mockare `isScreenReaderEnabled()` (che restituisce una Promise) e l'ascoltatore di eventi `addEventListener('screenReaderChanged', callback)` per simulare cambi di stato a runtime.

**CASI NORMALI:**
- **Caso 1: Rilevamento dello screen reader all'avvio (Mount)**
  - *Input atteso:* `isScreenReaderEnabled` risolve a `true`, nessun override manuale configurato.
  - *Output atteso:* L'hook inizializza lo stato con `talkBackState.isEnabled` = `true`, `isDetected` = `true`, `confidenceLevel` = `'high'` e `adaptationsActive` = `true`.
- **Caso 2: Variazione dello stato nativo a runtime**
  - *Input atteso:* Lo screen reader viene spento dal sistema operativo. Il listener di `screenReaderChanged` viene attivato con valore `false`.
  - *Output atteso:* Lo stato React `talkBackState` si aggiorna immediatamente impostando a `false` l'abilitazione e l'attività delle adattazioni.
- **Caso 3: Override manuale abilitato**
  - *Input atteso:* Chiamata a `enableTalkBack(true)` (override manuale abilitato).
  - *Output atteso:* Invocazione asincrona di `setTalkBackManualOverride(true)` nel contesto utente e aggiornamento immediato dello stato locale a attivo.
- **Caso 4: Calcolo dimensione touch target**
  - *Input atteso:* Metodo `getTouchTargetSize()` chiamato con adattamenti attivi ed `enhancedTouchTargets` abilitato.
  - *Output atteso:* Valore di ritorno pari a 56 (rispetto al valore di default 44).
- **Caso 5: Calcolo durata animazione**
  - *Input atteso:* `getAnimationDuration(300)` con adattamenti attivi e `reducedMotion` abilitato.
  - *Output atteso:* Valore di ritorno pari a 100 (il minimo tra `300 * 0.5` e `100`).
- **Caso 6: Moltiplicatore Timeout**
  - *Input atteso:* `getTimeout(5000)` con adattamenti attivi ed `extendedTimeouts` abilitato.
  - *Output atteso:* Valore di ritorno pari a 10000 (il doppio del valore base).

**CASI LIMITE:**
- **Override manuale senza persistenza (`manual = false`):** Verificare che chiamando `enableTalkBack(false)` lo stato locale passi a attivo ma non venga scritta alcuna modifica nel database.
- **Rimozione dell'override (`resetDetection`):** La chiamata deve impostare l'override a `null` nel database, rileggere lo stato di `isScreenReaderEnabled` nativo e allineare lo stato locale a quello reale.
- **Cleanup del hook (Unmount):** All'unmount del componente, verificare che la rimozione della sottoscrizione avvenga in modo sicuro chiamando `.remove()` solo se la funzione esiste, prevenendo eccezioni su sistemi legacy.

**CASI DI ERRORE:**
- **Esecuzione fuori dal Provider:** Se l'hook viene chiamato in un sotto-albero non racchiuso da `UserSettingsProvider`, `useUserSettings` fallirà lanciando un errore bloccante.
- **Fallimento del database (Supabase offline):** Se le funzioni di salvataggio come `setTalkBackManualOverride` restituiscono una Promise rifiutata, l'errore deve essere catturato silenziosamente tramite il blocco `.catch(console.error)` interno, per non bloccare l'interfaccia utente.

**NOTE PER L'ARCHITETTO:**
- **Instabilità dello stato con `manual = false`:** Quando si chiama `enableTalkBack(false)`, l'override non viene scritto nel database (`manualOverride` resta `null` o invariato). Tuttavia, se successivamente si scatena un evento di sistema `screenReaderChanged`, l'effetto rilegverà che `manualOverride` è assente e reimposterà lo stato dell'hook sul valore nativo (es. `false`), cancellando l'abilitazione locale impostata in precedenza. È importante valutare se questo comportamento transitorio sia intenzionale o costituisca un'anomalia.
- **Rischio di Sottoscrizione Undefined:** Nel cleanup del listener, il codice esegue `if (typeof subscription.remove === 'function') { subscription.remove(); }`. Tuttavia, se `AccessibilityInfo.addEventListener` restituisce un valore nullo o non definito (come in alcuni ambienti di test mockati parzialmente), il tentativo di accedere a `.remove` provocherà un crash. Si consiglia di aggiungere un controllo protettivo sull'esistenza dell'oggetto: `subscription && typeof subscription.remove === 'function'`.

---

## Note Trasversali
1. **Fusi Orari e calcoli temporali:** Molti dei moduli (`budget-forecasting`, `budget-history` e `helpers`) manipolano le date istanziando oggetti `new Date()` a partire da stringhe ISO. Nei test, questo può generare comportamenti discordanti a seconda del fuso orario in cui viene eseguito Jest (locale vs UTC del server CI). Tutti i calcoli che estraggono giorno/mese dovrebbero essere testati in diversi fusi orari simulati per verificarne la timezone-safety.
2. **Uso di CommonJS dinamico:** Il modulo `kdf-provider.ts` utilizza `require()` dinamici in blocchi condizionali per caricare librerie crittografiche a seconda dell'ambiente. Questo pattern richiede un'attenzione particolare nei file di configurazione Jest per evitare errori di risoluzione del modulo durante la scansione statica delle dipendenze.
3. **Persistenza e Gestione Errori in React Native:** L'hook in `detection.ts` cattura gli errori delle chiamate asincrone a database scrivendo in `console.error`. Nei test di integrazione, questo comportamento genererà log sporchi a meno che non si mockino esplicitamente le console o i metodi del provider.
