---
tipo: todo
titolo: "TODO — Test Sessione E3 — Contesto Principale e Autenticazione (AuthContext & AppDataContext)"
riferimento-plan: docs/3-coding-plans/026-PLAN_test-sessione-E3-authctx-appdatactx_v1.0.0.md
versione: 1.0.0
data-creazione: 2026-06-30
stato: PENDING
ramo: main
agente: Antigravity
---

# TODO 026 — Test Sessione E3 — Contesto Principale e Autenticazione (AuthContext & AppDataContext)

## 1. Stato / Snapshot

| Campo | Valore |
|---|---|
| Ultimo Agente Attivo | Antigravity |
| Blocco in Carico | Sessione E3 test — Contesto Principale e Autenticazione (AuthContext & AppDataContext) |
| Last Completed Task | Redazione Coding Plan e Todo List per Sessione E3 |
| Next Action | Esecuzione dei test per il Blocco 2 (Parte 2) |
| Open Threads | — |

---

## 2. Checklist Test per Modulo (in ordine di commit consigliato)

### FASE 0 — Lettura file obbligatoria
- [x] Leggere `SPARK-START.md` (vincoli architetturali e convenzioni)
- [x] Leggere `CHANGELOG.md` (stato corrente della versione)
- [x] Leggere `docs/todo-master.md` (stato globale delle sessioni)
- [x] Leggere `docs/1-reports/REPORT-analisi-copertura-test-completa_v1.0.0.md` (sezione E3)
- [x] Leggere `docs/3-coding-plans/025-PLAN_test-sessione-E2-blocco2_v1.0.0.md` (template PLAN)
- [x] Leggere `docs/4-todo-lists/025-TODO_test-sessione-E2-blocco2_v1.0.0.md` (template TODO)
- [x] Leggere `__tests__/AuthContext.pin.test.tsx` (test PIN preesistenti)
- [x] Leggere `__tests__/AppDataContext.spec.ts` (test cache/export preesistenti)
- [x] Leggere `package.json` (verifica versione corrente)

---

### COMMIT 1 — AuthContext flussi principali
Suite target: `__tests__/AuthContext.test.tsx`

- [ ] **AUTH-01**: `signIn` successo - sessione Supabase e propagazione stato [Normale]
- [ ] **AUTH-02**: `signIn` errore - propaga errore Supabase Auth [Errore]
- [ ] **AUTH-03**: `signUp` successo - creazione utente corretta [Normale]
- [ ] **AUTH-04**: `signUp` errore - propaga eccezione se email duplicata [Errore]
- [ ] **AUTH-05**: `signOut` successo - rimozione PIN locale, blocco stato privato, unmount cache/storage e signOut [Normale]
- [ ] **AUTH-06**: `resetPassword` successo - chiamata corretta a Supabase Auth [Normale]
- [ ] **AUTH-07**: `resetPassword` errore - propagazione fallimenti di rete o email inesistente [Errore]
- [ ] **AUTH-08**: Timer inattività - timeout configurato a zero o meno non fa partire i timer [Limite]
- [ ] **AUTH-09**: Timer inattività - scadenza timer innesca blocco privato e disconnessione automatica [Normale]
- [ ] **AUTH-10**: Avviso sessione - raggiungimento della pre-scadenza (timeout - 1 min) visualizza l'alert [Normale]
- [ ] **AUTH-11**: Reimpostazione timer - clic su "Rimani connesso" resetta il timer a zero [Normale/Limite]
- [ ] **Commit 1 eseguito su main**

---

### COMMIT 2 — AuthContext flussi PIN e screen reader
Suite target: `__tests__/AuthContext.test.tsx`

- [ ] **AUTH-12**: `unlockPrivate` errore - PIN errato rifiuta sblocco, haptic error, suono e annuncio assertive [Errore]
- [ ] **AUTH-13**: Modifica PIN errore - vecchio PIN errato blocca la decifratura Master Key [Errore]
- [ ] **AUTH-14**: Modifica PIN errore - fallimento salvataggio Supabase ripristina PIN precedente [Errore]
- [ ] **AUTH-15**: Rimozione PIN errore - validazione PIN errato impedisce la rimozione [Errore]
- [ ] **AUTH-16**: Rimozione PIN successo - azzera hash/salt/key Master a DB e disconnette [Normale]
- [ ] **AUTH-17**: Mount errore - fallimento getOrCreate impostazioni utente gestito nello stato [Errore]
- [ ] **AUTH-18**: Screen reader mount - registra correttamente il listener nativo di accessibilità [Normale]
- [ ] **AUTH-19**: Screen reader unmount - rimuove il listener nativo e previene leak di memoria [Normale]
- [ ] **AUTH-20**: Cambiamenti accessibilità - eventi nativi aggiornano preferenze locali ed audio/haptic adaptive [Normale/Limite]
- [ ] **Commit 2 eseguito su main**

