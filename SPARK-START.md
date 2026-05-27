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

Versione corrente progetto: `0.4.0`.
Analisi Android completata (DUSU-ANALYZER 2025-07-25).
Stato aggiornato: 2026-05-27
Prossima azione: codifica blocco 010
Wrapped Master Key PIN.
Gate ingresso verificato.
Sequenza: 010 → 011 → 012.

---

## Stato Compatibilità Android

**Report:** [REPORT-compatibilita-android-v1.0.0.md](docs/1-reports/REPORT-compatibilita-android-v1.0.0.md)

| Gate | Stato | Blocchi aperti |
|------|-------|---------------|
| Gate 1 — Build Android | ❌ BLOCCATO | BC-01, BC-02, BC-03 |
| Gate 2 — Runtime Core | ✅ PRONTO | — (crypto, export, NetInfo, Supabase ✅) |
| Gate 3 — Runtime UI | ⏳ IN ATTESA | AN-01 (haptic), AN-02 (sound), AN-03 (oklch) |
| Gate 4 — Documentazione | ⏳ IN ATTESA | DD-01 (patch orfana), DD-02 (architettura.md stale) |

**Target platform:** iOS ✅ (non testato) · Android ❌ (build bloccata da BC-01) · Windows ❄️ (DT-009-N-01 aperto)

---

## Stato DESIGN

- [DESIGN 009 — Export File Nativo](docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md) — v0.1.0 — REVIEWED
- [DESIGN 009-native — Modulo nativo WinRT Save Picker](docs/2-projects/009-native-DESIGN_winrt-save-picker_v0.1.0.md) — v0.1.0 — DRAFT (approvato Consiglio AI 2026-05-25)

## Stato PLAN / TODO

- [PLAN 009 — Export File Nativo](docs/3-coding-plans/009-PLAN_export-nativo_v0.1.0.md) — v0.1.0 — COMPLETATO lato piano padre
- [TODO 009 — Export File Nativo](docs/4-todo-lists/009-TODO_export-nativo_v0.1.0.md) — v0.1.0 — DONE
- [PLAN 009-native — Bridge C++/WinRT WinRT Save Picker](docs/3-coding-plans/009-native-PLAN_winrt-save-picker_v0.1.0.md) — v0.1.0 — DRAFT
- [TODO 009-native — Bridge C++/WinRT WinRT Save Picker](docs/4-todo-lists/009-native-TODO_winrt-save-picker_v0.1.0.md) — v0.1.0 — PENDING

Blocco residuo: `009-native` resta aperto solo per le validazioni runtime
T3-N5 su Windows e Android. Non blocca la promozione della release 0.4.0 del
progetto.
