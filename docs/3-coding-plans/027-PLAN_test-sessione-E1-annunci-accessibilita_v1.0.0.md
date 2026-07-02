---
tipo: plan
titolo: Test Sessione E1 — Annunci e Accessibilità (Blocco 1)
versione: 1.0.0
data: 2026-07-01
stato: READY
autore: Claude Sonnet 4.6 Thinking — Sessione E1-PLAN | Antigravity — Sessione E1-FIX (2026-07-02)
sessione-riferimento: E1
perimetro: src/announcements/*, src/announcements/_utils/*, src/accessibility/detection.ts, App.tsx
ramo: main
riferimento-report: docs/1-reports/REPORT-analisi-copertura-test-completa_v1.0.0.md
dipendenze: PLAN 026 (completato), PLAN 025 (completato), PLAN 024 (completato)
---

# PLAN 027 — Test Sessione E1 — Annunci e Accessibilità

## Riepilogo Esecutivo

Questo Coding Plan definisce la pianificazione strategica per la **Sessione E1** dei test del progetto ZecchinoReact, relativa al **Blocco 1 — Annunci e Accessibilità**. L'obiettivo è portare a copertura completa il layer degli annunci vocali, ossia tutte le funzioni che costruiscono le frasi lette dallo screen reader all'utente (NVDA su Windows, TalkBack su Android, VoiceOver su iOS), colmando i gap di copertura rilevati in `docs/1-reports/REPORT-analisi-copertura-test-completa_v1.0.0.md`.

- **Obiettivo della sessione:** Implementare tutti i test mancanti identificati per il Blocco 1, coprendo le utility condivise (`plurals.ts`, `t.ts`, `currency.ts`), i moduli di annunci di dominio (`accounts.ts`, `auth.ts`, `budgets.ts`, `ui.ts`, `index.ts`) e i test aggiuntivi di integrazione per `detection.ts` e `App.tsx`.
- **File target con copertura attuale e attesa:**
  - `src/announcements/accounts.ts` (Copertura attuale: 0% → Attesa: >95%)
  - `src/announcements/auth.ts` (Copertura attuale: 0% → Attesa: 100%)
  - `src/announcements/budgets.ts` (Copertura attuale: 0% → Attesa: >95%)
  - `src/announcements/index.ts` (Copertura attuale: 0% → Attesa: 100%)
  - `src/announcements/ui.ts` (Copertura attuale: 0% → Attesa: 100%)
  - `src/announcements/_utils/currency.ts` (Copertura attuale: 50% → Attesa: 100%)
  - `src/announcements/_utils/plurals.ts` (Copertura attuale: 7.69% → Attesa: 100%)
  - `src/announcements/_utils/t.ts` (Copertura attuale: 50% → Attesa: 100%)
  - `src/accessibility/detection.ts` (Copertura attuale: 90% → Attesa: 100%)
  - `App.tsx` (Copertura attuale: 60% → Attesa: 100%)
- **Conteggio dei test:**
  - Test già presenti prima della Sessione E1: **554**
  - Test da scrivere nella Sessione E1: **96**
  - Test totali attesi al completamento: **650**
- **Suite di destinazione:**
  - `__tests__/accounts.announcements.test.ts` [NEW]: 21 test
  - `__tests__/auth.announcements.test.ts` [NEW]: 10 test
  - `__tests__/budgets.announcements.test.ts` [NEW]: 17 test
  - `__tests__/index.announcements.test.ts` [NEW]: 2 test
  - `__tests__/ui.announcements.test.ts` [NEW]: 30 test
  - `__tests__/currency.test.ts` [NEW]: 2 test
  - `__tests__/plurals.test.ts` [MODIFY]: +7 test (estende i 4 regression test esistenti della Sessione E0)
  - `__tests__/t.test.ts` [MODIFY]: +4 test (estende i 3 regression test esistenti della Sessione E0)
  - `src/accessibility/__tests__/detection.test.ts` [MODIFY]: +2 test
  - `__tests__/App.test.tsx` [MODIFY]: +1 test
- **Vincoli tecnici:** Rispetto di ACC-1 (priorità assertive per errori), ACC-2 (plurali delegati a plurals.ts), mock delle utility condivise per isolare i file di annunci.

---

## 1. Obiettivo della Sessione

La Sessione E1 copre il **layer degli annunci vocali** dell'applicazione ZecchinoReact. Questo layer è il confine tra la logica di dominio e il motore di accessibilità: le sue funzioni costruiscono oggetti `Announcement` (con proprietà `text` e `priority`) che vengono poi consegnati all'engine di accessibilità per essere vocalizzati dagli screen reader.

La sessione è fondamentale per due motivi: (1) garantisce che ogni evento dell'applicazione che riguarda dati finanziari venga comunicato correttamente all'utente non vedente, con la giusta priorità (assertive per errori, polite per informazioni), e (2) stabilisce una base di regressione sicura per le utility condivise (`plurals.ts`, `t.ts`, `currency.ts`) che vengono usate da tutti i moduli di annuncio e sono state oggetto di bugfix nella Sessione E0.

I file coinvolti sono **10**: 5 moduli di annunci di dominio, 3 utility condivise, 1 hook di accessibilità e 1 componente radice dell'applicazione.

---

## 2. Contesto Architetturale

### Come funziona il layer degli annunci

```
[Dominio / Azione UI]
       |
       v
[Funzione di annuncio]          <- oggetti in accounts.ts, auth.ts, budgets.ts, ui.ts
       | usa
       |---> t.ts                <- interpolazione stringhe da @/locales
       |---> currency.ts         <- formattazione vocale importi (it-IT)
       +---> plurals.ts          <- pluralizzazione italiana
       |
       v
[Announcement { text, priority }]
       |
       v
[index.ts --> engine.announce()]  <- unico punto di contatto con @/accessibility/engine
       |
       v
[Screen Reader: NVDA / TalkBack / VoiceOver]
```

**Regole architetturali fondamentali:**
- Le funzioni di annuncio costruiscono oggetti `Announcement` con due proprietà: `text` (stringa) e `priority` (`'polite' | 'assertive'`).
- L'oggetto viene passato a `index.ts` che lo consegna all'engine di accessibilità tramite `engine.announce()`.
- Le utility condivise (`t.ts`, `plurals.ts`, `currency.ts`) sono usate da tutti i file di annunci come dipendenze condivise.
- I mock delle utility sono necessari per isolare ogni file di test dai comportamenti delle dipendenze.

### Vincolo ACC-1 — Priorità degli annunci di errore

> **Ogni annuncio destinato a comunicare un errore deve avere priorità `'assertive'`** per interrompere immediatamente lo screen reader e portare l'attenzione all'utente. Gli annunci informativi usano priorità `'polite'`.

Questo vincolo **deve essere verificato** dai test per ogni funzione che restituisce un annuncio di errore.

Le funzioni con priorità `assertive` attesa (come da codice sorgente):
- `auth.ts`: `pinNotConfigured`, `pinInvalid`
- `budgets.ts`: `announceBudgetStatus` (rami >= 100% e >= 90%)
- `ui.ts`: `erroreGenerico`, `erroreRete`, `erroreValidazione`, `modificaNonSalvata`, `campoObbligatorio`, `formatoNonValido`, `importoNonValido`, `dataNonValida`, `selezioneRichiesta`
- `accounts.ts`: `exportError` (tutti i 7 rami — corretto nella sessione E1-FIX del 2026-07-02)

### Vincolo ACC-2 — Delega dei plurali a plurals.ts

> **I plurali italiani irregolari devono essere gestiti dal modulo `plurals.ts`** e non hardcoded nei file di annunci. I test devono verificare che i file di annunci deleghino sempre a `plurals.ts` per le forme plurali.

**Nota tipo Announcement:** il tipo Announcement usa le proprietà `text` e `priority`. Non usare `message`. Fonte: `src/accessibility/types.ts`.

**Nota BUG-3:** il BUG-3 (crash per subscription nulla all'unmount in `detection.ts`) è già coperto dalla suite esistente con il test "Caso Limite 3b" che verifica l'unmount con subscription undefined. Non è necessario aggiungere un nuovo test per BUG-3 in E1.

---

## 3. Potenziali Bug Noti (già corretti nella Sessione E0)

I seguenti bug erano stati identificati nel report di analisi originale. **Tutti sono stati corretti nella Sessione E0 (v0.18.3)**. I test della Sessione E1 documentano il comportamento corretto post-fix.

### BUG-2 — Crash per chiave di traduzione mancante in t.ts
- **File:** `src/announcements/_utils/t.ts`
- **Fix applicato (Sessione E0):** guardia difensiva `if (typeof result !== 'string') return String(key)`.
- **Comportamento atteso nei test:** chiamata con chiave inesistente restituisce la chiave come stringa, senza crash.
- **Test correlato:** UTLT-04

### BUG-5 — `hadTransactions` cablato a true in eliminazione conto
- **Rilevanza per E1:** il test ANNA-03/04 di `announceAccountDeleted` verifica entrambi i rami (`hadTransactions: true` e `hadTransactions: false`).

### BUG-6 — Perdita di maiuscole nei plurali irregolari in plurals.ts
- **Fix applicato (Sessione E0):** logica di ripristino capitalizzazione già presente nel codice attuale (righe 18-24).
- **Test correlato:** UTLP-06

### BUG-7 — Budget a zero non segnala il superamento in budgets.ts
- **Fix applicato (Sessione E0):** ramo esplicito `if (target <= 0 && spent > 0)` già presente nel codice attuale (righe 53-62).
- **Test correlato:** ANNB-11

---

## 4. Piano dei Commit

### Commit 1 — `test: aggiunge suite completa per currency.ts`

- **File di test creato:** `__tests__/currency.test.ts` [NEW]
- **Modulo sorgente:** `src/announcements/_utils/currency.ts`
- **Dipendenze da mockare:** Nessuna (funzione pura, usa `Intl.NumberFormat`)
- **Test inclusi:**

| ID | Descrizione | Tipo |
|---|---|---|
| UTLC-01 | `formatCurrencyVocal(1234.56)` → `"1.234,56 euro"` (separatore migliaia punto, decimali virgola) | Normale |
| UTLC-02 | `formatCurrencyVocal(0)` → `"0,00 euro"` (zero formattato correttamente) | Limite |

- **Note tecniche:** Il `formatter` usa `Intl.NumberFormat('it-IT', ...)`. I test devono essere stabili indipendentemente dalla locale del sistema operativo. Se Jest non supporta `Intl` con `it-IT`, aggiungere il polyfill `@formatjs/intl-numberformat` già presente nel progetto.
- **Stima test nuovi:** 2

---

### Commit 2 — `test: aggiunge suite completa per plurals.ts`

- **File di test modificato:** `__tests__/plurals.test.ts` [MODIFY]
- **Modulo sorgente:** `src/announcements/_utils/plurals.ts`
- **Dipendenze da mockare:** Nessuna (logica pura su stringhe)
- **Test inclusi:**

| ID | Descrizione | Tipo |
|---|---|---|
| UTLP-01 | `pluralize('movimento', 1)` → `'movimento'` (singolare invariato) | Normale/Limite |
| UTLP-02 | `pluralize('movimento', 3)` → `'movimenti'` (irregolare) | Normale |
| UTLP-03 | `pluralize('euro', 5)` → `'euro'` (invariabile) | Normale |
| UTLP-04 | `pluralize('documento', 2)` → `'documenti'` (regola -o → -i) | Normale |
| UTLP-05 | `pluralize('nota', 2)` → `'note'` (regola -a → -e) | Normale |
| UTLP-06 | `pluralize('Movimento', 2)` → `'Movimenti'` (capitalizzazione preservata — regressione BUG-6) | Limite |
| UTLP-07 | `pluralize('mese', 3)` → `'mesi'` (regola -e → -i) | Normale |

- **Verifica ACC-2:** I test UTLP-02 e UTLP-03 verificano che le parole irregolari del dizionario `IRREGULAR` siano gestite correttamente da `plurals.ts`.
- **Note tecniche:** Il file `__tests__/plurals.test.ts` esiste già con 4 regression test dalla Sessione E0. I nuovi 7 test vengono aggiunti alla suite esistente. Verificare prima di scrivere che i nuovi identificatori non duplichino i test esistenti.
- **Stima test nuovi:** 7

---

### Commit 3 — `test: aggiunge suite completa per t.ts`

- **File di test modificato:** `__tests__/t.test.ts` [MODIFY]
- **Modulo sorgente:** `src/announcements/_utils/t.ts`
- **Dipendenze da mockare:** `@/locales` (mock del dizionario `strings` per un subset controllato di chiavi)
- **Test inclusi:**

| ID | Descrizione | Tipo |
|---|---|---|
| UTLT-01 | `t('conto_creato')` senza params → restituisce la stringa originale non interpolata | Normale |
| UTLT-02 | `t('conto_creato', { name, type, amount })` → restituisce la stringa con tutti i placeholder sostituiti | Normale |
| UTLT-03 | `t('conto_creato', { name: 'Solo Nome' })` con params parziali → placeholder non risolti rimangono nel testo | Limite |
| UTLT-04 | `t('chiave_inesistente', { name: 'test' })` → restituisce `'chiave_inesistente'` come fallback (regressione BUG-2) | Errore |

- **Note tecniche:** Mockare `@/locales` con `jest.mock('@/locales', () => ({ strings: { conto_creato: 'Conto {name} di tipo {type} con saldo {amount}' } }))`. Il file `__tests__/t.test.ts` esiste già con 3 regression test dalla Sessione E0.
- **Stima test nuovi:** 4

---

### Commit 4 — `test: aggiunge suite completa per index.ts`

- **File di test creato:** `__tests__/index.announcements.test.ts` [NEW]
- **Modulo sorgente:** `src/announcements/index.ts`
- **Dipendenze da mockare:** `@/accessibility/engine`
- **Test inclusi:**

| ID | Descrizione | Tipo |
|---|---|---|
| ANNI-01 | `announce({ text: 'Operazione completata', priority: 'polite' })` → chiama `engine.announce` con l'oggetto Announcement identico | Normale |
| ANNI-02 | `announce({ text: 'Errore critico', priority: 'assertive' })` → chiama `engine.announce` con priorità assertive preservata | Normale |

- **Note tecniche:** `engine` è importato come singleton da `@/accessibility/engine`. Mockarlo con `jest.mock('@/accessibility/engine', () => ({ engine: { announce: jest.fn() } }))`. Verificare che `engine.announce` sia chiamato esattamente una volta per invocazione e riceva l'oggetto Announcement verbatim.
- **Stima test nuovi:** 2

---

### Commit 5 — `test: aggiunge suite completa per auth.ts`

- **File di test creato:** `__tests__/auth.announcements.test.ts` [NEW]
- **Modulo sorgente:** `src/announcements/auth.ts`
- **Dipendenze da mockare:** `@/announcements/_utils/t`
- **Test inclusi:**

| ID | Descrizione | Tipo |
|---|---|---|
| ANNU-01 | `pinNotConfigured()` → priorità `'assertive'` — verifica ACC-1 | Normale |
| ANNU-02 | `pinInvalid()` → priorità `'assertive'` — verifica ACC-1 | Normale |
| ANNU-03 | `privateUnlocked()` → priorità `'polite'` | Normale |
| ANNU-04 | `privateAccountLocked()` → priorità `'polite'` | Normale |
| ANNU-05 | `pinSet()` → priorità `'polite'` | Normale |
| ANNU-06 | `pinChanged()` → priorità `'polite'` | Normale |
| ANNU-07 | `pinRemoved()` → priorità `'polite'` | Normale |
| ANNU-08 | `sessionKept()` → priorità `'polite'` | Normale |
| ANNU-09 | Test consolidato ACC-1: `pinNotConfigured` e `pinInvalid` hanno entrambe priorità `'assertive'` | Normale |
| ANNU-10 | Test consolidato: tutte le 6 funzioni non-errore hanno priorità `'polite'` | Normale |

- **Verifica ACC-1:** I test ANNU-01, ANNU-02 e ANNU-09 verificano il vincolo ACC-1 per le funzioni di errore PIN.
- **Note tecniche:** Il mock di `t` deve essere `jest.fn((key) => key)` per restituire la chiave come stringa deterministica. Il file non usa `currency.ts` né `plurals.ts`.
- **Stima test nuovi:** 10

---

### Commit 6 — `test: aggiunge suite completa per accounts.ts`

- **File di test creato:** `__tests__/accounts.announcements.test.ts` [NEW]
- **Modulo sorgente:** `src/announcements/accounts.ts`
- **Dipendenze da mockare:** `@/announcements/_utils/t`, `@/announcements/_utils/currency`, `@/announcements/_utils/plurals`
- **Test inclusi:**

| ID | Descrizione | Tipo |
|---|---|---|
| ANNA-01 | `announceAccountCreated('Conto', 'corrente', 1234.56)` → chiama `t('conto_creato', ...)` e `formatCurrencyVocal(1234.56)` — priorità `'polite'` | Normale |
| ANNA-02 | `announceAccountModified('Conto')` → chiama `t('conto_modificato', { name })` — priorità `'polite'` | Normale |
| ANNA-03 | `announceAccountDeleted('Conto', true)` → chiama `t('conto_eliminato_con_movimenti', ...)` — ramo `hadTransactions: true` | Normale |
| ANNA-04 | `announceAccountDeleted('Conto', false)` → chiama `t('conto_eliminato', ...)` — ramo `hadTransactions: false` | Normale |
| ANNA-05 | `announceAccountDeletedGeneric()` → chiama `t('conto_eliminato_generico')` — priorità `'polite'` | Normale |
| ANNA-06 | `announceTransaction('Uscita', 99.50, 'Conto Corrente')` → chiama `t('movimento_aggiunto', ...)` e `formatCurrencyVocal(99.50)` | Normale |
| ANNA-07 | `announceTransactionModified()` → chiama `t('movimento_modificato')` — priorità `'polite'` | Normale |
| ANNA-08 | `announceTransactionDeleted()` → chiama `t('movimento_eliminato')` — priorità `'polite'` | Normale |
| ANNA-09 | `announceTransfer(500, 'Conto A', 'Conto B')` → chiama `t('trasferimento_completato', ...)` e `formatCurrencyVocal(500)` | Normale |
| ANNA-10 | `announceAccountBalance('Conto', 2500.00)` → chiama `t('saldo_conto', ...)` e `formatCurrencyVocal(2500.00)` | Normale |
| ANNA-11 | `announceRecentTransactions(1)` → chiama `pluralize('movimento', 1)` → singolare | Normale/Limite |
| ANNA-12 | `announceRecentTransactions(5)` → chiama `pluralize('movimento', 5)` → plurale (verifica ACC-2) | Normale |
| ANNA-13 | `announceRecentTransactions(0)` → chiama `pluralize('movimento', 0)` → caso zero | Limite |
| ANNA-14 | `announceExportCSV(1)` → chiama `pluralize('movimento', 1)` e `t('export_csv_completato', ...)` | Normale |
| ANNA-15 | `announceExportCSV(10)` → chiama `pluralize('movimento', 10)` con count > 1 (verifica ACC-2) | Normale |
| ANNA-16 | `announceExport(1)` → chiama `pluralize('elemento', 1)` e `t('export_completato', ...)` | Normale |
| ANNA-17 | `announceExport(3)` → chiama `pluralize('elemento', 3)` con count > 1 (verifica ACC-2) | Normale |
| ANNA-18 | `announceImportComplete(1)` → chiama `pluralize('elemento', 1)` e `t('import_completato', ...)` | Normale |
| ANNA-19 | `announceExportInProgress()` → chiama `t('export_in_corso')` — priorità `'polite'` | Normale |
| ANNA-20 | `announceExportFile(5)` → chiama `t('export_success_sr')` — `_count` ignorato (underscore prefix) | Normale |
| ANNA-21 | `exportError` — `test.each` sui 7 `ExportFailureReason`: `ALREADY_IN_PROGRESS`, `PERMISSION_DENIED`, `FILESYSTEM_ERROR`, `UNSUPPORTED_PLATFORM`, `INVALID_PATH`, `INSUFFICIENT_SPACE`, `UNKNOWN`. Per ogni reason verificare: (a) la chiave `t(...)` attesa nello switch; (b) `priority: 'assertive'` — verifica ACC-1. Usare `test.each` per compattezza e chiarezza. | Errore |

- **Verifica ACC-2:** I test ANNA-12, ANNA-15 e ANNA-17 verificano la delega a `plurals.ts`.
- **Nota ACC-1 per ANNA-21:** `exportError` è una funzione di errore soggetta al vincolo ACC-1. Tutti i 7 rami restituiscono `priority: 'assertive'` dopo la correzione applicata nella sessione E1-FIX del 2026-07-02.
- **Note tecniche:** Il tipo `ExportFailureReason` è da `@/lib/export-service`. Il parametro `reason` ha tipo `Exclude<ExportFailureReason, 'CANCELLED'>`. Il mock di `t` deve essere `jest.fn((key) => key)`.
- **Stima test nuovi:** 21

---

### Commit 7 — `test: aggiunge suite completa per budgets.ts`

- **File di test creato:** `__tests__/budgets.announcements.test.ts` [NEW]
- **Modulo sorgente:** `src/announcements/budgets.ts`
- **Dipendenze da mockare:** `@/announcements/_utils/t`, `@/announcements/_utils/currency`
- **Test inclusi:**

| ID | Descrizione | Tipo |
|---|---|---|
| ANNB-01 | `announceBudgetCreated('Spesa Casa', 1200, 'mensile')` → chiama `t('budget_creato', ...)` e `formatCurrencyVocal(1200)` — priorità `'polite'` | Normale |
| ANNB-02 | `announceBudgetModified('Spesa Casa')` → chiama `t('budget_modificato', { name })` | Normale |
| ANNB-03 | `announceBudgetDeleted('Spesa Casa')` → chiama `t('budget_eliminato', { name })` | Normale |
| ANNB-04 | `announceBudgetDeletedGeneric()` → chiama `t('budget_eliminato_generico')` | Normale |
| ANNB-05 | `announceBudgetStatus('Spesa', 1200, 1000)` 120% → priorità `'assertive'`, chiave `'budget_superato'` — verifica ACC-1 | Normale/Limite |
| ANNB-06 | `announceBudgetStatus('Spesa', 950, 1000)` 95% → priorità `'assertive'`, chiave `'budget_critico'` — verifica ACC-1 | Normale |
| ANNB-07 | `announceBudgetStatus('Spesa', 800, 1000)` 80% → priorità `'polite'`, chiave `'budget_attenzione'` | Normale |
| ANNB-08 | `announceBudgetStatus('Spesa', 500, 1000)` 50% → priorità `'polite'`, chiave `'budget_normale'` | Normale |
| ANNB-09 | `announceSavingsGoalCreated('Vacanze', 3000)` → chiama `t('obiettivo_creato', ...)` e `formatCurrencyVocal(3000)` | Normale |
| ANNB-10 | `announceSavingsGoalModified('Vacanze')` → chiama `t('obiettivo_modificato', { name })` | Normale |
| ANNB-11 | `announceBudgetStatus('Spesa', 50, 0)` target zero + spent > 0 → priorità `'assertive'` (regressione BUG-7) | Limite |
| ANNB-12 | `announceSavingsGoalDeleted('Vacanze')` → chiama `t('obiettivo_eliminato', { name })` | Normale |
| ANNB-13 | `announceSavingsGoalDeletedGeneric()` → chiama `t('obiettivo_eliminato_generico')` | Normale |
| ANNB-14 | `announceSavingsGoalProgress('Vacanze', 3200, 3000)` >= 100% → chiama `t('obiettivo_completato', ...)` | Normale/Limite |
| ANNB-15 | `announceSavingsGoalProgress('Vacanze', 2500, 3000)` 83% (>= 75%) → chiama `t('obiettivo_quasi_completato', ...)` | Normale |
| ANNB-16 | `announceSavingsGoalProgress('Vacanze', 1500, 3000)` 50% (< 75%) → chiama `t('obiettivo_progresso', ...)` | Normale |
| ANNB-17 | `announceCategoryCreated('Casa')` → chiama `t('categoria_creata', { name: 'Casa' })`; restituisce Announcement con `priority: 'polite'`; non usa `formatCurrencyVocal` | Normale |

- **Verifica ACC-1:** I test ANNB-05, ANNB-06 e ANNB-11 verificano il vincolo ACC-1.
- **Note tecniche:** ANNB-11 verifica la regressione BUG-7 corretta nella Sessione E0. Il mock di `t` deve essere `jest.fn((key) => key)`.
- **Stima test nuovi:** 17

---

### Commit 8 — `test: aggiunge suite completa per ui.ts`

- **File di test creato:** `__tests__/ui.announcements.test.ts` [NEW]
- **Modulo sorgente:** `src/announcements/ui.ts`
- **Dipendenze da mockare:** `@/announcements/_utils/t`
- **Test inclusi:**

| ID | Descrizione | Tipo |
|---|---|---|
| ANNX-01 | `modificatoConSuccesso('Conto')` → `t('modificato_con_successo', { name })` — priorità `'polite'` | Normale |
| ANNX-02 | `eliminatoConSuccesso('Budget')` → `t('eliminato_con_successo', { name })` — priorità `'polite'` | Normale |
| ANNX-03 | `creatoConSuccesso('Obiettivo')` → `t('creato_con_successo', { name })` — priorità `'polite'` | Normale |
| ANNX-04 | `aggiuntoConSuccesso('Movimento')` → `t('aggiunto_con_successo', { name })` — priorità `'polite'` | Normale |
| ANNX-05 | `salvatoConSuccesso('Impostazioni')` → `t('salvato_con_successo', { name })` — priorità `'polite'` | Normale |
| ANNX-06 | `operazioneCompletata()` → `t('operazione_completata')` — priorità `'polite'` | Normale |
| ANNX-07 | `operazioneAnnullata()` → `t('operazione_annullata')` — priorità `'polite'` | Normale |
| ANNX-08 | `erroreGenerico()` → `t('errore_generico')` — priorità `'assertive'` — verifica ACC-1 | Normale |
| ANNX-09 | `erroreRete()` → `t('errore_rete')` — priorità `'assertive'` — verifica ACC-1 | Normale |
| ANNX-10 | `erroreValidazione()` → `t('errore_validazione')` — priorità `'assertive'` — verifica ACC-1 | Normale |
| ANNX-11 | `caricamentoInCorso()` → `t('caricamento_in_corso')` — priorità `'polite'` | Normale |
| ANNX-12 | `caricamentoCompletato()` → `t('caricamento_completato')` — priorità `'polite'` | Normale |
| ANNX-13 | `nessunDato()` → `t('nessun_dato')` — priorità `'polite'` | Normale |
| ANNX-14 | `nessunRisultato()` → `t('nessun_risultato')` — priorità `'polite'` | Normale |
| ANNX-15 | `confermaRichiesta()` → `t('conferma_richiesta')` — priorità `'polite'` | Normale |
| ANNX-16 | `confermaEliminazione('Budget Casa')` → `t('conferma_eliminazione', { name })` — priorità `'polite'` | Normale |
| ANNX-17 | `modificaNonSalvata()` → `t('modifica_non_salvata')` — priorità `'assertive'` — verifica ACC-1 | Normale |
| ANNX-18 | `modificheSalvate()` → `t('modifiche_salvate')` — priorità `'polite'` | Normale |
| ANNX-19 | `campoObbligatorio('Email')` → `t('campo_obbligatorio', { name })` — priorità `'assertive'` — verifica ACC-1 | Normale |
| ANNX-20 | `formatoNonValido('Importo')` → `t('formato_non_valido', { name })` — priorità `'assertive'` — verifica ACC-1 | Normale |
| ANNX-21 | `importoNonValido()` → `t('importo_non_valido')` — priorità `'assertive'` — verifica ACC-1 | Normale |
| ANNX-22 | `dataNonValida()` → `t('data_non_valida')` — priorità `'assertive'` — verifica ACC-1 | Normale |
| ANNX-23 | `selezioneRichiesta('Categoria')` → `t('selezione_richiesta', { name })` — priorità `'assertive'` — verifica ACC-1 | Normale |
| ANNX-24 | `schermataAperta('Home')` → `t('schermata_aperta', { name })` — priorità `'polite'` | Normale |
| ANNX-25 | `dialogoAperto('Aggiungi Conto')` → `t('dialogo_aperto', { name })` — priorità `'polite'` | Normale |
| ANNX-26 | `dialogoChiuso()` → `t('dialogo_chiuso')` — priorità `'polite'` | Normale |
| ANNX-27 | Test consolidato ACC-1: le 9 funzioni di errore hanno tutte priorità `'assertive'` | Normale |
| ANNX-28 | Test consolidato: le 17 funzioni non-errore hanno tutte priorità `'polite'` | Normale |
| ANNX-29 | `campoObbligatorio('')` con name vuoto → gestisce stringa vuota senza crash | Limite |
| ANNX-30 | Verifica struttura Announcement: `text` di tipo stringa, `priority` in `['polite', 'assertive']` | Normale |

- **Verifica ACC-1:** I test ANNX-08, ANNX-09, ANNX-10, ANNX-17, ANNX-19, ANNX-20, ANNX-21, ANNX-22, ANNX-23 e ANNX-27 verificano il vincolo ACC-1.
- **Note tecniche:** `ui.ts` ha esattamente 26 funzioni. I test ANNX-27/28/29/30 sono test consolidati/limite aggiuntivi. Il mock di `t` deve essere `jest.fn((key) => key)`.
- **Stima test nuovi:** 30

---

### Commit 9 — `test: integra test aggiuntivi per detection.ts`

- **File di test modificato:** `src/accessibility/__tests__/detection.test.ts` [MODIFY]
- **Modulo sorgente:** `src/accessibility/detection.ts`
- **Dipendenze da mockare:** `react-native` (AccessibilityInfo), `@/context/UserSettingsContext`
- **Test inclusi:**

| ID | Descrizione | Tipo |
|---|---|---|
| INTD-01 | `disableTalkBack(true)` → chiama `setTalkBackManualOverride(false)` e aggiorna lo stato (righe 129-132 scoperte) | Normale |
| INTD-02 | `disableTalkBack(false)` → disabilita adattazioni locali senza chiamare `setTalkBackManualOverride` | Normale |

- **Note tecniche:** La suite esistente ha già 11 test (inclusi i 2 Extra). INTD-01 verifica che `setTalkBackManualOverride` sia chiamato con `false` (non `null` o `true`). INTD-02 verifica che `setTalkBackManualOverride` NON venga chiamato. Entrambi verificano che `talkBackState.isEnabled` e `adaptationsActive` siano `false`.
- **Nota harness:** INTD-01 e INTD-02 devono riutilizzare il `renderHook` locale, `mockUserSettings` e la struttura `beforeEach` già presenti in `src/accessibility/__tests__/detection.test.ts`. Non introdurre un secondo wrapper o un nuovo harness. Il file di test esistente ha infrastruttura completa (vedi righe 23-60 del file).
- **Stima test nuovi:** 2

---

### Commit 10 — `test: integra test aggiuntivo per App.tsx`

- **File di test modificato:** `__tests__/App.test.tsx` [MODIFY]
- **Modulo sorgente:** `App.tsx`
- **Dipendenze da mockare:** `react-native-safe-area-context`, `@/context/AuthContext`
- **Test inclusi:**

| ID | Descrizione | Tipo |
|---|---|---|
| INTZ-01 | Renderizzare `<AppContent />` con autenticazione simulata → `useSafeAreaInsets` viene chiamato, componente si monta senza eccezioni (righe 33-35 scoperte) | Normale |

- **Note tecniche:** Mockare `react-native-safe-area-context` con `jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: jest.fn().mockReturnValue({ top: 20, bottom: 20, left: 0, right: 0 }), SafeAreaProvider: ({ children }) => children }))`. Mockare `@/context/AuthContext` per fornire utente autenticato.
- **Stima test nuovi:** 1

---

## 5. Dipendenze Globali da Mockare

| Modulo da mockare | Perché viene mockato | File di test che lo usano |
|---|---|---|
| `@/announcements/_utils/t` | Isola i file di annunci; permette di verificare quale chiave viene chiamata | accounts, auth, budgets, ui announcements |
| `@/announcements/_utils/currency` | Isola i file di annunci dal formattatore reale | accounts, budgets announcements |
| `@/announcements/_utils/plurals` | Verifica delega (ACC-2) | accounts announcements |
| `@/accessibility/engine` | Isola index.ts dall'engine reale | index.announcements |
| `react-native` (AccessibilityInfo) | Simula lo screen reader senza hardware | detection.test.ts |
| `@/context/UserSettingsContext` | Fornisce mock di `useUserSettings` | detection.test.ts |
| `react-native-safe-area-context` | Fornisce insets fittizi | App.test.tsx |
| `@/context/AuthContext` | Simula autenticazione riuscita | App.test.tsx |
| `@/locales` | Fornisce dizionario controllato | t.test.ts |

---

## 6. Harness Condiviso

I file di annunci seguono tutti lo stesso pattern strutturale. È disponibile un file helper in `__tests__/helpers/announcements-test-utils.ts` con funzioni pure di supporto alle asserzioni.

**REGOLA OBBLIGATORIA:** Il file helper **NON deve contenere** chiamate `jest.mock()` a livello di modulo. Ogni suite dichiara localmente i propri `jest.mock()` in cima al file di test, prima di qualsiasi import.

Motivo: i file di annunci hanno dipendenze diverse tra loro. `auth.ts` usa solo `t`. `accounts.ts` usa `t + currency + plurals`. `budgets.ts` usa `t + currency`. `ui.ts` usa solo `t`. `index.ts` usa `engine`. Mock globali condivisi tra suite con dipendenze diverse possono produrre falsi positivi o contaminazione tra test.

Funzioni helper ammesse nel file:
- `expectAnnouncement(result, priority)`: verifica che `result.text` sia stringa e `result.priority` sia uguale a `priority`
- `expectAssertive(result)`: shorthand per `expectAnnouncement(result, 'assertive')`
- `expectPolite(result)`: shorthand per `expectAnnouncement(result, 'polite')`
- `expectTCalledWith(mockT, key, params)`: verifica che la funzione `t` mockata sia stata chiamata con la chiave e i parametri attesi

**Nota tecnica:** il tipo Announcement usa le proprietà `text` e `priority`. Non usare `message`. Fonte: `src/accessibility/types.ts`.

```typescript
// __tests__/helpers/announcements-test-utils.ts
import type { Announcement } from '@/announcements/types';

export function expectAnnouncement(
  result: Announcement,
  priority: 'polite' | 'assertive',
): void {
  expect(typeof result.text).toBe('string');
  expect(result.priority).toBe(priority);
}

export const expectAssertive = (result: Announcement) =>
  expectAnnouncement(result, 'assertive');

export const expectPolite = (result: Announcement) =>
  expectAnnouncement(result, 'polite');

export function expectTCalledWith(
  mockT: jest.Mock,
  key: string,
  params?: Record<string, unknown>,
): void {
  if (params) {
    expect(mockT).toHaveBeenCalledWith(key, params);
  } else {
    expect(mockT).toHaveBeenCalledWith(key);
  }
}
```

---

## 7. Totali

| Metrica | Valore |
|---|---|
| **Test già presenti prima della Sessione E1** | 554 |
| **Test da scrivere nella Sessione E1** | 96 |
| **Test totali attesi al completamento** | 650 |
| **Suite nuove create** | 6 |
| **Suite esistenti estese** | 4 |
| **Suite totali attese al completamento** | ~56 (46 precedenti + 10) |

**Distribuzione per file di test:**
- `currency.test.ts` [NEW]: 2 test
- `plurals.test.ts` [MODIFY]: +7 (da 4 a 11)
- `t.test.ts` [MODIFY]: +4 (da 3 a 7)
- `index.announcements.test.ts` [NEW]: 2 test
- `auth.announcements.test.ts` [NEW]: 10 test
- `accounts.announcements.test.ts` [NEW]: 21 test
- `budgets.announcements.test.ts` [NEW]: 17 test
- `ui.announcements.test.ts` [NEW]: 30 test
- `detection.test.ts` [MODIFY]: +2 (da 11 a 13)
- `App.test.tsx` [MODIFY]: +1 (da 1 a 2)

---

## 8. Ordine di Esecuzione Suggerito

```
COMMIT 1: currency.ts (utility pura, nessuna dipendenza)
    |
COMMIT 2: plurals.ts (utility pura, nessuna dipendenza)
    |
COMMIT 3: t.ts (utility, dipende da @/locales mockato)
    |
    +---> COMMIT 4: index.ts     (dipende da engine mockato)
    |
    +---> COMMIT 5: auth.ts      (dipende da t mockato)
    |
    +---> COMMIT 6: accounts.ts  (dipende da t + currency + plurals mockati)
    |
    +---> COMMIT 7: budgets.ts   (dipende da t + currency mockati)
    |
    +---> COMMIT 8: ui.ts        (dipende da t mockato)
                         |
                         +---> COMMIT 9:  detection.ts (integrazione hook)
                         |
                         +---> COMMIT 10: App.tsx       (integrazione root)
```

**Regola:** I commit 1/2/3 sono prerequisiti logici. I commit 4-8 sono parallelizzabili. I commit 9 e 10 sono indipendenti da tutti gli altri.

---

## 9. Protocollo di Validazione

### Comandi di Verifica

```bash
# Verifica globale Sessione E1
npx jest --testPathPattern="currency|plurals|t\.test|announcements|detection|App\.test"

# TypeScript
npx tsc --noEmit

# Test per commit singolo (esempio)
npx jest __tests__/accounts.announcements.test.ts
```

### Criteri di Accettazione

- **Ciclo A (Revisione Tecnica):**
  - Tutti i 96 nuovi test devono risultare PASS.
  - Nessun test preesistente (554) deve essere rotto.
  - Compilazione TypeScript senza errori.
  - Limite tentativi: max 10. In caso di fallimento, presentare un Diagnostic Report.

- **Ciclo B (Revisione Qualitativa):**
  - Assenza di falsi positivi.
  - Verifica ACC-1: ogni test su funzione di errore deve asserire `priority: 'assertive'`.
  - Verifica ACC-2: ogni test su funzione con plurali deve verificare la chiamata a `pluralize`.
  - Isolamento: ogni suite moca autonomamente le proprie dipendenze.

---

## 10. Metriche Attese al Completamento

| Metrica | Pre-E1 | Post-E1 (Target) |
|---|---|---|
| **Test totali** | 554 | 650 |
| **Suite di test** | 46 | ~56 |
| **Copertura accounts.ts** | 0% | >95% |
| **Copertura auth.ts** | 0% | 100% |
| **Copertura budgets.ts** | 0% | >95% |
| **Copertura index.ts** | 0% | 100% |
| **Copertura ui.ts** | 0% | 100% |
| **Copertura currency.ts** | 50% | 100% |
| **Copertura plurals.ts** | 7.69% | 100% |
| **Copertura t.ts** | 50% | 100% |
| **Copertura detection.ts** | 90% | 100% |
| **Copertura App.tsx** | 60% | 100% |

---

## NOTE DI PRODUZIONE

- **Modello utilizzato:** Claude Sonnet 4.6 Thinking
- **Data di produzione:** 2026-07-01
- **File letti durante la FASE 0:**
  1. `docs/3-coding-plans/026-PLAN_test-sessione-E3-authctx-appdatactx_v1.0.0.md` (modello PLAN)
  2. `docs/4-todo-lists/026-TODO_test-sessione-E3-authctx-appdatactx_v1.0.0.md` (modello TODO)
  3. `docs/1-reports/REPORT-analisi-copertura-test-completa_v1.0.0.md` (Blocco 1)
  4. `src/announcements/accounts.ts`
  5. `src/announcements/auth.ts`
  6. `src/announcements/budgets.ts`
  7. `src/announcements/index.ts`
  8. `src/announcements/ui.ts`
  9. `src/announcements/types.ts`
  10. `src/announcements/_utils/currency.ts`
  11. `src/announcements/_utils/plurals.ts`
  12. `src/announcements/_utils/t.ts`
  13. `src/accessibility/detection.ts`
  14. `App.tsx`
  15. `SPARK-START.md`
  16. `CHANGELOG.md` (prime 80 righe)
- **Assunzioni dichiarate:**
  1. I bug BUG-2, BUG-5, BUG-6, BUG-7 sono stati corretti nella Sessione E0. Il codice sorgente lo conferma. I test documentano il comportamento corretto post-fix.
  2. `plurals.test.ts` e `t.test.ts` esistono già con regression test dalla Sessione E0 e vanno estesi.
  3. Il totale di 554 test pre-E1 è confermato dal CHANGELOG (Sessione E3 completata con PASS).
  4. `ui.ts` ha 26 funzioni (contate dal codice). Il report indica 30 test includendo test consolidati e limite aggiuntivi.
  5. La stima di 96 test: 21+10+17+2+30+2+7+4+2+1 = 96 (ANNB-17 aggiunto nella sessione E1-FIX del 2026-07-02).
- **Sessione E1-FIX (2026-07-02):** Correzioni applicate da Antigravity: (1) harness sezione 6 senza jest.mock() globali; (2) ANNA-21 rafforzato con test.each e priority assertive; (3) ANNB-17 aggiunto per announceCategoryCreated; (4) note operative INTD-01/02; (5) tipo Announcement text/priority documentato; (6) nota BUG-3 già coperto; (7) stato DRAFT → READY; (8) totali aggiornati a 96/650.
- **Potenziali bias:** Nessuno identificato.
- **Limite raggiunto nel ciclo di qualità:** No.
