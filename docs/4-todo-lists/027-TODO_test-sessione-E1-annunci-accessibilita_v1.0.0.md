---
tipo: todo
titolo: "TODO — Test Sessione E1 — Annunci e Accessibilità (Blocco 1)"
riferimento-plan: docs/3-coding-plans/027-PLAN_test-sessione-E1-annunci-accessibilita_v1.0.0.md
versione: 1.0.0
data-creazione: 2026-07-01
stato: COMPLETED
ramo: main
agente: Antigravity — Sessione E1
---

# TODO 027 — Test Sessione E1 — Annunci e Accessibilità (Blocco 1)

## 1. Stato / Snapshot

| Campo | Valore |
|---|---|
| Ultimo Agente Attivo | Claude Sonnet 4.6 Thinking — Sessione E1-PLAN | Antigravity — Sessione E1 |
| Blocco in Carico | Sessione E1 test — Annunci e Accessibilità (Blocco 1) |
| Last Completed Task | Sessione E1 test |
| Next Action | Commit 1 — test: aggiunge suite completa per currency.ts |
| Open Threads | — |
| Assegnato a | Antigravity — Sessione E1 |

---

## 2. FASE 0 — Lettura file obbligatoria

- [x] Leggere `SPARK-START.md` (versione corrente e vincoli architetturali)
- [x] Leggere `CHANGELOG.md` (stato corrente versione)
- [x] Leggere `docs/todo-master.md` (stato globale delle sessioni)
- [x] Leggere `docs/1-reports/REPORT-analisi-copertura-test-completa_v1.0.0.md` (Blocco 1)
- [x] Leggere `docs/3-coding-plans/027-PLAN_test-sessione-E1-annunci-accessibilita_v1.0.0.md` (questo PLAN)
- [x] Leggere i file sorgente da testare:
  - [x] `src/announcements/_utils/currency.ts`
  - [x] `src/announcements/_utils/plurals.ts`
  - [x] `src/announcements/_utils/t.ts`
  - [x] `src/announcements/index.ts`
  - [x] `src/announcements/auth.ts`
  - [x] `src/announcements/accounts.ts`
  - [x] `src/announcements/budgets.ts`
  - [x] `src/announcements/ui.ts`
  - [x] `src/accessibility/detection.ts`
  - [x] `App.tsx`
- [x] Leggere le suite di test esistenti da estendere:
  - [x] `__tests__/plurals.test.ts` (4 regression test Sessione E0 esistenti)
  - [x] `__tests__/t.test.ts` (3 regression test Sessione E0 esistenti)
  - [x] `src/accessibility/__tests__/detection.test.ts` (11 test esistenti)
  - [x] `__tests__/App.test.tsx` (1 test esistente)

> **DIVIETO OPERATIVO (obbligatorio):** Nelle suite contrassegnate come [MODIFY] — `plurals.test.ts`, `t.test.ts`, `detection.test.ts`, `App.test.tsx` — aggiungere **solo nuovi test alla fine** della suite esistente. Non cancellare, rinominare, disabilitare, commentare o indebolire test già esistenti. Se una modifica a un test preesistente è necessaria, fermarsi e produrre un Diagnostic Report dettagliato prima di procedere.

---

## 3. Checklist Test per Commit (in ordine di esecuzione consigliato)

### COMMIT 1 — `test: aggiunge suite completa per currency.ts`
Suite target: `__tests__/currency.test.ts` [NEW]

- [x] **UTLC-01**: `formatCurrencyVocal(1234.56)` → `"1.234,56 euro"` (separatore migliaia punto, decimali virgola) [Normale]
- [x] **UTLC-02**: `formatCurrencyVocal(0)` → `"0,00 euro"` (zero formattato correttamente) [Limite]
- [x] **Commit 1 eseguito su main**

---

### COMMIT 2 — `test: aggiunge suite completa per plurals.ts`
Suite target: `__tests__/plurals.test.ts` [MODIFY] (+7 ai 4 esistenti)

