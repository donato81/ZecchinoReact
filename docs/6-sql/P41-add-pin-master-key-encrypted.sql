-- P41 — Aggiungi colonna pin_master_key_encrypted a impostazioni_utente
-- Branch: main
-- Data: 2026-05-27
-- Riferimento: docs/2-projects/010-DESIGN_wrapped-master-key-PIN_v0.1.0.md
--
-- ISTRUZIONI DI ESECUZIONE:
-- 1. Verificare che P40-add-pin-kdf-salt.sql sia già stato eseguito.
-- 2. Verificare che la colonna pin_master_key_encrypted NON esista già.
-- 3. Eseguire P40 e P41 insieme nello stesso intervento coordinato.

-- ============================================================
-- BLOCCO UP — Aggiunta colonna
-- ============================================================

ALTER TABLE impostazioni_utente
  ADD COLUMN IF NOT EXISTS pin_master_key_encrypted text;

-- Invariante: pin_kdf_salt, pin_master_key_encrypted e
-- pin_privato_hash devono essere tutti NULL o tutti non-NULL.
-- La coerenza è applicata a livello applicativo con
-- operazione UPDATE atomica su tutti e tre i campi.
-- Riferimento: DESIGN 010 CA-2.

-- ============================================================
-- BLOCCO DOWN — Rimozione colonna (rollback)
-- ============================================================

-- Ambienti ammessi per il DOWN:
-- - Sviluppo locale: sempre ammesso.
-- - Staging/Test: ammesso solo se i dati non sono reali.
-- - Produzione: non ammesso; trattare il rollback come no-op documentato.

ALTER TABLE impostazioni_utente
  DROP COLUMN IF EXISTS pin_master_key_encrypted;