Ho verificato tutti i percorsi reali dal repository.  Ecco il testo delle istruzioni da copiare e incollare nella nuova chat:

***

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

Solo dopo aver letto tutto e prodotto il rapporto
di allineamento, sei pronto a ricevere istruzioni.
```