- [x] **UTLP-01**: `pluralize('movimento', 1)` → `'movimento'` (singolare invariato) [Normale/Limite]
- [x] **UTLP-02**: `pluralize('movimento', 3)` → `'movimenti'` (irregolare — verifica ACC-2) [Normale]
- [x] **UTLP-03**: `pluralize('euro', 5)` → `'euro'` (invariabile — verifica ACC-2) [Normale]
- [x] **UTLP-04**: `pluralize('documento', 2)` → `'documenti'` (regola -o → -i) [Normale]
- [x] **UTLP-05**: `pluralize('nota', 2)` → `'note'` (regola -a → -e) [Normale]
- [x] **UTLP-06**: `pluralize('Movimento', 2)` → `'Movimenti'` (capitalizzazione preservata — regressione BUG-6) [Limite]
- [x] **UTLP-07**: `pluralize('mese', 3)` → `'mesi'` (regola -e → -i) [Normale]
- [x] **Commit 2 eseguito su main**

---

### COMMIT 3 — `test: aggiunge suite completa per t.ts`
Suite target: `__tests__/t.test.ts` [MODIFY] (+4 ai 3 esistenti)

- [x] **UTLT-01**: `t('conto_creato')` senza params → stringa originale non interpolata [Normale]
- [x] **UTLT-02**: `t('conto_creato', { name, type, amount })` → interpolazione corretta di tutti i placeholder [Normale]
- [x] **UTLT-03**: `t('conto_creato', { name: 'Solo Nome' })` con params parziali → placeholder non risolti rimangono nel testo [Limite]
- [x] **UTLT-04**: `t('chiave_inesistente', { name: 'test' })` → fallback `'chiave_inesistente'` senza crash (regressione BUG-2) [Errore]
- [x] **Commit 3 eseguito su main**

---

### COMMIT 4 — `test: aggiunge suite completa per index.ts`
Suite target: `__tests__/index.announcements.test.ts` [NEW]

- [x] **ANNI-01**: `announce({ text: '...', priority: 'polite' })` → `engine.announce` chiamato con oggetto identico [Normale]
- [x] **ANNI-02**: `announce({ text: '...', priority: 'assertive' })` → `engine.announce` chiamato con priorità assertive preservata [Normale]
- [x] **Commit 4 eseguito su main**

---

### COMMIT 5 — `test: aggiunge suite completa per auth.ts`
Suite target: `__tests__/auth.announcements.test.ts` [NEW]

- [x] **ANNU-01**: `pinNotConfigured()` → priorità `'assertive'` (verifica ACC-1) [Normale]
- [x] **ANNU-02**: `pinInvalid()` → priorità `'assertive'` (verifica ACC-1) [Normale]
- [x] **ANNU-03**: `privateUnlocked()` → priorità `'polite'` [Normale]
- [x] **ANNU-04**: `privateAccountLocked()` → priorità `'polite'` [Normale]
- [x] **ANNU-05**: `pinSet()` → priorità `'polite'` [Normale]
- [x] **ANNU-06**: `pinChanged()` → priorità `'polite'` [Normale]
- [x] **ANNU-07**: `pinRemoved()` → priorità `'polite'` [Normale]
- [x] **ANNU-08**: `sessionKept()` → priorità `'polite'` [Normale]
- [x] **ANNU-09**: Test consolidato ACC-1 — `pinNotConfigured` e `pinInvalid` hanno entrambe priorità `'assertive'` [Normale]
- [x] **ANNU-10**: Test consolidato — le 6 funzioni non-errore hanno tutte priorità `'polite'` [Normale]
- [x] **Commit 5 eseguito su main**

---

### COMMIT 6 — `test: aggiunge suite completa per accounts.ts`
Suite target: `__tests__/accounts.announcements.test.ts` [NEW]

