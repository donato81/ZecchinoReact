-- P52 — Tabelle prestiti_mutui e prestiti_rimborsi + RPC atomiche rimborsi
-- Due tabelle per la gestione di mutui, finanziamenti, simulazioni e prestiti personali.
-- Due RPC atomiche per aggiungere ed eliminare rimborsi aggiornando il saldo residuo.
-- Deve essere applicato manualmente dalla Supabase Dashboard prima della codifica del DESIGN 017.

-- ============================================================
-- TABELLA 1: prestiti_mutui
-- ============================================================

CREATE TABLE IF NOT EXISTS prestiti_mutui (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo                TEXT          NOT NULL CHECK (tipo IN ('mutuo_finanziamento', 'prestito_personale')),
  stato               TEXT          NOT NULL DEFAULT 'simulazione' CHECK (stato IN ('simulazione', 'attivo', 'chiuso')),
  direzione           TEXT          NOT NULL CHECK (direzione IN ('devo', 'mi_devono')),
  controparte_nome    TEXT          NOT NULL,
  importo_iniziale    NUMERIC(14,2) NOT NULL CHECK (importo_iniziale > 0),
  valuta              TEXT          NOT NULL DEFAULT 'EUR',
  tasso_annuo         NUMERIC(8,4),
  durata_mesi         INTEGER,
  rata_mensile        NUMERIC(14,2),
  totale_interessi    NUMERIC(14,2),
  data_inizio         DATE          NOT NULL,
  data_fine_prevista  DATE,
  saldo_residuo       NUMERIC(14,2) NOT NULL CHECK (saldo_residuo >= 0),
  note                TEXT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_prestiti_mutui_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prestiti_mutui_updated_at ON prestiti_mutui;
CREATE TRIGGER trg_prestiti_mutui_updated_at
BEFORE UPDATE ON prestiti_mutui
FOR EACH ROW EXECUTE FUNCTION update_prestiti_mutui_updated_at();

-- Indici
CREATE INDEX IF NOT EXISTS idx_prestiti_user        ON prestiti_mutui (user_id);
CREATE INDEX IF NOT EXISTS idx_prestiti_user_stato  ON prestiti_mutui (user_id, stato);

-- Row Level Security
ALTER TABLE prestiti_mutui ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prestiti_mutui_user_policy ON prestiti_mutui;
CREATE POLICY prestiti_mutui_user_policy ON prestiti_mutui
  FOR ALL USING (auth.uid() = user_id);


-- ============================================================
-- TABELLA 2: prestiti_rimborsi
-- ============================================================

CREATE TABLE IF NOT EXISTS prestiti_rimborsi (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  prestito_id     UUID          NOT NULL REFERENCES prestiti_mutui(id) ON DELETE CASCADE,
  user_id         UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  importo         NUMERIC(14,2) NOT NULL CHECK (importo > 0),
  data_rimborso   DATE          NOT NULL,
  quota_capitale  NUMERIC(14,2),
  quota_interessi NUMERIC(14,2),
  note            TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_rimborsi_prestito ON prestiti_rimborsi (prestito_id);
CREATE INDEX IF NOT EXISTS idx_rimborsi_data     ON prestiti_rimborsi (data_rimborso DESC);

-- Row Level Security
ALTER TABLE prestiti_rimborsi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prestiti_rimborsi_user_policy ON prestiti_rimborsi;
CREATE POLICY prestiti_rimborsi_user_policy ON prestiti_rimborsi
  FOR ALL USING (auth.uid() = user_id);


-- ============================================================
-- RPC 1: rpc_aggiungi_rimborso
-- Aggiunge un rimborso e aggiorna il saldo residuo in modo atomico.
-- Se il saldo raggiunge zero, chiude automaticamente il prestito.
-- ============================================================

CREATE OR REPLACE FUNCTION rpc_aggiungi_rimborso(
  p_prestito_id     UUID,
  p_importo         NUMERIC,
  p_data_rimborso   DATE,
  p_quota_capitale  NUMERIC DEFAULT NULL,
  p_quota_interessi NUMERIC DEFAULT NULL,
  p_note            TEXT    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_saldo_attuale NUMERIC(14,2);
  v_nuovo_saldo   NUMERIC(14,2);
BEGIN
  -- Verifica autenticazione
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Accesso non autorizzato';
  END IF;

  -- Verifica che il prestito appartenga all'utente e sia attivo
  SELECT saldo_residuo INTO v_saldo_attuale
  FROM prestiti_mutui
  WHERE id = p_prestito_id
    AND user_id = auth.uid()
    AND stato = 'attivo';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prestito non trovato, non attivo o accesso negato';
  END IF;

  -- Verifica che il rimborso non superi il saldo residuo
  IF p_importo > v_saldo_attuale THEN
    RAISE EXCEPTION 'Il rimborso supera il saldo residuo disponibile';
  END IF;

  -- Calcola il nuovo saldo con arrotondamento a 2 decimali
  v_nuovo_saldo := ROUND(v_saldo_attuale - p_importo, 2);

  -- Inserisce il rimborso
  INSERT INTO prestiti_rimborsi (
    prestito_id, user_id, importo, data_rimborso,
    quota_capitale, quota_interessi, note
  ) VALUES (
    p_prestito_id, auth.uid(), ROUND(p_importo, 2), p_data_rimborso,
    ROUND(p_quota_capitale, 2), ROUND(p_quota_interessi, 2), p_note
  );

  -- Aggiorna saldo residuo e chiude automaticamente se arriva a zero
  UPDATE prestiti_mutui
  SET
    saldo_residuo = v_nuovo_saldo,
    stato = CASE WHEN v_nuovo_saldo = 0 THEN 'chiuso' ELSE stato END,
    updated_at = now()
  WHERE id = p_prestito_id;

END;
$$;

GRANT EXECUTE ON FUNCTION rpc_aggiungi_rimborso(UUID, NUMERIC, DATE, NUMERIC, NUMERIC, TEXT) TO authenticated;


-- ============================================================
-- RPC 2: rpc_elimina_rimborso
-- Elimina un rimborso e ripristina il saldo residuo in modo atomico.
-- Se il prestito era chiuso, lo riporta automaticamente ad attivo.
-- ============================================================

CREATE OR REPLACE FUNCTION rpc_elimina_rimborso(
  p_rimborso_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prestito_id UUID;
  v_importo     NUMERIC(14,2);
BEGIN
  -- Verifica autenticazione
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Accesso non autorizzato';
  END IF;

  -- Recupera i dati del rimborso verificando che appartenga all'utente
  SELECT prestito_id, importo INTO v_prestito_id, v_importo
  FROM prestiti_rimborsi
  WHERE id = p_rimborso_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rimborso non trovato o accesso negato';
  END IF;

  -- Elimina il rimborso
  DELETE FROM prestiti_rimborsi
  WHERE id = p_rimborso_id;

  -- Ripristina il saldo residuo e riapre il prestito se era chiuso
  UPDATE prestiti_mutui
  SET
    saldo_residuo = ROUND(saldo_residuo + v_importo, 2),
    stato = CASE WHEN stato = 'chiuso' THEN 'attivo' ELSE stato END,
    updated_at = now()
  WHERE id = v_prestito_id;

END;
$$;

GRANT EXECUTE ON FUNCTION rpc_elimina_rimborso(UUID) TO authenticated;