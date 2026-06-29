---
tipo: todo
titolo: "TODO — Bugfix sessione E0"
riferimento-plan: docs/3-coding-plans/023-PLAN_bugfix-sessione-E0_v0.18.2.md
versione: 0.18.3
data-creazione: 2026-06-29
stato: COMPLETED
ramo: main
agente: Antigravity
data-completamento: 2026-06-29
note-stato: Tutti i task completati e validati con regression test.
---

# TODO 023 — Bugfix sessione E0

## 1. Stato / Snapshot

| Campo | Valore |
|---|---|
| Ultimo Agente Attivo | Antigravity |
| Blocco in Carico | Sessione E0 bugfix |
| Last Completed Task | Correzione 7 bug e validazione Jest/tsc |
| Next Action | Fine sessione E0 |
| Open Threads | — |

---

## 2. Checklist Bug per Bug (in ordine di esecuzione consigliato)

### BUG-2 — Crash su chiave traduzione mancante
- [x] **Codice:** Implementare la guardia difensiva `typeof result !== 'string'` in `src/announcements/_utils/t.ts`.
- [x] **Test:** Scrivere il regression test per i tre casi: chiave esistente con parametri, chiave esistente senza parametri, chiave inesistente (deve restituire la chiave stessa come stringa).

### BUG-6 — Perdita maiuscola nei plurali irregolari
- [x] **Codice:** Implementare la verifica di capitalizzazione `wasCapitalized` in `src/announcements/_utils/plurals.ts`.
- [x] **Test:** Scrivere il regression test per verificare plurali irregolari minuscoli, irregolari maiuscoli, regolari maiuscoli e parole non nel dizionario.

### BUG-7 — Budget con target zero annunciato come normale
- [x] **Codice:** Aggiungere la gestione del ramo `target <= 0 && spent > 0` in `src/announcements/budgets.ts` con priorità `assertive`.
- [x] **Test:** Scrivere il regression test per verificare target zero con spesa positiva, target zero con spesa zero e target positivo normale.

### BUG-4 — Pattern fragile su subscription in AuthContext
- [x] **Codice:** Applicare la guardia di esistenza per `subscription` in `src/context/AuthContext.tsx` prima di chiamare `.remove()`.
- [x] **Test:** Scrivere il regression test per verificare che il cleanup non lanci eccezioni quando la sottoscrizione è `undefined`.

### BUG-3 — Pattern fragile su subscription in detection.ts
- [x] **Codice:** Applicare la guardia di esistenza per `subscription` in `src/accessibility/detection.ts` prima di chiamare `.remove()`.
- [x] **Test:** Scrivere il regression test per verificare che il cleanup non lanci eccezioni quando la sottoscrizione è `undefined`.

### BUG-5 — hadTransactions fisso a true
- [x] **Codice:** Calcolare dinamicamente `hadTransactions` prima di invocare `removeAccount()` in `src/context/AppDataContext.tsx`.
- [x] **Test:** Scrivere il regression test per verificare l'annuncio vocale dell'eliminazione conto sia con transazioni collegate che senza.
- [x] **Test:** Aggiungere il caso trasferimento: verificare che `hadTransactions` risulti true quando il conto eliminato compare nel campo `contoDestinazioneId` e non solo in `contoId` (scenario di trasferimento in uscita verso il conto eliminato).

### BUG-1 — Perdita simulazioni locali al bootstrap online
- [x] **Codice:** Implementare la logica di recupero e fusione dei prestiti simulati da cache prima di `applyDomainSnapshot` in `runOnlineBootstrap` e `refreshAll` di `src/context/AppDataContext.tsx`.
- [x] **Test:** Scrivere il regression test unitario su `mergePrestitiWithLocalSimulations`
  esportata, coprendo i seguenti 5 casi:
  - lista remota con simulazioni distinte in cache: verifica che il risultato le contenga tutte;
  - lista remota con un ID identico a un elemento in cache: verifica che non compaia due volte;
  - cache null o undefined: verifica che la funzione restituisca solo la lista remota senza errori;
  - cache con un elemento che non è una simulazione (no prefisso sim- e stato diverso): verifica che venga escluso;
  - eccezione durante la lettura della cache: verifica che il bootstrap continui con snapshot remoto puro.
  Non testare funzioni private non esportate. Non testare `runOnlineBootstrap` direttamente.

---

## 3. Chiusura Sessione

- [x] **Versione:** Verificare che `package.json`, `SPARK-START.md` e `CHANGELOG.md` siano coerenti tra loro e riflettano lo stato reale della sessione E0. Nota: `package.json` è già a `0.18.2`. Se la versione finale dell'implementazione richiede un incremento a `0.18.3`, applicarlo in tutti e tre i file in modo coerente. La scelta va dichiarata esplicitamente prima del commit finale.
- [x] **Changelog:** Aggiornare `CHANGELOG.md` registrando la release `0.18.3` con l'elenco delle correzioni dei 7 bug.
- [x] **Spark Start:** Aggiornare `SPARK-START.md` con la versione `0.18.3` e lo stato della Sessione E0.
- [x] **Todo Master:** Aggiornare `docs/todo-master.md` aggiungendo i riferimenti a PLAN 023 e TODO 023 e marcando completata la sessione E0.
- [x] **Verifica:** Eseguire `npx jest` e `npx tsc --noEmit` per garantire la stabilità del build.
- [x] **Push:** Eseguire commit e push su `main` con messaggio: `fix: implementa 7 bugfix sessione E0 con regression test — bump v0.18.3`.
