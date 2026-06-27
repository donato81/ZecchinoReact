# Avvia SPARK

Il workspace è configurato. Per iniziare:

1. Apri il pannello Copilot in VS Code (`Ctrl+Shift+I`).
2. Seleziona la modalità **Agent**.
3. Scegli l'agente **spark-assistant**.
4. Scrivi: `inizializza il workspace`

SPARK avvierà l'orientamento e proporrà i pacchetti
necessari per il tuo progetto.

---

*Puoi eliminare questo file dopo il primo avvio.*
*Per domande sull'architettura SPARK, usa l'agente `spark-guide`.*

Versione corrente progetto: `0.18.0`.
Analisi Android completata (DUSU-ANALYZER 2025-07-25).
Stato aggiornato: 2026-06-27.
Blocchi completati: 010 Wrapped Master Key PIN, 011 Resilienza Bootstrap,
012 Export Nativo Guard Concorrente, 017 Prestiti e Mutui, 018 Confronto Mese su Mese per Categoria,
019 Notifiche Budget e Orchestrazione, 020 Centralizzazione design tokens, 021 Haptic System nativo,
022 Sound System nativo, Copertura Test Moduli Core (39 test unitari).
Suite di test: PASS.
Decisione release: versione avanzata a `0.18.0` consolidando la suite di test unitari completa sui 7 moduli core.
Prossima azione: Attendere definizione prossimo blocco da donny-81.

---

## Stato Compatibilità Android

**Report:** [REPORT-compatibilita-android-v1.0.0.md](docs/1-reports/REPORT-compatibilita-android-v1.0.0.md)

| Gate | Stato | Blocchi aperti |
|------|-------|---------------|
| Gate 1 — Build Android | ✅ PRONTO | — (BC-01, BC-02, BC-03 CLOSED) |
| Gate 2 — Runtime Core | ✅ PRONTO | — (crypto, export, NetInfo, Supabase ✅) |
| Gate 3 — Runtime UI | ⏳ IN ATTESA | AN-03 (oklch) (AN-01, AN-02 CLOSED) |
| Gate 4 — Documentazione | ⏳ IN ATTESA | DD-01 (patch orfana) (DD-02 CLOSED) |

**Target platform:** iOS ✅ (non testato) · Android ✅ (pronto per build) · Windows ❄️ (DT-009-N-01 aperto)

---

## Stato DESIGN

- [DESIGN 009 — Export File Nativo](docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md) — v0.1.0 — REVIEWED
- [DESIGN 009-native — Modulo nativo WinRT Save Picker](docs/2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md) — v0.1.0 — DRAFT (approvato Consiglio AI 2026-05-25)

- [DESIGN 013 — Repository Ricorrenze](docs/2-projects/013-DESIGN_repository-ricorrenze_v0.1.0.md) — v0.1.0 — REVIEWED
- [DESIGN 014 — Repository Tag e Transazioni-Tag](docs/2-projects/014-DESIGN_repository-tag-transazioni-tag_v0.1.0.md) — v0.1.0 — REVIEWED
- [DESIGN 015 — Repository Notifiche e Notification Service](docs/2-projects/015-DESIGN_repository-notifiche-notification-service_v0.1.0.md) — v0.1.0 — REVIEWED
- [DESIGN 016 — Repository Allegati Transazioni](docs/2-projects/016-DESIGN_allegati-transazioni_v0.1.0.md) — v0.1.0 — REVIEWED
- [DESIGN 016-bis — Cleanup Orfani Storage](docs/2-projects/016-bis-DESIGN_cleanup-orfani-storage_v0.1.0.md) — v0.1.0 — REVIEWED
- [DESIGN 016-ter — Magic Bytes Validation](docs/2-projects/016-ter-DESIGN_magic-bytes-validation_v0.1.0.md) — v0.1.0 — REVIEWED
- [DESIGN 017 — Prestiti, Mutui e Simulazione Finanziaria](docs/2-projects/017-DESIGN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md) — v0.1.0 — REVIEWED
- [DESIGN 018 — Confronto mese su mese per categoria](docs/2-projects/018-DESIGN_confronto-mese-su-mese-categoria_v0.1.0.md) — v0.1.0 — REVIEWED
- [DESIGN 019 — Notifiche Budget e Orchestrazione](docs/2-projects/019-DESIGN_notifiche-budget-orchestrazione_v0.1.0.md) — v0.1.0 — REVIEWED
- [DESIGN 020 — Centralizzazione design tokens: colori e chiavi icone](docs/2-projects/020-DESIGN_icone-colori-design-system_v0.2.0.md) — v0.2.0 — REVIEWED
- [DESIGN 021 — Refactor Haptic System — sostituzione navigator.vibrate() con expo-haptics](docs/2-projects/021-DESIGN_haptic-system_v0.1.0.md) — v0.1.0 — REVIEWED
- [DESIGN 022 — Sound System — Refactoring motore audio nativo](docs/2-projects/022-DESIGN_sound-system_v0.1.0.md) — v0.1.1 — REVIEWED

## Stato PLAN / TODO