- [x] **ANNA-01**: `announceAccountCreated('Conto', 'corrente', 1234.56)` → chiama `t('conto_creato', ...)` e `formatCurrencyVocal` — priorità `'polite'` [Normale]
- [x] **ANNA-02**: `announceAccountModified('Conto')` → chiama `t('conto_modificato', { name })` — priorità `'polite'` [Normale]
- [x] **ANNA-03**: `announceAccountDeleted('Conto', true)` → chiama `t('conto_eliminato_con_movimenti', ...)` [Normale]
- [x] **ANNA-04**: `announceAccountDeleted('Conto', false)` → chiama `t('conto_eliminato', ...)` [Normale]
- [x] **ANNA-05**: `announceAccountDeletedGeneric()` → chiama `t('conto_eliminato_generico')` [Normale]
- [x] **ANNA-06**: `announceTransaction('Uscita', 99.50, 'Conto Corrente')` → chiama `t('movimento_aggiunto', ...)` e `formatCurrencyVocal` [Normale]
- [x] **ANNA-07**: `announceTransactionModified()` → chiama `t('movimento_modificato')` [Normale]
- [x] **ANNA-08**: `announceTransactionDeleted()` → chiama `t('movimento_eliminato')` [Normale]
- [x] **ANNA-09**: `announceTransfer(500, 'Conto A', 'Conto B')` → chiama `t('trasferimento_completato', ...)` e `formatCurrencyVocal` [Normale]
- [x] **ANNA-10**: `announceAccountBalance('Conto', 2500.00)` → chiama `t('saldo_conto', ...)` e `formatCurrencyVocal` [Normale]
- [x] **ANNA-11**: `announceRecentTransactions(1)` → chiama `pluralize('movimento', 1)` — singolare [Normale/Limite]
- [x] **ANNA-12**: `announceRecentTransactions(5)` → chiama `pluralize('movimento', 5)` — plurale (verifica ACC-2) [Normale]
- [x] **ANNA-13**: `announceRecentTransactions(0)` → chiama `pluralize('movimento', 0)` — caso zero [Limite]
- [x] **ANNA-14**: `announceExportCSV(1)` → chiama `pluralize('movimento', 1)` e `t('export_csv_completato', ...)` [Normale]
- [x] **ANNA-15**: `announceExportCSV(10)` → chiama `pluralize('movimento', 10)` count > 1 (verifica ACC-2) [Normale]
- [x] **ANNA-16**: `announceExport(1)` → chiama `pluralize('elemento', 1)` e `t('export_completato', ...)` [Normale]
- [x] **ANNA-17**: `announceExport(3)` → chiama `pluralize('elemento', 3)` count > 1 (verifica ACC-2) [Normale]
- [x] **ANNA-18**: `announceImportComplete(1)` → chiama `pluralize('elemento', 1)` e `t('import_completato', ...)` [Normale]
- [x] **ANNA-19**: `announceExportInProgress()` → chiama `t('export_in_corso')` — priorità `'polite'` [Normale]
- [x] **ANNA-20**: `announceExportFile(5)` → chiama `t('export_success_sr')` — `_count` ignorato [Normale]
- [x] **ANNA-21**: `exportError` — `test.each` sui 7 `ExportFailureReason` (ALREADY_IN_PROGRESS, PERMISSION_DENIED, FILESYSTEM_ERROR, UNSUPPORTED_PLATFORM, INVALID_PATH, INSUFFICIENT_SPACE, UNKNOWN). Per ogni reason: verificare chiave `t(...)` attesa e `priority: 'assertive'` (verifica ACC-1). Il codice sorgente è stato corretto nella sessione E1-FIX. [Errore]
- [x] **Commit 6 eseguito su main**

---

### COMMIT 7 — `test: aggiunge suite completa per budgets.ts`
Suite target: `__tests__/budgets.announcements.test.ts` [NEW]

