-- P50 — RPC gestione tag su transazioni
-- Tre funzioni idempotenti per associare, sostituire e rimuovere tag da una transazione.
-- Tutte le funzioni operano solo sui dati dell'utente autenticato (auth.uid()).
-- Devono essere applicate manualmente dalla Supabase Dashboard prima di avviare la codifica del T6 del PLAN 014.

-- ============================================================
-- FUNZIONE 1: add_tag_to_transaction
-- Aggiunge un singolo tag a una transazione.
-- Idempotente: se il tag è già presente, non genera errori e non duplica.
-- ============================================================

CREATE OR REPLACE FUNCTION add_tag_to_transaction(
  p_transaction_id UUID,
  p_tag_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rows_affected INTEGER := 0;
BEGIN
  -- Verifica che l'utente sia autenticato
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Accesso non autorizzato';
  END IF;

  -- Verifica che la transazione appartenga all'utente autenticato
  IF NOT EXISTS (
    SELECT 1 FROM transazioni
    WHERE id = p_transaction_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Transazione non trovata o accesso negato';
  END IF;

  -- Verifica che il tag appartenga all'utente autenticato
  IF NOT EXISTS (
    SELECT 1 FROM tag
    WHERE id = p_tag_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Tag non trovato o accesso negato';
  END IF;

  -- Inserisce il collegamento. Se già esiste, ignora silenziosamente.
  INSERT INTO transazioni_tag (transazione_id, tag_id)
  VALUES (p_transaction_id, p_tag_id)
  ON CONFLICT (transazione_id, tag_id) DO NOTHING;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  -- Il contatore usato_n_volte viene riallineato dal trigger su transazioni_tag.

END;
$$;

-- Permette agli utenti autenticati di chiamare questa funzione
GRANT EXECUTE ON FUNCTION add_tag_to_transaction(UUID, UUID) TO authenticated;


-- ============================================================
-- FUNZIONE 2: set_transaction_tags
-- Sostituisce tutti i tag di una transazione in una sola operazione.
-- Prima cancella i collegamenti esistenti, poi inserisce quelli nuovi.
-- Idempotente: può essere rieseguita con lo stesso set di tag senza problemi.
-- ============================================================

CREATE OR REPLACE FUNCTION set_transaction_tags(
  p_transaction_id UUID,
  p_tag_ids UUID[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_tag_ids UUID[] := ARRAY[]::UUID[];
  v_next_tag_ids UUID[] := COALESCE(p_tag_ids, ARRAY[]::UUID[]);
  v_tag_id UUID;
BEGIN
  -- Verifica che l'utente sia autenticato
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Accesso non autorizzato';
  END IF;

  -- Verifica che la transazione appartenga all'utente autenticato
  IF NOT EXISTS (
    SELECT 1 FROM transazioni
    WHERE id = p_transaction_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Transazione non trovata o accesso negato';
  END IF;

  -- Verifica che tutti i tag nel nuovo set appartengano all'utente autenticato
  IF EXISTS (
    SELECT 1 FROM unnest(v_next_tag_ids) AS t(id)
    WHERE NOT EXISTS (
      SELECT 1 FROM tag
      WHERE tag.id = t.id
        AND tag.user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Uno o più tag non appartengono all utente autenticato';
  END IF;

  SELECT COALESCE(array_agg(tag_id), ARRAY[]::UUID[])
  INTO v_current_tag_ids
  FROM transazioni_tag
  WHERE transazione_id = p_transaction_id;

  -- Cancella tutti i collegamenti tag attuali della transazione
  DELETE FROM transazioni_tag
  WHERE transazione_id = p_transaction_id;

  -- Inserisce i nuovi collegamenti
  FOREACH v_tag_id IN ARRAY v_next_tag_ids
  LOOP
    INSERT INTO transazioni_tag (transazione_id, tag_id)
    VALUES (p_transaction_id, v_tag_id)
    ON CONFLICT (transazione_id, tag_id) DO NOTHING;
  END LOOP;

  -- Il contatore usato_n_volte viene riallineato dal trigger su transazioni_tag.

END;
$$;

-- Permette agli utenti autenticati di chiamare questa funzione
GRANT EXECUTE ON FUNCTION set_transaction_tags(UUID, UUID[]) TO authenticated;


-- ============================================================
-- FUNZIONE 3: remove_tag_from_transaction
-- Rimuove un singolo tag da una transazione.
-- Idempotente: se il tag non è presente, non genera errori.
-- ============================================================

CREATE OR REPLACE FUNCTION remove_tag_from_transaction(
  p_transaction_id UUID,
  p_tag_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rows_affected INTEGER := 0;
BEGIN
  -- Verifica che l'utente sia autenticato
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Accesso non autorizzato';
  END IF;

  -- Verifica che la transazione appartenga all'utente autenticato
  IF NOT EXISTS (
    SELECT 1 FROM transazioni
    WHERE id = p_transaction_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Transazione non trovata o accesso negato';
  END IF;

  -- Rimuove il collegamento. Se non esiste, non fa nulla.
  DELETE FROM transazioni_tag
  WHERE transazione_id = p_transaction_id
    AND tag_id = p_tag_id;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  -- Il contatore usato_n_volte viene riallineato dal trigger su transazioni_tag.

END;
$$;

-- Permette agli utenti autenticati di chiamare questa funzione
GRANT EXECUTE ON FUNCTION remove_tag_from_transaction(UUID, UUID) TO authenticated;


-- ============================================================
-- TRIGGER: sync_tag_usage_count
-- Mantiene usato_n_volte coerente con il numero reale di righe in transazioni_tag.
-- Copre anche le delete a cascata quando viene rimossa una transazione o un conto.
-- ============================================================

CREATE OR REPLACE FUNCTION sync_tag_usage_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tag
    SET usato_n_volte = usato_n_volte + 1
    WHERE id = NEW.tag_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE tag
    SET usato_n_volte = GREATEST(0, usato_n_volte - 1)
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_tag_usage_count ON transazioni_tag;

CREATE TRIGGER trg_sync_tag_usage_count
AFTER INSERT OR DELETE ON transazioni_tag
FOR EACH ROW
EXECUTE FUNCTION sync_tag_usage_count();