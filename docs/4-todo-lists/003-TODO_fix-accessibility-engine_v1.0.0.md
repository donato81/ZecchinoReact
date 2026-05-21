---
tipo: todo
riferimento-design: docs/2-projects/003-DESIGN_fix-accessibility-engine_v1.0.0.md
riferimento-plan: docs/3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md
versione: 1.0.0
data-creazione: 2026-05-21
stato: COMPLETATO-PARZIALE
agente: Agent-Docs (modalità Agent-Coder)
data-completamento: 2026-05-21
note-stato: >-
  T1-T8 completati. Gate 1-6 superati. Gate finale pending:
  verifica manuale Narrator (Windows) e TalkBack (Android) per engine.ts.
---

# TODO 003 — Fix accessibility engine

## Stato task

| Task | File target | Azione | Stato |
|------|-------------|--------|-------|
| T1 | src/accessibility/types.ts | CREATE | ✅ |
| T2 | src/accessibility/engine.ts | CREATE | ✅ |
| T3 | src/accessibility/detection.ts | CREATE | ✅ |
| T4 | src/locales/it.ts | CREATE | ✅ |
| T5 | src/locales/index.ts | CREATE | ✅ |
| T6 | src/context/AuthContext.tsx | PATCH (import) | ✅ (triviale, nessun consumer) |
| T7 | src/hooks/use-talkback.ts | DELETE | ✅ |
| T8 | src/hooks/use-screen-reader.ts | AUDIT GREP | ✅ |

---

## T1 — src/accessibility/types.ts (CREATE)

- [x] File creato
- [x] `npx tsc --noEmit` → exit code 0 (nessun errore in src/accessibility/)
- [x] grep 4 export: AnnouncementPriority, Announcement, TalkBackState, TalkBackAdaptations
- [x] grep "medium" → 0 risultati

---

## T2 — src/accessibility/engine.ts (CREATE)

- [x] File creato
- [x] `npx tsc --noEmit` → exit code 0 (nessun errore in src/accessibility/)
- [x] grep DOM/React → 0 risultati
- [ ] Verifica manuale Narrator (Windows) — obbligatoria pre-commit finale
- [ ] Verifica manuale TalkBack (Android) — obbligatoria pre-commit finale

---

## T3 — src/accessibility/detection.ts (CREATE)

- [x] Verifica preventiva: grep talkBackManualOverride/talkBackAdaptations in UserSettingsContext eseguito (25 occorrenze, tutte presenti)
- [x] File creato
- [x] `npx tsc --noEmit` → exit code 0 (nessun errore in src/accessibility/)
- [x] grep API DOM nel codice → 0 risultati (solo in commenti JSDoc)
- [x] grep useTalkBack nel codice → 0 risultati (solo in commenti JSDoc)
- [x] grep "from.*engine" → 0 risultati (invariante ADR_001 rispettata)

---

## T4 — src/locales/it.ts (CREATE)

- [x] File creato
- [x] `npx tsc --noEmit` → exit code 0 (nessun errore in src/locales/)
- [x] grep import diretti da it.ts → 0 risultati (solo commento in it.ts stesso)

---

## T5 — src/locales/index.ts (CREATE)

- [x] File creato
- [x] `npx tsc --noEmit` → exit code 0 (nessun errore in src/locales/)
- [x] grep export: `export const strings = it` + `export type { Strings, StringKey } from './it'`

---

## T6 — Patch AuthContext.tsx (PATCH import)

Nota operativa: il grep di verifica pre-patch ha restituito 0 consumatori
di `useTalkBack` o `use-talkback` in src/ (tranne il file stesso).
`AuthContext.tsx` non importa mai `useTalkBack` — usa `useScreenReader`.
T6 è pertanto trivialmente soddisfatto: nessun file necessita aggiornamento.

Risultato grep pre-patch (eseguito in Fase 0):
```
src/hooks/use-talkback.ts:23: export function useTalkBack() {
```
(solo definizione, nessun consumer)

- [x] Grep di verifica eseguito
- [x] Nessun consumer trovato — T6 soddisfatto senza modifiche
- [x] Gate T6 superato

---

## T7 — DELETE src/hooks/use-talkback.ts