- [x] **ANNB-01**: `announceBudgetCreated('Spesa Casa', 1200, 'mensile')` → chiama `t('budget_creato', ...)` e `formatCurrencyVocal` — priorità `'polite'` [Normale]
- [x] **ANNB-02**: `announceBudgetModified('Spesa Casa')` → chiama `t('budget_modificato', { name })` [Normale]
- [x] **ANNB-03**: `announceBudgetDeleted('Spesa Casa')` → chiama `t('budget_eliminato', { name })` [Normale]
- [x] **ANNB-04**: `announceBudgetDeletedGeneric()` → chiama `t('budget_eliminato_generico')` [Normale]
- [x] **ANNB-05**: `announceBudgetStatus('Spesa', 1200, 1000)` 120% → priorità `'assertive'`, chiave `'budget_superato'` (verifica ACC-1) [Normale/Limite]
- [x] **ANNB-06**: `announceBudgetStatus('Spesa', 950, 1000)` 95% → priorità `'assertive'`, chiave `'budget_critico'` (verifica ACC-1) [Normale]
- [x] **ANNB-07**: `announceBudgetStatus('Spesa', 800, 1000)` 80% → priorità `'polite'`, chiave `'budget_attenzione'` [Normale]
- [x] **ANNB-08**: `announceBudgetStatus('Spesa', 500, 1000)` 50% → priorità `'polite'`, chiave `'budget_normale'` [Normale]
- [x] **ANNB-09**: `announceSavingsGoalCreated('Vacanze', 3000)` → chiama `t('obiettivo_creato', ...)` e `formatCurrencyVocal` [Normale]
- [x] **ANNB-10**: `announceSavingsGoalModified('Vacanze')` → chiama `t('obiettivo_modificato', { name })` [Normale]
- [x] **ANNB-11**: `announceBudgetStatus('Spesa', 50, 0)` target zero + spent > 0 → priorità `'assertive'` (regressione BUG-7 — verifica ACC-1) [Limite]
- [x] **ANNB-12**: `announceSavingsGoalDeleted('Vacanze')` → chiama `t('obiettivo_eliminato', { name })` [Normale]
- [x] **ANNB-13**: `announceSavingsGoalDeletedGeneric()` → chiama `t('obiettivo_eliminato_generico')` [Normale]
- [x] **ANNB-14**: `announceSavingsGoalProgress('Vacanze', 3200, 3000)` >= 100% → chiama `t('obiettivo_completato', ...)` [Normale/Limite]
- [x] **ANNB-15**: `announceSavingsGoalProgress('Vacanze', 2500, 3000)` 83% (>= 75%) → chiama `t('obiettivo_quasi_completato', ...)` [Normale]
- [x] **ANNB-16**: `announceSavingsGoalProgress('Vacanze', 1500, 3000)` 50% (< 75%) → chiama `t('obiettivo_progresso', ...)` [Normale]
- [x] **ANNB-17**: `announceCategoryCreated('Casa')` → chiama `t('categoria_creata', { name: 'Casa' })` e restituisce Announcement con `priority: 'polite'` [Normale]
- [x] **Commit 7 eseguito su main**

---

### COMMIT 8 — `test: aggiunge suite completa per ui.ts`
Suite target: `__tests__/ui.announcements.test.ts` [NEW]

