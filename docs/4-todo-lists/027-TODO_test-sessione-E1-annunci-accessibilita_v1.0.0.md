---
tipo: todo
titolo: "TODO — Test Sessione E1 — Annunci e Accessibilità (Blocco 1)"
riferimento-plan: docs/3-coding-plans/027-PLAN_test-sessione-E1-annunci-accessibilita_v1.0.0.md
versione: 1.0.0
data-creazione: 2026-07-01
stato: PENDING
ramo: main
agente: Gemini 3.5 Flash (Medium) — Sessione E1
---

# TODO 027 — Test Sessione E1 — Annunci e Accessibilità (Blocco 1)

## 1. Stato / Snapshot

| Campo | Valore |
|---|---|
| Ultimo Agente Attivo | Claude Sonnet 4.6 Thinking — Sessione E1-PLAN |
| Blocco in Carico | Sessione E1 test — Annunci e Accessibilità (Blocco 1) |
| Last Completed Task | — |
| Next Action | Commit 1 — test: aggiunge suite completa per currency.ts |
| Open Threads | — |
| Assegnato a | Gemini 3.5 Flash (Medium) — Sessione E1 |

---

## 2. FASE 0 — Lettura file obbligatoria

- [ ] Leggere `SPARK-START.md` (versione corrente e vincoli architetturali)
- [ ] Leggere `CHANGELOG.md` (stato corrente versione)
- [ ] Leggere `docs/todo-master.md` (stato globale delle sessioni)
- [ ] Leggere `docs/1-reports/REPORT-analisi-copertura-test-completa_v1.0.0.md` (Blocco 1)
- [ ] Leggere `docs/3-coding-plans/027-PLAN_test-sessione-E1-annunci-accessibilita_v1.0.0.md` (questo PLAN)
- [ ] Leggere i file sorgente da testare:
  - [ ] `src/announcements/_utils/currency.ts`
  - [ ] `src/announcements/_utils/plurals.ts`
  - [ ] `src/announcements/_utils/t.ts`
  - [ ] `src/announcements/index.ts`
  - [ ] `src/announcements/auth.ts`
  - [ ] `src/announcements/accounts.ts`
  - [ ] `src/announcements/budgets.ts`
  - [ ] `src/announcements/ui.ts`
  - [ ] `src/accessibility/detection.ts`
  - [ ] `App.tsx`
- [ ] Leggere le suite di test esistenti da estendere:
  - [ ] `__tests__/plurals.test.ts` (4 regression test Sessione E0 esistenti)
  - [ ] `__tests__/t.test.ts` (3 regression test Sessione E0 esistenti)
  - [ ] `src/accessibility/__tests__/detection.test.ts` (11 test esistenti)
  - [ ] `__tests__/App.test.tsx` (1 test esistente)

> **DIVIETO OPERATIVO (obbligatorio):** Nelle suite contrassegnate come [MODIFY] — `plurals.test.ts`, `t.test.ts`, `detection.test.ts`, `App.test.tsx` — aggiungere **solo nuovi test alla fine** della suite esistente. Non cancellare, rinominare, disabilitare, commentare o indebolire test già esistenti. Se una modifica a un test preesistente è necessaria, fermarsi e produrre un Diagnostic Report dettagliato prima di procedere.

---

## 3. Checklist Test per Commit (in ordine di esecuzione consigliato)

### COMMIT 1 — `test: aggiunge suite completa per currency.ts`
Suite target: `__tests__/currency.test.ts` [NEW]

- [ ] **UTLC-01**: `formatCurrencyVocal(1234.56)` → `"1.234,56 euro"` (separatore migliaia punto, decimali virgola) [Normale]
- [ ] **UTLC-02**: `formatCurrencyVocal(0)` → `"0,00 euro"` (zero formattato correttamente) [Limite]
- [ ] **Commit 1 eseguito su main**

---

### COMMIT 2 — `test: aggiunge suite completa per plurals.ts`
Suite target: `__tests__/plurals.test.ts` [MODIFY] (+7 ai 4 esistenti)

- [ ] **UTLP-01**: `pluralize('movimento', 1)` → `'movimento'` (singolare invariato) [Normale/Limite]
- [ ] **UTLP-02**: `pluralize('movimento', 3)` → `'movimenti'` (irregolare — verifica ACC-2) [Normale]
- [ ] **UTLP-03**: `pluralize('euro', 5)` → `'euro'` (invariabile — verifica ACC-2) [Normale]
- [ ] **UTLP-04**: `pluralize('documento', 2)` → `'documenti'` (regola -o → -i) [Normale]
- [ ] **UTLP-05**: `pluralize('nota', 2)` → `'note'` (regola -a → -e) [Normale]
- [ ] **UTLP-06**: `pluralize('Movimento', 2)` → `'Movimenti'` (capitalizzazione preservata — regressione BUG-6) [Limite]
- [ ] **UTLP-07**: `pluralize('mese', 3)` → `'mesi'` (regola -e → -i) [Normale]
- [ ] **Commit 2 eseguito su main**

---

### COMMIT 3 — `test: aggiunge suite completa per t.ts`
Suite target: `__tests__/t.test.ts` [MODIFY] (+4 ai 3 esistenti)

- [ ] **UTLT-01**: `t('conto_creato')` senza params → stringa originale non interpolata [Normale]
- [ ] **UTLT-02**: `t('conto_creato', { name, type, amount })` → interpolazione corretta di tutti i placeholder [Normale]
- [ ] **UTLT-03**: `t('conto_creato', { name: 'Solo Nome' })` con params parziali → placeholder non risolti rimangono nel testo [Limite]
- [ ] **UTLT-04**: `t('chiave_inesistente', { name: 'test' })` → fallback `'chiave_inesistente'` senza crash (regressione BUG-2) [Errore]
- [ ] **Commit 3 eseguito su main**

---

### COMMIT 4 — `test: aggiunge suite completa per index.ts`
Suite target: `__tests__/index.announcements.test.ts` [NEW]

- [ ] **ANNI-01**: `announce({ text: '...', priority: 'polite' })` → `engine.announce` chiamato con oggetto identico [Normale]
- [ ] **ANNI-02**: `announce({ text: '...', priority: 'assertive' })` → `engine.announce` chiamato con priorità assertive preservata [Normale]
- [ ] **Commit 4 eseguito su main**

---

### COMMIT 5 — `test: aggiunge suite completa per auth.ts`
Suite target: `__tests__/auth.announcements.test.ts` [NEW]

- [ ] **ANNU-01**: `pinNotConfigured()` → priorità `'assertive'` (verifica ACC-1) [Normale]
- [ ] **ANNU-02**: `pinInvalid()` → priorità `'assertive'` (verifica ACC-1) [Normale]
- [ ] **ANNU-03**: `privateUnlocked()` → priorità `'polite'` [Normale]
- [ ] **ANNU-04**: `privateAccountLocked()` → priorità `'polite'` [Normale]
- [ ] **ANNU-05**: `pinSet()` → priorità `'polite'` [Normale]
- [ ] **ANNU-06**: `pinChanged()` → priorità `'polite'` [Normale]
- [ ] **ANNU-07**: `pinRemoved()` → priorità `'polite'` [Normale]
- [ ] **ANNU-08**: `sessionKept()` → priorità `'polite'` [Normale]
- [ ] **ANNU-09**: Test consolidato ACC-1 — `pinNotConfigured` e `pinInvalid` hanno entrambe priorità `'assertive'` [Normale]
- [ ] **ANNU-10**: Test consolidato — le 6 funzioni non-errore hanno tutte priorità `'polite'` [Normale]
- [ ] **Commit 5 eseguito su main**

---