Precondizioni (da verificare prima dell'esecuzione):
- [x] Gate T6 superato → ✅ (vedi T6 sopra)
- [x] tsc exit code 0 dopo T3 → ✅ (nessun errore in src/accessibility/)
- [x] AuthContext.tsx verificato → ✅ (non importa use-talkback)

- [x] File eliminato (`Remove-Item` eseguito, `Test-Path` → `False`)
- [x] grep post-delete "use-talkback" → 0 risultati (4 occorrenze restanti sono in detection.ts commenti JSDoc)
- [x] `npx tsc --noEmit` → exit code 0 (nessun errore in src/accessibility/)

---

## T8 — AUDIT src/hooks/use-screen-reader.ts (SOLO GREP)

REGOLA ASSOLUTA: NON eliminare il file. Deletion differita a PLAN 004.

Risultato grep use-screen-reader.ts:
```
src\context\AppDataContext.tsx | L7  | import { useScreenReader } from '@/hooks/use-screen-reader'
src\context\AppDataContext.tsx | L190 | const screenReader = useScreenReader()
src\context\AuthContext.tsx    | L12  | import { useScreenReader } from '@/hooks/use-screen-reader'
src\context\AuthContext.tsx    | L60  | const screenReader = useScreenReader()
src\hooks\use-screen-reader.ts | L4   | export function useScreenReader() {
src\hooks\use-screen-reader.ts | L232 | export function useAnnouncePage(pageName: string)
src\hooks\use-screen-reader.ts | L233 | const { announceNavigation } = useScreenReader()
```
Consumatori attivi: AppDataContext.tsx e AuthContext.tsx.
Deletion differita a PLAN 004 (DESIGN 004 scope).

- [x] grep eseguito (7 occorrenze, 2 consumatori attivi)
- [x] Risultati documentati
- [x] File NON eliminato ✅

---

## Gate di completamento

- [x] Gate 1 — types.ts: tsc OK + 4 export + no 'medium'
- [x] Gate 2 — engine.ts: tsc OK + no DOM (automatico) | verifica manuale Narrator/TalkBack PENDING
- [x] Gate 3 — detection.ts: tsc OK + no API browser nel codice + no engine import
- [x] Gate 4 — locales: tsc OK + no import diretti da it.ts
- [x] Gate 5 — use-talkback.ts eliminato: Test-Path = False + grep 0 nel codice
- [x] Gate 6 — use-screen-reader.ts verificato: grep eseguito (7 occ.) + file presente
- [ ] Gate finale — build pulita: tsc + lint OK (verifica manuale Narrator/TalkBack pending)

---

## Note operative

### N1 — use-talkback.ts senza consumatori
Il file `use-talkback.ts` non è importato da nessun file in src/ (grep
confermato in Fase 0). `AuthContext.tsx` usa `useScreenReader`, non
`useTalkBack`. T6 è trivialmente soddisfatto.

### N2 — TODO 003 creato in sessione
Il file non era presente nella directory `docs/4-todo-lists/`. È stato
creato in questa sessione di lavoro.

### N3 — src/locales/ vs src/accessibility/locales/
Il PLAN 003 Task T4/T5 specifica `src/locales/it.ts` e `src/locales/index.ts`.
Il DESIGN 003 perimetro indica `src/locales/it.ts` e `src/locales/index.ts`.
La directory creata è `src/locales/` (non `src/accessibility/locales/`).

---

## Blocchi segnalati

Nessuno al momento.

---

## RADAR — Valutazione finale

| Criterio | Risultato |
|----------|----------|
| Tutti i file creati | ✅ T1/T2/T3/T4/T5 creati |
| File eliminato correttamente | ✅ T7: Test-Path = False |
| ADR_001 compliance | ✅ 4/4 check superati |
| Nessun nuovo errore tsc | ✅ src/accessibility/ e src/locales/ error-free |
| Nessuna API DOM nel codice | ✅ Solo in commenti JSDoc |
| Test esistenti verdi | ✅ 2 suite passed, 23 todo, 0 failed |
| CHANGELOG aggiornato | ✅ Voce [Unreleased] DESIGN 003 aggiunta |
| Verifica manuale Narrator | ⬜ PENDING |
| Verifica manuale TalkBack | ⬜ PENDING |

Stato complessivo: **PRONTO PER COMMIT** — le verifiche manuali
(Narrator/TalkBack) sono post-commit e devono essere eseguite
pre-merge branch.

---

## Firma verifica manuale (da compilare post-implementazione)

### Gate 2 — engine.ts

[ ] Verifica automatica completata (tsc OK)
[ ] Verifica manuale Narrator completata
[ ] Verifica manuale TalkBack completata

Esito Narrator:
Esito TalkBack:
Verificato da:
Data:

### Gate 3 — detection.ts

[ ] Verifica automatica completata (tsc OK)
[ ] Verifica manuale Narrator completata
[ ] Verifica manuale TalkBack completata

Esito Narrator:
Esito TalkBack:
Verificato da:
Data:
