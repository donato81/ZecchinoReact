-- ============================================================
-- P55 — Riallineamento tabella notifiche per DESIGN 019
-- DESIGN 019 — Notifiche Budget e Orchestrazione
-- Versione: 0.1.0
-- Data: 2026-06-25
-- ============================================================
--
-- CONTESTO:
-- La tabella notifiche esiste già con le colonne:
--   id, user_id, tipo, titolo, messaggio, letta, canale,
--   schedulata_per, entita_tipo, entita_id, created_at
-- P51 ha aggiunto: metadata JSONB NOT NULL DEFAULT '{}'
--   con indice GIN idx_notifiche_metadata_gin.
-- Indici già presenti:
--   idx_notifiche_user_letta  (user_id + letta)
--   idx_notifiche_schedulata  (schedulata_per)
--
-- QUESTO FILE AGGIUNGE:
--   1. Colonna livello TEXT con CHECK sui valori ammessi.
--   2. Indice su entita_id per query per entità.
--   3. Indice parziale composito per deduplicazione
--      (entita_id + livello) dove letta = false.
-- ============================================================


-- ------------------------------------------------------------
-- SEZIONE 1 — Nuova colonna: livello
-- ------------------------------------------------------------
-- Replica il campo semantico principale come colonna
-- esplicita, oltre che dentro metadata, per consentire
-- indici B-tree e query efficienti senza operatori JSONB.
-- Nullable: le notifiche di tipo sistema o obiettivo_raggiunto
-- non hanno un livello semantico budget.
-- I valori ammessi rispecchiano NotificationLevel di DESIGN 019.
-- ------------------------------------------------------------

ALTER TABLE notifiche
  ADD COLUMN IF NOT EXISTS livello TEXT
  CHECK (livello IN ('info', 'warning', 'critical', 'exceeded'));


-- ------------------------------------------------------------
-- SEZIONE 2 — Nuovi indici
-- ------------------------------------------------------------

-- Indice su entita_id.
-- Serve a getUnreadByEntity e existsUnreadForEntityLevel
-- per recuperare tutte le notifiche di un budget specifico.
-- Creato separato da user_id perché le query del repository
-- filtrano già su user_id tramite RLS; l'indice su sola
-- entita_id è più selettivo per budget con molte notifiche.
CREATE INDEX IF NOT EXISTS idx_notifiche_entita_id
  ON notifiche (entita_id);

-- Indice parziale composito per deduplicazione.
-- Usato da existsUnreadForEntityLevel: verifica se esiste
-- già una notifica non letta per la stessa entità e livello.
-- WHERE letta = false mantiene l'indice piccolo nel tempo:
-- le notifiche già lette non partecipano mai alla dedup.
CREATE INDEX IF NOT EXISTS idx_notifiche_entita_livello_unread
  ON notifiche (entita_id, livello)
  WHERE letta = false;


-- ------------------------------------------------------------
-- FINE P55
-- Nessuna modifica a RLS: le policy esistenti coprono già
-- SELECT, INSERT, UPDATE, DELETE per user_id = auth.uid().
-- Nessuna modifica a colonne esistenti.
-- ------------------------------------------------------------