### COMMIT 6 — `test: aggiunge suite completa per accounts.ts`
Suite target: `__tests__/accounts.announcements.test.ts` [NEW]

- [ ] **ANNA-01**: `announceAccountCreated('Conto', 'corrente', 1234.56)` → chiama `t('conto_creato', ...)` e `formatCurrencyVocal` — priorità `'polite'` [Normale]
- [ ] **ANNA-02**: `announceAccountModified('Conto')` → chiama `t('conto_modificato', { name })` — priorità `'polite'` [Normale]
- [ ] **ANNA-03**: `announceAccountDeleted('Conto', true)` → chiama `t('conto_eliminato_con_movimenti', ...)` [Normale]
- [ ] **ANNA-04**: `announceAccountDeleted('Conto', false)` → chiama `t('conto_eliminato', ...)` [Normale]
- [ ] **ANNA-05**: `announceAccountDeletedGeneric()` → chiama `t('conto_eliminato_generico')` [Normale]
- [ ] **ANNA-06**: `announceTransaction('Uscita', 99.50, 'Conto Corrente')` → chiama `t('movimento_aggiunto', ...)` e `formatCurrencyVocal` [Normale]
- [ ] **ANNA-07**: `announceTransactionModified()` → chiama `t('movimento_modificato')` [Normale]
- [ ] **ANNA-08**: `announceTransactionDeleted()` → chiama `t('movimento_eliminato')` [Normale]
- [ ] **ANNA-09**: `announceTransfer(500, 'Conto A', 'Conto B')` → chiama `t('trasferimento_completato', ...)` e `formatCurrencyVocal` [Normale]
- [ ] **ANNA-10**: `announceAccountBalance('Conto', 2500.00)` → chiama `t('saldo_conto', ...)` e `formatCurrencyVocal` [Normale]
- [ ] **ANNA-11**: `announceRecentTransactions(1)` → chiama `pluralize('movimento', 1)` — singolare [Normale/Limite]
- [ ] **ANNA-12**: `announceRecentTransactions(5)` → chiama `pluralize('movimento', 5)` — plurale (verifica ACC-2) [Normale]
- [ ] **ANNA-13**: `announceRecentTransactions(0)` → chiama `pluralize('movimento', 0)` — caso zero [Limite]
- [ ] **ANNA-14**: `announceExportCSV(1)` → chiama `pluralize('movimento', 1)` e `t('export_csv_completato', ...)` [Normale]
- [ ] **ANNA-15**: `announceExportCSV(10)` → chiama `pluralize('movimento', 10)` count > 1 (verifica ACC-2) [Normale]
- [ ] **ANNA-16**: `announceExport(1)` → chiama `pluralize('elemento', 1)` e `t('export_completato', ...)` [Normale]
- [ ] **ANNA-17**: `announceExport(3)` → chiama `pluralize('elemento', 3)` count > 1 (verifica ACC-2) [Normale]
- [ ] **ANNA-18**: `announceImportComplete(1)` → chiama `pluralize('elemento', 1)` e `t('import_completato', ...)` [Normale]
- [ ] **ANNA-19**: `announceExportInProgress()` → chiama `t('export_in_corso')` — priorità `'polite'` [Normale]
- [ ] **ANNA-20**: `announceExportFile(5)` → chiama `t('export_success_sr')` — `_count` ignorato [Normale]
- [ ] **ANNA-21**: `exportError` — `test.each` sui 7 `ExportFailureReason` (ALREADY_IN_PROGRESS, PERMISSION_DENIED, FILESYSTEM_ERROR, UNSUPPORTED_PLATFORM, INVALID_PATH, INSUFFICIENT_SPACE, UNKNOWN). Per ogni reason: verificare chiave `t(...)` attesa e `priority: 'assertive'` (verifica ACC-1). Il codice sorgente è stato corretto nella sessione E1-FIX. [Errore]
- [ ] **Commit 6 eseguito su main**

