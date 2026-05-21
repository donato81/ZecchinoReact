---
tipo: todo
titolo: "TODO — Announcements Layer (DESIGN 004)"
riferimento-design: docs/2-projects/004-DESIGN_announcements-layer_v1_0_0.md
riferimento-plan: docs/3-coding-plans/004-PLAN_announcements-layer_v1_0_0.md
versione: 1.0.0
data-creazione: 2026-05-21
stato: PENDING
agente: —
data-completamento: —
note-stato: >-
  Documento operativo derivato dal PLAN 004. Tutti i task PENDING in attesa
  di validazione del Consiglio AI prima dell'avvio dell'implementazione.
---

# TODO 004 — Announcements Layer

## 1. Stato / Snapshot

| Campo | Valore |
|-------|--------|
| Ultimo Agente Attivo | — |
| Blocco in Carico | — |
| Last Completed Task | — |
| Next Action | Validazione Consiglio AI su DESIGN 004, PLAN 004 e questo TODO |
| Open Threads | — |

---

## 2. Stato task

| Task | File target | Azione | Gate | Stato |
|------|-------------|--------|------|-------|
| T1  | src/locales/it.ts                      | PATCH (72 chiavi)        | Gate 1 | ☐ |
| T2  | src/announcements/types.ts             | CREATE                   | Gate 2 | ☐ |
| T3  | src/announcements/_utils/t.ts          | CREATE                   | Gate 3 | ☐ |
| T4  | src/announcements/_utils/currency.ts   | CREATE                   | Gate 3 | ☐ |
| T5  | src/announcements/_utils/dates.ts      | CREATE                   | Gate 3 | ☐ |
| T6  | src/announcements/_utils/plurals.ts    | CREATE                   | Gate 3 | ☐ |
| T7  | src/announcements/ui.ts                | CREATE                   | Gate 4 | ☐ |
| T8  | src/announcements/auth.ts              | CREATE                   | Gate 4 | ☐ |
| T9  | src/announcements/accounts.ts          | CREATE                   | Gate 4 | ☐ |
| T10 | src/announcements/budgets.ts           | CREATE                   | Gate 4 | ☐ |
| T11 | src/announcements/index.ts             | CREATE (unico import engine) | Gate 5 | ☐ |
| T12 | src/context/AuthContext.tsx            | PATCH                    | Gate 6 | ☐ |
| T13 | src/context/AppDataContext.tsx         | PATCH                    | Gate 6 | ☐ |
| T14 | src/hooks/use-screen-reader.ts + src/lib/screen-reader.ts | DELETE | Gate 7 (bloccante) | ☐ |

---

## 3. Task atomici

### T4.B1.N1 — locales/it.ts (PATCH — 72 chiavi)

- **File:** `src/locales/it.ts`
- **Azione:** Sostituire l'oggetto `it` vuoto con il dizionario 72 chiavi (6 aree).
- **Gate 1:** `npx tsc --noEmit` pulito; `grep -c "^  [a-z_]*:" src/locales/it.ts` = 72.

- [ ] PATCH applicata
- [ ] `npx tsc --noEmit` exit 0
- [ ] Conteggio chiavi = 72

---

### T4.B2.N1 — announcements/types.ts (CREATE)

- **File:** `src/announcements/types.ts`
- **Azione:** Definire `ActionType`, `actionKeyMap`, re-export `Announcement` e `AnnouncementPriority` (solo `import type`).
- **Dipende da:** T4.B1.N1
- **Gate 2:** tsc pulito; `grep -E "import \{ engine" src/announcements/types.ts` = 0 risultati.

- [ ] File creato
- [ ] `npx tsc --noEmit` exit 0
- [ ] grep `import { engine` = 0

---

### T4.B3.N1 — announcements/_utils/t.ts (CREATE)

- **File:** `src/announcements/_utils/t.ts`
- **Azione:** Helper privato `t(key, params)` con sostituzione placeholder `{nome}`.
- **Dipende da:** T4.B2.N1
- **Gate 3:** tsc pulito; nessun import di `engine` in `_utils/`.

- [ ] File creato
- [ ] `npx tsc --noEmit` exit 0

---

### T4.B3.N2 — announcements/_utils/currency.ts (CREATE)

- **File:** `src/announcements/_utils/currency.ts`
- **Azione:** `formatCurrencyVocal(amount)` → "X,YY euro" (Intl.NumberFormat it-IT).
- **Gate 3:** tsc pulito.

- [ ] File creato
- [ ] `npx tsc --noEmit` exit 0

---

### T4.B3.N3 — announcements/_utils/dates.ts (CREATE)

- **File:** `src/announcements/_utils/dates.ts`
- **Azione:** `formatDateVocal(date)` → "31 dicembre 2026" (Intl.DateTimeFormat it-IT); stringa vuota su input invalido.
- **Gate 3:** tsc pulito.