- [PLAN 009 — Export File Nativo](docs/3-coding-plans/009-PLAN_export-nativo_v0.1.0.md) — v0.1.0 — COMPLETATO lato piano padre
- [TODO 009 — Export File Nativo](docs/4-todo-lists/009-TODO_export-nativo_v0.1.0.md) — v0.1.0 — DONE
- [PLAN 009-native — Bridge C++/WinRT WinRT Save Picker](docs/3-coding-plans/009-native-PLAN_winrt-save-picker_v0.1.0.md) — v0.1.0 — DRAFT
- [TODO 009-native — Bridge C++/WinRT WinRT Save Picker](docs/4-todo-lists/009-native-TODO_winrt-save-picker_v0.1.0.md) — v0.1.0 — PENDING
- [PLAN 013 — Repository Ricorrenze](docs/3-coding-plans/013-PLAN_repository-ricorrenze_v0.1.0.md) — v0.1.0 — DRAFT
- [TODO 013 — Repository Ricorrenze](docs/4-todo-lists/013-TODO_repository-ricorrenze_v0.1.0.md) — v0.1.0 — PENDING
- [PLAN 014 — Repository Tag e Transazioni-Tag](docs/3-coding-plans/014-PLAN_repository-tag-transazioni-tag_v0.1.0.md) — v0.1.0 — DRAFT
- [TODO 014 — Repository Tag e Transazioni-Tag](docs/4-todo-lists/014-TODO_repository-tag-transazioni-tag_v0.1.0.md) — v0.1.0 — PENDING
- [PLAN 015 — Repository Notifiche e Notification Service](docs/3-coding-plans/015-PLAN_repository-notifiche-notification-service_v0.1.0.md) — v0.1.0 — DRAFT
- [TODO 015 — Repository Notifiche e Notification Service](docs/4-todo-lists/015-TODO_repository-notifiche-notification-service_v0.1.0.md) — v0.1.0 — PENDING
- [PLAN 016 — Allegati Transazioni](docs/3-coding-plans/016-PLAN_allegati-transazioni_v0.1.0.md) — v0.1.0 — DRAFT
- [TODO 016 — Allegati Transazioni](docs/4-todo-lists/016-TODO_allegati-transazioni_v0.1.0.md) — v0.1.0 — PENDING
- [PLAN 016-bis — Cleanup Orfani Storage](docs/3-coding-plans/016-bis-PLAN_cleanup-orfani-storage_v0.1.0.md) — v0.1.0 — DRAFT
- [TODO 016-bis — Cleanup Orfani Storage](docs/4-todo-lists/016-bis-TODO_cleanup-orfani-storage_v0.1.0.md) — v0.1.0 — PENDING
- [PLAN 016-ter — Magic Bytes Validation](docs/3-coding-plans/016-ter-PLAN_magic-bytes-validation_v0.1.0.md) — v0.1.0 — DRAFT
- [TODO 016-ter — Magic Bytes Validation](docs/4-todo-lists/016-ter-TODO_magic-bytes-validation_v0.1.0.md) — v0.1.0 — PENDING
- [PLAN 017 — Prestiti, Mutui e Simulazione Finanziaria](docs/3-coding-plans/017-PLAN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md) — v0.1.0 — REVIEWED
- [TODO 017 — Prestiti, Mutui e Simulazione Finanziaria](docs/4-todo-lists/017-TODO_prestiti-mutui-simulazione-finanziaria_v0.1.0.md) — v0.1.0 — PENDING
- [PLAN 018 — Confronto Mese su Mese per Categoria](docs/3-coding-plans/018-PLAN_confronto-mese-su-mese-categoria_v0.1.0.md) — v0.1.0 — REVIEWED
- [TODO 018 — Confronto Mese su Mese per Categoria](docs/4-todo-lists/018-TODO_confronto-mese-su-mese-categoria_v0.1.0.md) — v0.1.0 — PENDING
- [PLAN 019 — Notifiche Budget e Orchestrazione](docs/3-coding-plans/019-PLAN_notifiche-budget-orchestrazione_v0.1.0.md) — v0.1.0 — REVIEWED
- [TODO 019 — Notifiche Budget e Orchestrazione](docs/4-todo-lists/019-TODO_notifiche-budget-orchestrazione_v0.1.0.md) — v0.1.0 — PENDING
- [PLAN 020 — Centralizzazione design tokens: colori e chiavi icone](docs/3-coding-plans/020-PLAN_icone-colori-design-system_v0.2.0.md) — v0.2.0 — DRAFT
- [TODO 020 — Centralizzazione design tokens: colori e chiavi icone](docs/4-todo-lists/020-TODO_icone-colori-design-system_v0.2.0.md) — v0.2.0 — PENDING
- [PLAN 021 — Refactor Haptic System — sostituzione navigator.vibrate() con expo-haptics](docs/3-coding-plans/021-PLAN_haptic-system_v0.1.0.md) — v0.1.0 — COMPLETATO
- [TODO 021 — Refactor Haptic System — sostituzione navigator.vibrate() con expo-haptics](docs/4-todo-lists/021-TODO_haptic-system_v0.1.0.md) — v0.1.0 — DONE
- [PLAN 022 — Sound System — Refactoring motore audio nativo](docs/3-coding-plans/022-PLAN_sound-system_v0.1.0.md) — v0.1.0 — COMPLETATO
- [TODO 022 — Sound System — Refactoring motore audio nativo](docs/4-todo-lists/022-TODO_sound-system_v0.1.0.md) — v0.1.0 — DONE


Correzioni applicate il 2026-06-27.
Stato: COMPLETATO.

Blocco residuo: `009-native` resta aperto solo per le validazioni runtime
T3-N5 su Windows e Android. Non sblocca da solo una nuova release: il progetto
resta alla `0.18.0` finche' i blocchi compatibilita' aperti non vengono chiusi.