---

### COMMIT 7 — `test: aggiunge suite completa per budgets.ts`
Suite target: `__tests__/budgets.announcements.test.ts` [NEW]

- [ ] **ANNB-01**: `announceBudgetCreated('Spesa Casa', 1200, 'mensile')` → chiama `t('budget_creato', ...)` e `formatCurrencyVocal` — priorità `'polite'` [Normale]
- [ ] **ANNB-02**: `announceBudgetModified('Spesa Casa')` → chiama `t('budget_modificato', { name })` [Normale]
- [ ] **ANNB-03**: `announceBudgetDeleted('Spesa Casa')` → chiama `t('budget_eliminato', { name })` [Normale]
- [ ] **ANNB-04**: `announceBudgetDeletedGeneric()` → chiama `t('budget_eliminato_generico')` [Normale]
- [ ] **ANNB-05**: `announceBudgetStatus('Spesa', 1200, 1000)` 120% → priorità `'assertive'`, chiave `'budget_superato'` (verifica ACC-1) [Normale/Limite]
- [ ] **ANNB-06**: `announceBudgetStatus('Spesa', 950, 1000)` 95% → priorità `'assertive'`, chiave `'budget_critico'` (verifica ACC-1) [Normale]
- [ ] **ANNB-07**: `announceBudgetStatus('Spesa', 800, 1000)` 80% → priorità `'polite'`, chiave `'budget_attenzione'` [Normale]
- [ ] **ANNB-08**: `announceBudgetStatus('Spesa', 500, 1000)` 50% → priorità `'polite'`, chiave `'budget_normale'` [Normale]
- [ ] **ANNB-09**: `announceSavingsGoalCreated('Vacanze', 3000)` → chiama `t('obiettivo_creato', ...)` e `formatCurrencyVocal` [Normale]
- [ ] **ANNB-10**: `announceSavingsGoalModified('Vacanze')` → chiama `t('obiettivo_modificato', { name })` [Normale]
- [ ] **ANNB-11**: `announceBudgetStatus('Spesa', 50, 0)` target zero + spent > 0 → priorità `'assertive'` (regressione BUG-7 — verifica ACC-1) [Limite]
- [ ] **ANNB-12**: `announceSavingsGoalDeleted('Vacanze')` → chiama `t('obiettivo_eliminato', { name })` [Normale]
- [ ] **ANNB-13**: `announceSavingsGoalDeletedGeneric()` → chiama `t('obiettivo_eliminato_generico')` [Normale]
- [ ] **ANNB-14**: `announceSavingsGoalProgress('Vacanze', 3200, 3000)` >= 100% → chiama `t('obiettivo_completato', ...)` [Normale/Limite]
- [ ] **ANNB-15**: `announceSavingsGoalProgress('Vacanze', 2500, 3000)` 83% (>= 75%) → chiama `t('obiettivo_quasi_completato', ...)` [Normale]
- [ ] **ANNB-16**: `announceSavingsGoalProgress('Vacanze', 1500, 3000)` 50% (< 75%) → chiama `t('obiettivo_progresso', ...)` [Normale]
- [ ] **ANNB-17**: `announceCategoryCreated('Casa')` → chiama `t('categoria_creata', { name: 'Casa' })` e restituisce Announcement con `priority: 'polite'` [Normale]
- [ ] **Commit 7 eseguito su main**

---

### COMMIT 8 — `test: aggiunge suite completa per ui.ts`
Suite target: `__tests__/ui.announcements.test.ts` [NEW]