- [x] **ANNX-01**: `modificatoConSuccesso('Conto')` → `t('modificato_con_successo', { name })` — priorità `'polite'` [Normale]
- [x] **ANNX-02**: `eliminatoConSuccesso('Budget')` → `t('eliminato_con_successo', { name })` — priorità `'polite'` [Normale]
- [x] **ANNX-03**: `creatoConSuccesso('Obiettivo')` → `t('creato_con_successo', { name })` — priorità `'polite'` [Normale]
- [x] **ANNX-04**: `aggiuntoConSuccesso('Movimento')` → `t('aggiunto_con_successo', { name })` — priorità `'polite'` [Normale]
- [x] **ANNX-05**: `salvatoConSuccesso('Impostazioni')` → `t('salvato_con_successo', { name })` — priorità `'polite'` [Normale]
- [x] **ANNX-06**: `operazioneCompletata()` → `t('operazione_completata')` — priorità `'polite'` [Normale]
- [x] **ANNX-07**: `operazioneAnnullata()` → `t('operazione_annullata')` — priorità `'polite'` [Normale]
- [x] **ANNX-08**: `erroreGenerico()` → `t('errore_generico')` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [x] **ANNX-09**: `erroreRete()` → `t('errore_rete')` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [x] **ANNX-10**: `erroreValidazione()` → `t('errore_validazione')` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [x] **ANNX-11**: `caricamentoInCorso()` → `t('caricamento_in_corso')` — priorità `'polite'` [Normale]
- [x] **ANNX-12**: `caricamentoCompletato()` → `t('caricamento_completato')` — priorità `'polite'` [Normale]
- [x] **ANNX-13**: `nessunDato()` → `t('nessun_dato')` — priorità `'polite'` [Normale]
- [x] **ANNX-14**: `nessunRisultato()` → `t('nessun_risultato')` — priorità `'polite'` [Normale]
- [x] **ANNX-15**: `confermaRichiesta()` → `t('conferma_richiesta')` — priorità `'polite'` [Normale]
- [x] **ANNX-16**: `confermaEliminazione('Budget Casa')` → `t('conferma_eliminazione', { name })` — priorità `'polite'` [Normale]
- [x] **ANNX-17**: `modificaNonSalvata()` → `t('modifica_non_salvata')` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [x] **ANNX-18**: `modificheSalvate()` → `t('modifiche_salvate')` — priorità `'polite'` [Normale]
- [x] **ANNX-19**: `campoObbligatorio('Email')` → `t('campo_obbligatorio', { name })` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [x] **ANNX-20**: `formatoNonValido('Importo')` → `t('formato_non_valido', { name })` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [x] **ANNX-21**: `importoNonValido()` → `t('importo_non_valido')` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [x] **ANNX-22**: `dataNonValida()` → `t('data_non_valida')` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [x] **ANNX-23**: `selezioneRichiesta('Categoria')` → `t('selezione_richiesta', { name })` — priorità `'assertive'` (verifica ACC-1) [Normale]
- [x] **ANNX-24**: `schermataAperta('Home')` → `t('schermata_aperta', { name })` — priorità `'polite'` [Normale]
- [x] **ANNX-25**: `dialogoAperto('Aggiungi Conto')` → `t('dialogo_aperto', { name })` — priorità `'polite'` [Normale]
- [x] **ANNX-26**: `dialogoChiuso()` → `t('dialogo_chiuso')` — priorità `'polite'` [Normale]
- [x] **ANNX-27**: Test consolidato ACC-1 — le 9 funzioni di errore hanno tutte priorità `'assertive'` [Normale]
- [x] **ANNX-28**: Test consolidato — le 17 funzioni non-errore hanno tutte priorità `'polite'` [Normale]
- [x] **ANNX-29**: `campoObbligatorio('')` con name vuoto → nessun crash [Limite]
- [x] **ANNX-30**: Verifica struttura Announcement: `text` stringa e `priority` in `['polite', 'assertive']` [Normale]
- [x] **Commit 8 eseguito su main**

---

### COMMIT 9 — `test: integra test aggiuntivi per detection.ts`
Suite target: `src/accessibility/__tests__/detection.test.ts` [MODIFY] (+2 agli 11 esistenti)

> **Nota:** riutilizzare l'harness esistente in `detection.test.ts` (funzione `renderHook` locale righe 23-35, `mockUserSettings` nel `beforeEach`, spy su `AccessibilityInfo`). Non creare un nuovo `renderHook` o un nuovo wrapper.

- [x] **INTD-01**: `disableTalkBack(true)` → chiama `setTalkBackManualOverride(false)` e aggiorna stato — righe 129-132 scoperte (verifica ACC-1 indiretta) [Normale]
- [x] **INTD-02**: `disableTalkBack(false)` → disabilita adattazioni locali senza chiamare `setTalkBackManualOverride` [Normale]
- [x] **Commit 9 eseguito su main**

---