- [ ] File creato
- [ ] `npx tsc --noEmit` exit 0

---

### T4.B3.N4 — announcements/_utils/plurals.ts (CREATE)

- **File:** `src/announcements/_utils/plurals.ts`
- **Azione:** `pluralize(word, count)` con eccezioni `IRREGULAR` (euro, movimento, conto, budget, obiettivo, dato, categoria, elemento) + regole morfologiche o→i / a→e / e→i.
- **Gate 3:** tsc pulito; nessun import di `engine` in `_utils/`.

- [ ] File creato
- [ ] `npx tsc --noEmit` exit 0
- [ ] grep `import { engine` su `_utils/` = 0

---

### T4.B4.N1 — announcements/ui.ts (CREATE)

- **File:** `src/announcements/ui.ts`
- **Azione:** Annunci UI generici (navigation, error, success, count, dialog, progress, focus, list, filter, sort, action, volume, preset, template, form, toggle, card, period, help, dataCleared). Usa `t()`, `pluralize()`, `actionKeyMap`. Niente logica finanziaria.
- **Dipende da:** T4.B2.N1, T4.B3.N1, T4.B3.N4
- **Gate 4:** tsc pulito; nessun import di `engine`.

- [ ] File creato
- [ ] `npx tsc --noEmit` exit 0
- [ ] grep `import { engine|from '@/accessibility/engine'` = 0

---

### T4.B4.N2 — announcements/auth.ts (CREATE)

- **File:** `src/announcements/auth.ts`
- **Azione:** Annunci auth/PIN/sessione: `pinNotConfigured`, `pinInvalid`, `privateUnlocked`, `pinSet`, `pinChanged`, `pinRemoved`, `sessionKept` (polite), `privateAccountLocked`. Naming senza prefisso `announce`.
- **Dipende da:** T4.B2.N1, T4.B3.N1
- **Gate 4:** tsc pulito; nessun import di `engine`.

- [ ] File creato
- [ ] `npx tsc --noEmit` exit 0
- [ ] grep `import { engine|from '@/accessibility/engine'` = 0

---

### T4.B4.N3 — announcements/accounts.ts (CREATE)

- **File:** `src/announcements/accounts.ts`
- **Azione:** Annunci conti/movimenti/export-import. Funzioni con parametri numerici **raw** (formattazione interna via `formatCurrencyVocal`). Include `announceExportCSV`, `announceExport`, `announceImportComplete` (decisione P2 REPORT 004).
- **Dipende da:** T4.B2.N1, T4.B3.N1, T4.B3.N2, T4.B3.N4
- **Gate 4:** tsc pulito; nessun import di `engine`.

- [ ] File creato
- [ ] `npx tsc --noEmit` exit 0
- [ ] grep `import { engine|from '@/accessibility/engine'` = 0

---

### T4.B4.N4 — announcements/budgets.ts (CREATE)

- **File:** `src/announcements/budgets.ts`
- **Azione:** Annunci budget e obiettivi di risparmio. Include logica composita `announceBudgetStatus` (4 rami: exceeded/critical/warning/normal) e `announceSavingsGoalProgress` (3 rami: done/near/normal). Usa `formatCurrencyVocal` e `formatDateVocal`.
- **Dipende da:** T4.B2.N1, T4.B3.N1, T4.B3.N2, T4.B3.N3
- **Gate 4:** tsc pulito; nessun import di `engine`.

- [ ] File creato
- [ ] `npx tsc --noEmit` exit 0
- [ ] grep `import { engine|from '@/accessibility/engine'` = 0

---

### T4.B5.N1 — announcements/index.ts (CREATE — ultimo modulo announcements/)

- **File:** `src/announcements/index.ts`
- **Azione:** Unico punto pubblico del layer. **Unico file di `announcements/` autorizzato a importare `engine`** da `@/accessibility/engine`. Espone `announce()`, re-export tipi (`Announcement`, `AnnouncementPriority`, `ActionType`) e namespace `ui`, `auth`, `accounts`, `budgets`.
- **Dipende da:** T4.B4.N1, T4.B4.N2, T4.B4.N3, T4.B4.N4
- **Gate 5:** tsc pulito; `grep -E "from '@/accessibility/engine'" src/announcements/index.ts` = **esattamente 1**.

- [ ] File creato
- [ ] `npx tsc --noEmit` exit 0
- [ ] grep `from '@/accessibility/engine'` = 1 (solo qui)

---

### T4.B6.N1 — AuthContext.tsx (PATCH)

- **File:** `src/context/AuthContext.tsx`
- **Azione:** Migrare da `useScreenReader` a `@/announcements`. Rimuovere `isScreenReaderActive` e i guard relativi. Sostituire 7 chiamate `screenReader.*` con `announce(auth.*)`. Aggiungere `announce(auth.privateAccountLocked())` in `lockPrivate`. Pulire deps array `useCallback`.
- **Dipende da:** T4.B5.N1
- **Gate 6:** tsc pulito; grep `useScreenReader|screenReader\.|isScreenReaderActive` su file = 0.