- [ ] **ANNX-01**: `modificatoConSuccesso('Conto')` → `t('modificato_con_successo', { name })` — priorità `'polite'` [Normale]
- [ ] **ANNX-02**: `eliminatoConSuccesso('Budget')` → `t('eliminato_con_successo', { name })` — priorità `'polite'` [Normale]
- [ ] **ANNX-03**: `creatoConSuccesso('Obiettivo')` → `t('creato_con_successo', { name })` — priorità `'polite'` [Normale]
- [ ] **ANNX-04**: `aggiuntoConSuccesso('Movimento')` → `t('aggiunto_con_successo', { name })` — priorità `'polite'` [Normale]
- [ ] **ANNX-05**: `salvatoConSuccesso('Impostazioni')` → `t('salvato_con_successo', { name })` — priorità `'polite'` [Normale]
- [ ] **ANNX-06**: `operazioneCompletata()` → `t('operazione_completata')` — priorità `'polite'` [Normale]
- [ ] **ANNX-07**: `operazioneAnnullata()` → `t('operazione_annullata')` — priorità `'polite'` [Normale]
- [ ] **ANNX-08**: `erroreGenerico()` → `t('errore_generico')` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [ ] **ANNX-09**: `erroreRete()` → `t('errore_rete')` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [ ] **ANNX-10**: `erroreValidazione()` → `t('errore_validazione')` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [ ] **ANNX-11**: `caricamentoInCorso()` → `t('caricamento_in_corso')` — priorità `'polite'` [Normale]
- [ ] **ANNX-12**: `caricamentoCompletato()` → `t('caricamento_completato')` — priorità `'polite'` [Normale]
- [ ] **ANNX-13**: `nessunDato()` → `t('nessun_dato')` — priorità `'polite'` [Normale]
- [ ] **ANNX-14**: `nessunRisultato()` → `t('nessun_risultato')` — priorità `'polite'` [Normale]
- [ ] **ANNX-15**: `confermaRichiesta()` → `t('conferma_richiesta')` — priorità `'polite'` [Normale]
- [ ] **ANNX-16**: `confermaEliminazione('Budget Casa')` → `t('conferma_eliminazione', { name })` — priorità `'polite'` [Normale]
- [ ] **ANNX-17**: `modificaNonSalvata()` → `t('modifica_non_salvata')` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [ ] **ANNX-18**: `modificheSalvate()` → `t('modifiche_salvate')` — priorità `'polite'` [Normale]
- [ ] **ANNX-19**: `campoObbligatorio('Email')` → `t('campo_obbligatorio', { name })` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [ ] **ANNX-20**: `formatoNonValido('Importo')` → `t('formato_non_valido', { name })` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [ ] **ANNX-21**: `importoNonValido()` → `t('importo_non_valido')` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [ ] **ANNX-22**: `dataNonValida()` → `t('data_non_valida')` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [ ] **ANNX-23**: `selezioneRichiesta('Categoria')` → `t('selezione_richiesta', { name })` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [ ] **ANNX-24**: `schermataAperta('Home')` → `t('schermata_aperta', { name })` — priorità `'polite'` [Normale]
- [ ] **ANNX-25**: `dialogoAperto('Aggiungi Conto')` → `t('dialogo_aperto', { name })` — priorità `'polite'` [Normale]
- [ ] **ANNX-26**: `dialogoChiuso()` → `t('dialogo_chiuso')` — priorità `'polite'` [Normale]
- [ ] **ANNX-27**: Test consolidato ACC-1 — le 9 funzioni di errore hanno tutte priorità `'assertive'` [Normale]
- [ ] **ANNX-28**: Test consolidato — le 17 funzioni non-errore hanno tutte priorità `'polite'` [Normale]
- [ ] **ANNX-29**: `campoObbligatorio('')` con name vuoto → nessun crash [Limite]
- [ ] **ANNX-30**: Verifica struttura Announcement: `text` stringa e `priority` in `['polite', 'assertive']` [Normale]
- [ ] **Commit 8 eseguito su main**

---

### COMMIT 9 — `test: integra test aggiuntivi per detection.ts`
Suite target: `src/accessibility/__tests__/detection.test.ts` [MODIFY] (+2 agli 11 esistenti)