### COMMIT 10 — `test: integra test aggiuntivo per App.tsx`
Suite target: `__tests__/App.test.tsx` [MODIFY] (+1 all'1 esistente)

- [x] **INTZ-01**: `<AppContent />` con autenticazione simulata → `useSafeAreaInsets` chiamato, nessuna eccezione (righe 33-35 scoperte) [Normale]
- [x] **Commit 10 eseguito su main**

---

## 4. CICLO A — Revisione e Validazione Tecnica

- [x] **npx jest --testPathPattern="currency|plurals|t\.test|announcements|detection|App\.test"** — tutti i 95 nuovi test passano
- [x] **npx tsc --noEmit** — nessun errore TypeScript
- [x] Nessun test preesistente (554 totali) rotto
- [x] Ciclo A completato (max 10 tentativi)

---

## 5. CICLO B — Revisione Qualitativa

- [x] Revisione qualitativa completata — nessun false positive
- [x] Verifica ACC-1: ogni funzione di errore testata ha asserzione su `priority: 'assertive'`
- [x] Verifica ACC-2: ogni funzione con plurali testata verifica la chiamata a `pluralize`
- [x] Ogni suite moca autonomamente le proprie dipendenze (isolamento garantito)
- [x] Ciclo B completato (max 10 tentativi)

---

## 6. DOCUMENTAZIONE

- [x] `SPARK-START.md` aggiornato — campo "Prossima azione" → Sessione E1 pronta per esecuzione
- [x] `CHANGELOG.md` aggiornato — voce per creazione PLAN 027 e TODO 027
- [x] `docs/todo-master.md` aggiornato — TODO 027 aggiunto con stato PENDING
- [x] Commit documentazione eseguito su main
- [x] `git push origin main` eseguito e verificato con `git log -n 3 --oneline`

---

## 7. Riepilogo

| Commit | File di Test | Test Nuovi | Stato |
|---|---|---|---|
| 1 — currency.ts | `__tests__/currency.test.ts` [NEW] | 2 | [x] |
| 2 — plurals.ts | `__tests__/plurals.test.ts` [MODIFY] | 7 | [x] |
| 3 — t.ts | `__tests__/t.test.ts` [MODIFY] | 4 | [x] |
| 4 — index.ts | `__tests__/index.announcements.test.ts` [NEW] | 2 | [x] |
| 5 — auth.ts | `__tests__/auth.announcements.test.ts` [NEW] | 10 | [x] |
| 6 — accounts.ts | `__tests__/accounts.announcements.test.ts` [NEW] | 21 | [x] |
| 7 — budgets.ts | `__tests__/budgets.announcements.test.ts` [NEW] | 17 | [x] |
| 8 — ui.ts | `__tests__/ui.announcements.test.ts` [NEW] | 30 | [x] |
| 9 — detection.ts | `src/accessibility/__tests__/detection.test.ts` [MODIFY] | 2 | [x] |
| 10 — App.tsx | `__tests__/App.test.tsx` [MODIFY] | 1 | [x] |
| **TOTALE** | | **96** | |

**Test pre-Sessione E1:** 554
**Test post-Sessione E1 (attesi):** 650


## Riepilogo Esecuzione E1
- **Data completamento**: 2026-07-02
- **Modello**: Antigravity (Google Gemini Ultra)
- **Test scritti**: 96 (con ANNA-21 esteso in 7 casi distinti da Jest per un totale reale di 102 test passanti compilati)
- **Test totali progetto**: 659
- **Suite nuove**:
  - [currency.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/currency.test.ts)
  - [auth.announcements.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/auth.announcements.test.ts)
  - [ui.announcements.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/ui.announcements.test.ts)
  - [index.announcements.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/index.announcements.test.ts)
  - [accounts.announcements.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/accounts.announcements.test.ts)
  - [budgets.announcements.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/budgets.announcements.test.ts)
- **Suite estese**:
  - [plurals.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/plurals.test.ts)
  - [t.test.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/t.test.ts)
  - [detection.test.ts](file:///c:/Sviluppo/ZecchinoReact/src/accessibility/__tests__/detection.test.ts)
  - [App.test.tsx](file:///c:/Sviluppo/ZecchinoReact/__tests__/App.test.tsx)
- **Note operative**: Nessuna.