- [ ] Import `useScreenReader` rimosso
- [ ] Import `announce, auth` aggiunto
- [ ] Dichiarazione `screenReader` rimossa
- [ ] Dichiarazione/uso `isScreenReaderActive` rimossi
- [ ] 7 sostituzioni `screenReader.*` → `announce(auth.*)` applicate
- [ ] `announce(auth.privateAccountLocked())` aggiunto in `lockPrivate`
- [ ] Deps `useCallback` ripulite
- [ ] `npx tsc --noEmit` exit 0
- [ ] grep residui = 0

---

### T4.B6.N2 — AppDataContext.tsx (PATCH)

- **File:** `src/context/AppDataContext.tsx`
- **Azione:** Migrare da `useScreenReader` a `@/announcements`. Rimuovere `screenReader`. Sostituire 17 chiamate `screenReader.*` con `announce(accounts.*/budgets.*)`. Rimuovere chiamate a `formatCurrency(...)` nei parametri (passaggio raw). Verificare se `formatCurrency` è ancora usato altrove; rimuoverlo dagli import se orfano. `checkBudgetNotifications` resta intatto (decisione P4 REPORT 004).
- **Dipende da:** T4.B5.N1
- **Gate 6:** tsc pulito; grep `useScreenReader|screenReader\.` su file = 0.

- [ ] Import `useScreenReader` rimosso
- [ ] Import `announce, accounts, budgets` aggiunto
- [ ] Dichiarazione `screenReader` rimossa
- [ ] 17 sostituzioni `screenReader.*` applicate (vedi tabella PLAN 004 T13)
- [ ] Parametri numerici passati raw (no `formatCurrency` nei params)
- [ ] Import `formatCurrency` verificato/ripulito se orfano
- [ ] `checkBudgetNotifications` NON modificata
- [ ] `npx tsc --noEmit` exit 0
- [ ] grep residui = 0

---

### T4.B7.N1 — DELETE use-screen-reader.ts + screen-reader.ts (gate finale bloccante)

- **File:** `src/hooks/use-screen-reader.ts`, `src/lib/screen-reader.ts`
- **Azione:** Verifica grep residui (atteso 0 in entrambi i casi) → `Remove-Item` di entrambi i file → `npx tsc --noEmit` (atteso 0 errori).
- **Dipende da:** T4.B6.N1, T4.B6.N2
- **Gate 7 (bloccante):** entrambi i file assenti (`Test-Path` False) e build pulita.

- [ ] grep `from.*use-screen-reader|useScreenReader` su `src/` = 0
- [ ] `Remove-Item src/hooks/use-screen-reader.ts` eseguito
- [ ] grep `from.*lib/screen-reader|from.*screen-reader|ScreenReaderAnnouncer|screenReader\.` su `src/` = 0
- [ ] `Remove-Item src/lib/screen-reader.ts` eseguito
- [ ] `Test-Path src/hooks/use-screen-reader.ts` = False
- [ ] `Test-Path src/lib/screen-reader.ts` = False
- [ ] `npx tsc --noEmit` exit 0

---

## 4. Note Operative

### NOTA 1 — Nessuna implementazione prima della validazione

Questo TODO non deve essere eseguito prima che il Consiglio AI abbia
validato i documenti DESIGN 004 + PLAN 004 + TODO 004 (stessa procedura
applicata ai cicli DESIGN 001/002/003). Mantenere `stato: PENDING` fino
al via libera esplicito.

### NOTA 2 — Baseline TS attesa

Al momento dell'avvio dell'implementazione la baseline è ~89 errori
TypeScript noti documentati nel `todo-master.md` (NOTA 2). I task T1–T11
introducono codice nuovo che deve essere internamente type-clean
(`npx tsc --noEmit` sul perimetro non aumenta il count complessivo).
T12–T14 dovrebbero ridurre il count rimuovendo file legacy.

### NOTA 3 — Allineamento con stato repository

Al 2026-05-21 lo stato verificato del repository è:

- `src/accessibility/types.ts`, `engine.ts`, `detection.ts` → presenti
  (creati in DESIGN 003).
- `src/locales/it.ts` (vuoto) e `src/locales/index.ts` → presenti
  (creati in DESIGN 003).
- `src/hooks/use-talkback.ts` → eliminato in DESIGN 003.
- `src/hooks/use-screen-reader.ts` e `src/lib/screen-reader.ts` →
  ancora presenti, deletion programmata in T4.B7.N1 (Gate 7).

Non prescrivere la creazione di file già presenti; il PLAN 004 li
referenzia come precondizione, non come azione.

---

## 5. Log Validazione

| Data | Blocco | Agente | Esito | Note |
|------|--------|--------|-------|------|