---

### COMMIT 3A — AppDataContext state machine e bootstrap
Suite target: `__tests__/AppDataContext.spec.ts`

- [ ] **ADC-29**: State machine - transizione da IDLE a HYDRATING al mount [Normale]
- [ ] **ADC-30**: State machine - transizione a READY su successo sync remoto [Normale]
- [ ] **ADC-31**: State machine - transizione a CACHE-READY se offline con cache valida [Normale]
- [ ] **ADC-32**: State machine - transizione a ERROR se offline senza cache [Errore]
- [ ] **ADC-33**: State machine - transizione a REMOTE-SYNC su riconnessione e refresh [Normale]
- [ ] **ADC-34**: State machine - transizione da REMOTE-SYNC a READY su caricamento completato [Normale]
- [ ] **ADC-35**: State machine - transizione da READY a REMOTE-SYNC su refreshAll manuale [Normale]
- [ ] **ADC-36**: State machine - transizione IDLE -> READY non ammessa lancia warning [Errore]
- [ ] **ADC-37**: State machine - transizione ERROR -> READY non ammessa bloccata [Errore]
- [ ] **ADC-38**: State machine - cambi rapidi e concorrenti di login/logout preservano lo stato [Limite]
- [ ] **Commit 3A eseguito su main**

---

### COMMIT 3B — AppDataContext concorrenza e hydration cache
Suite target: `__tests__/AppDataContext.spec.ts`

- [ ] **ADC-39**: Concorrenza - hydrationGen invalida hydration asincrone lente/scadute [Limite]
- [ ] **ADC-40**: Concorrenza - Strict Mode doppia inizializzazione gestita senza duplicare hydration [Limite]
- [ ] **ADC-41**: Concorrenza - login/logout rapido cancella hydration asincrona pendente precedente [Limite]
- [ ] **ADC-42**: Concorrenza - risposte remote ritardate scartate a seguito di logout dell'utente [Limite]
- [ ] **ADC-43**: Concorrenza - chiamate a refreshAll consecutive vengono limitate [Normale]
- [ ] **ADC-44**: Cache - caricamento corretto da cache offline di tutte le 8 tabelle [Normale]
- [ ] **ADC-45**: Cache - cache mancante per una singola tabella fallisce bootstrap offline [Errore]
- [ ] **ADC-46**: Cache - dati di cache malformati o corrotti intercettati senza crash [Errore]
- [ ] **ADC-47**: Cache - cache valida ma vuota (Caso A) avvia stato pulito senza crash [Limite]
- [ ] **ADC-48**: Cache - cache stale caricata subito per fail-soft, innescando refresh in background [Normale]
- [ ] **Commit 3B eseguito su main**

---

### COMMIT 3C — AppDataContext CRUD base e test negativi P29
Suite target: `__tests__/AppDataContext.spec.ts`

- [ ] **ADC-49**: CRUD Conti - addAccount persiste a DB ed aggiorna lo stato React [Normale]
- [ ] **ADC-50**: CRUD Conti - updateAccount persiste modifiche a DB ed aggiorna lo stato [Normale]
- [ ] **ADC-51**: CRUD Conti - removeAccount cancella record a DB ed aggiorna lo stato [Normale]
- [ ] **ADC-52**: CRUD Movimenti - addTransaction ricalcola saldo conto, persiste e aggiorna stato [Normale]
- [ ] **ADC-53**: CRUD Movimenti - updateTransaction ricalcola saldo conto modificato e persiste [Normale]
- [ ] **ADC-49b**: CRUD Conti - addAccount fallito - stato invariato per vincolo P29 [Errore / P29]
- [ ] **ADC-53b**: CRUD Movimenti - updateTransaction fallito - stato e saldi invariati per vincolo P29 [Errore / P29]
- [ ] **ADC-56b**: CRUD Budget - CRUD budget fallito - stato invariato per vincolo P29 [Errore / P29]
- [ ] **Commit 3C eseguito su main**

---

### COMMIT 4 — AppDataContext CRUD e prestiti
Suite target: `__tests__/AppDataContext.spec.ts`

