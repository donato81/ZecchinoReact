```
Ciao. Inizia questa sessione di lavoro leggendo e analizzando
nell'ordine esatto tutti i file elencati qui sotto.
Non fare nulla, non rispondere con analisi, non fare domande
finché non hai letto tutti i file dell'elenco.
Dopo la lettura, produci un breve rapporto di allineamento
che confermi ogni file letto, riporti la versione corrente
del progetto dal CHANGELOG, e segnali eventuali file
non trovati o illeggibili.

════════════════════════════════════════
FILE DA LEGGERE — ORDINE OBBLIGATORIO
════════════════════════════════════════

BLOCCO 1 — Radice del progetto

  README.md
  CHANGELOG.md
  SPARK-START.md

BLOCCO 2 — Documentazione principale

  docs/architettura.md
  docs/api.md
  docs/todo-master.md

BLOCCO 3 — Architettura e decisioni tecniche

  docs/0-architecture/ADR_001_sistema-annunci-accessibili.md

BLOCCO 4 — Report di analisi

  (leggi tutti i file presenti nella cartella)
  docs/1-reports/

BLOCCO 5 — Documenti di design (DESIGN)

  (leggi tutti i file presenti nella cartella)
  docs/2-projects/

BLOCCO 6 — Coding plans

  (leggi tutti i file presenti nella cartella)
  docs/3-coding-plans/

BLOCCO 7 — Todo lists di progetto

  (leggi tutti i file presenti nella cartella)
  docs/4-todo-lists/

BLOCCO 8 — SQL e schema database

  (leggi tutti i file presenti nella cartella)
  docs/6-sql/

════════════════════════════════════════
NOTE IMPORTANTI SUL CONTESTO
════════════════════════════════════════

Il progetto si chiama ZecchinoReact.
È un'app React Native crossplatform con focus principale
su Windows. La cartella src contiene codice in fase
di refactoring attivo: non leggerla, non analizzarla,
non trarre conclusioni da essa. Potrebbe contenere
codice incompleto o superato.

Il codice non è ancora in fase implementativa.
Tutta la pianificazione avviene prima tramite documenti
di design (DESIGN), coding plan e todo list.
Solo quando tutta la documentazione è completa
si attivano gli agenti coder in sequenza.

La piattaforma di sviluppo è Windows. Il developer
è non vedente e usa NVDA come screen reader.
L'accessibilità è una priorità architetturale,
non un'aggiunta futura.

════════════════════════════════════════
STATO CORRENTE DEL PROGETTO
════════════════════════════════════════

Ultimo commit rilevante: 0f35bb8c — 21 maggio 2026
Versione attiva: 0.1.0

Fase attiva: P0 — Fix Blocchi di Avvio
Blocco in carico: P0.B1 — Fix babel.config.js
Nessun blocco ancora validato.

Ciclo di analisi documentale completato:
DESIGN 001 e DESIGN 002 analizzati, verificati
e convalidati dal consiglio AI.
Correzioni documentali applicate e chiuse:
  A1 — PLAN 001: riferimento stale "sezione 10 DESIGN" rimosso
  A2 — PLAN 002 / TODO 002: offset righe isScreenReaderActive
       corretto a 64–66
  A3 — DESIGN 002: ordine frontmatter corretto a (N11, N8, N6)
  C2-NOTA — PLAN 002: nota operativa rischio screen-reader.ts
             inserita prima dell'avvio di DESIGN 003

Stato dei DESIGN:
  DESIGN 001: READY FOR IMPLEMENTATION
  DESIGN 002: ARCHITECTURALLY READY —
              bloccato da DESIGN 001 non ancora implementato
  DESIGN 003: da analizzare nel prossimo ciclo
  DESIGN 004: da analizzare nel prossimo ciclo

Prossima azione pianificata:
  Avvio ciclo di analisi coerenza DESIGN 003 e DESIGN 004,
  con lo stesso metodo usato per DESIGN 001 e 002:
  lettura file, report, validazione consiglio AI,
  eventuali correzioni chirurgiche.
  Solo dopo analisi completa di 003 e 004 si avvia
  il Coding Plan 001 (P0.B1).

Nota operativa attiva:
  Non testare i path PIN e sblocco conto privato
  (unlockPrivate, setPin, changePin, removePin)
  fino al completamento di DESIGN 003.
  Motivo: src/lib/screen-reader.ts contiene
  initializeLiveRegions() senza guard DOM.
  Questo file sarà rimosso e riscritto da DESIGN 003.

File workspace interno modificato fuori scope
nell'ultimo commit (impatto nullo su governance):
  Zecchino-React-work-spaces-ai/1-prima-analisi-consiglieri.md
  Monitorare nei prossimi prompt: esplicitare sempre
  se i file workspace devono preservare lo storico
  o possono essere sovrascritti.

════════════════════════════════════════

Solo dopo aver letto tutto e prodotto il rapporto
di allineamento, sei pronto a ricevere istruzioni.
```
