-- P40 — Aggiungi colonna pin_kdf_salt a impostazioni_utente
-- Branch: main
-- Data: 2026-05-26
-- Riferimento: docs/2-projects/006-DESIGN_kdf-pin_v0.4.0.md §5 e §9
--
-- ISTRUZIONI DI ESECUZIONE:
-- 1. Verificare che la tabella impostazioni_utente esista (P25).
-- 2. Verificare che la colonna pin_kdf_salt NON esista già.
-- 3. Eseguire il blocco UP.

-- ============================================================
-- BLOCCO UP — Aggiunta colonna
-- ============================================================

ALTER TABLE impostazioni_utente
  ADD COLUMN IF NOT EXISTS pin_kdf_salt text;

-- Invariante: pin_kdf_salt e pin_privato_hash devono essere
-- entrambi NULL o entrambi non-NULL. La coerenza è applicata
-- a livello applicativo (vedi Fase 6 — Atomicità impostazione PIN).

-- ============================================================
-- BLOCCO DOWN — Rimozione colonna (rollback)
-- ============================================================

-- Ambienti ammessi per il DOWN:
-- - Sviluppo locale: sempre ammesso.
-- - Staging/Test: ammesso solo se i dati non sono reali.
-- - Produzione: non ammesso; trattare il rollback come no-op documentato.

ALTER TABLE impostazioni_utente
  DROP COLUMN IF EXISTS pin_kdf_salt;