> **Nota:** riutilizzare l'harness esistente in `detection.test.ts` (funzione `renderHook` locale righe 23-35, `mockUserSettings` nel `beforeEach`, spy su `AccessibilityInfo`). Non creare un nuovo `renderHook` o un nuovo wrapper.

- [ ] **INTD-01**: `disableTalkBack(true)` → chiama `setTalkBackManualOverride(false)` e aggiorna stato — righe 129-132 scoperte (verifica ACC-1 indiretta) [Normale]
- [ ] **INTD-02**: `disableTalkBack(false)` → disabilita adattazioni locali senza chiamare `setTalkBackManualOverride` [Normale]
- [ ] **Commit 9 eseguito su main**

---

### COMMIT 10 — `test: integra test aggiuntivo per App.tsx`
Suite target: `__tests__/App.test.tsx` [MODIFY] (+1 all'1 esistente)

- [ ] **INTZ-01**: `<AppContent />` con autenticazione simulata → `useSafeAreaInsets` chiamato, nessuna eccezione (righe 33-35 scoperte) [Normale]
- [ ] **Commit 10 eseguito su main**

---

## 4. CICLO A — Revisione e Validazione Tecnica

- [ ] **npx jest --testPathPattern="currency|plurals|t\.test|announcements|detection|App\.test"** — tutti i 95 nuovi test passano
- [ ] **npx tsc --noEmit** — nessun errore TypeScript
- [ ] Nessun test preesistente (554 totali) rotto
- [ ] Ciclo A completato (max 10 tentativi)

---

## 5. CICLO B — Revisione Qualitativa

- [ ] Revisione qualitativa completata — nessun false positive
- [ ] Verifica ACC-1: ogni funzione di errore testata ha asserzione su `priority: 'assertive'`
- [ ] Verifica ACC-2: ogni funzione con plurali testata verifica la chiamata a `pluralize`
- [ ] Ogni suite moca autonomamente le proprie dipendenze (isolamento garantito)
- [ ] Ciclo B completato (max 10 tentativi)

---

## 6. DOCUMENTAZIONE

- [ ] `SPARK-START.md` aggiornato — campo "Prossima azione" → Sessione E1 pronta per esecuzione
- [ ] `CHANGELOG.md` aggiornato — voce per creazione PLAN 027 e TODO 027
- [ ] `docs/todo-master.md` aggiornato — TODO 027 aggiunto con stato PENDING
- [ ] Commit documentazione eseguito su main
- [ ] `git push origin main` eseguito e verificato con `git log -n 3 --oneline`

---

## 7. Riepilogo

| Commit | File di Test | Test Nuovi | Stato |
|---|---|---|---|
| 1 — currency.ts | `__tests__/currency.test.ts` [NEW] | 2 | [ ] |
| 2 — plurals.ts | `__tests__/plurals.test.ts` [MODIFY] | 7 | [ ] |
| 3 — t.ts | `__tests__/t.test.ts` [MODIFY] | 4 | [ ] |
| 4 — index.ts | `__tests__/index.announcements.test.ts` [NEW] | 2 | [ ] |
| 5 — auth.ts | `__tests__/auth.announcements.test.ts` [NEW] | 10 | [ ] |
| 6 — accounts.ts | `__tests__/accounts.announcements.test.ts` [NEW] | 21 | [ ] |
| 7 — budgets.ts | `__tests__/budgets.announcements.test.ts` [NEW] | 17 | [ ] |
| 8 — ui.ts | `__tests__/ui.announcements.test.ts` [NEW] | 30 | [ ] |
| 9 — detection.ts | `src/accessibility/__tests__/detection.test.ts` [MODIFY] | 2 | [ ] |
| 10 — App.tsx | `__tests__/App.test.tsx` [MODIFY] | 1 | [ ] |
| **TOTALE** | | **96** | |

**Test pre-Sessione E1:** 554
**Test post-Sessione E1 (attesi):** 650