- [ ] **ADC-54**: CRUD Movimenti - removeTransaction ricalcola saldo ed elimina record a DB [Normale]
- [ ] **ADC-55**: CRUD Categorie - CRUD categorie aggiorna correttamente stato locale e DB [Normale]
- [ ] **ADC-56**: CRUD Budget - CRUD budget aggiorna correttamente stato locale e DB [Normale]
- [ ] **ADC-57**: CRUD Obiettivi - CRUD obiettivi ed avanzamento progressi persistono a DB [Normale]
- [ ] **ADC-58**: CRUD Tag - creazione, modifica ed eliminazione fisica tag persistono a DB [Normale]
- [ ] **ADC-59**: Associazione Tag - addTagToTransaction crea record mapping e incrementa usatoNVolte [Normale]
- [ ] **ADC-60**: Associazione Tag - removeTagFromTransaction rimuove record mapping e decrementa usatoNVolte [Normale]
- [ ] **ADC-61**: Associazione Tag - setTagsForTransaction calcola differenze, aggiorna mapping e contatori [Normale]
- [ ] **ADC-62**: Propagazione Tag - eliminazione transazione riduce usatoNVolte di tutti i tag associati [Normale]
- [ ] **ADC-63**: Propagazione Tag - eliminazione conto riduce usatoNVolte dei tag delle sue transazioni [Normale]
- [ ] **ADC-64**: Prestiti Simulati - creazione prestito simulato (ID sim-) scrive solo in cache locale [Normale]
- [ ] **ADC-65**: Prestiti Simulati - modifica simulazione aggiorna solo lo stato in cache locale [Normale]
- [ ] **ADC-66**: Promozione Prestito - promozione a contratto genera UUID, scrive a DB ed elimina sim- da cache [Limite]
- [ ] **ADC-67**: Prestiti Attivi - chiusura prestito attivo persiste i flag a DB Supabase [Normale]
- [ ] **ADC-68**: Prestiti Simulati - rimozione prestito simulato cancella record da cache locale [Normale]
- [ ] **ADC-69**: Rimborsi Prestiti - aggiunta rimborso su prestito attivo ricalcola residuo e aggiorna DB [Normale]
- [ ] **ADC-70**: Rimborsi Prestiti - rimborso estintivo aggiorna automaticamente lo stato prestito in chiuso [Limite]
- [ ] **ADC-71**: Rimborsi Prestiti - eliminazione rimborso ricalcola residuo incrementandolo e aggiorna DB [Normale]
- [ ] **ADC-72**: Rimborsi Simulazioni - inserimento rimborso su simulazione bloccato con errore [Errore]
- [ ] **ADC-73**: Rimborsi Simulazioni - eliminazione rimborso su simulazione bloccato con errore [Errore]
- [ ] **Commit 4 eseguito su main**

---

### COMMIT 5 — AppDataContext dialoghi, export e alert
Suite target: `__tests__/AppDataContext.spec.ts`

- [ ] **ADC-74**: Dialoghi - apertura dialogo valorizza activeDialog e popola il form temporaneo [Normale]
- [ ] **ADC-75**: Dialoghi - chiusura dialogo resetta activeDialog e pulisce lo stato dei form [Normale]
- [ ] **ADC-76**: Shortcuts - tasto Escape chiude dialogo, Invio conferma form [Normale]
- [ ] **ADC-77**: Shortcuts - shortcut tastiera per export richiama correttamente handleExportCSV [Normale]
- [ ] **ADC-78**: Dialoghi - modifiche nel form non salvato restano confinate localmente [Normale]
- [ ] **ADC-79**: Export CSV - successo in handleExportCSV emette annuncio screen reader e vibrazione [Normale]
- [ ] **ADC-80**: Export CSV - fallimento in handleExportCSV (es. PERMISSION_DENIED) lancia toast ed annuncio vocale errore [Errore]
- [ ] **ADC-81**: Budget Alerts - spesa al 75% genera notifica budget warning (toast, audio, haptic) [Normale]
- [ ] **ADC-82**: Budget Alerts - spesa al 90% genera notifica budget critical (toast, audio, haptic) [Normale]
- [ ] **ADC-83**: Budget Alerts - spesa al 100% genera notifica budget exceeded (toast, audio, haptic) [Normale]
- [ ] **Commit 5 eseguito su main**

---

## 3. CICLO A — Revisione e Validazione

- [ ] **npx jest --testPathPattern="AuthContext|AppDataContext"** — tutti i test passano
- [ ] **npx tsc --noEmit** — nessun errore TypeScript
- [ ] Nessun test preesistente (compreso il test di BUG-4 in AuthContext) rotto
- [ ] Ciclo A completato (max 10 tentativi)

---

## 4. CICLO B — Revisione Qualitativa

- [ ] Revisione qualitativa completata — nessun false positive
- [ ] Nessun test che verifica l'implementazione interna invece del comportamento
- [ ] Gestione pulita ed unmount completo dei fake timers in tutte le nuove suite
- [ ] Convalida finale tramite `npx jest` e `npx tsc --noEmit` superata
- [ ] Ciclo B completato (max 10 tentativi)

---

## 5. DOCUMENTAZIONE

- [ ] `SPARK-START.md` aggiornato con riferimento alla Sessione E3
- [ ] `CHANGELOG.md` aggiornato con i nuovi test aggiunti e la versione
- [ ] `docs/todo-master.md` aggiornato (TODO 026 → COMPLETED/PENDING)
- [ ] `package.json` — versione invariata (`0.18.6`)
- [ ] Commit documentazione eseguito su main
