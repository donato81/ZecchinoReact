-- P51 — Estensione tabella notifiche con metadata JSONB
-- Supporta il DESIGN 015 aggiungendo i metadata obbligatori per notifiche budget.

ALTER TABLE notifiche
ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_notifiche_metadata_gin
ON notifiche
USING GIN (metadata);