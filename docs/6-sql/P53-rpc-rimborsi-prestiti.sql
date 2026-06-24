-- =============================================================
-- MIGRAZIONE P53 — RPC Atomiche Rimborsi Prestiti
-- Progetto:  ZecchinoReact
-- DESIGN:    017-DESIGN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
-- PLAN:      017-PLAN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
-- Data:      2026-06-24
-- =============================================================
-- Perimetro:
--   - rpc_aggiungi_rimborso: inserisce rimborso, scala saldo residuo,
--     chiude automaticamente il prestito se il saldo raggiunge zero.
--   - rpc_elimina_rimborso: elimina rimborso, ripristina saldo residuo,
--     riapre il prestito se era stato chiuso automaticamente.
--
-- Ordine obbligatorio di esecuzione nel database:
--   1. P52-prestiti-mutui.sql      (tabella prestiti_mutui)
--   2. P54-prestiti-rimborsi.sql   (tabella prestiti_rimborsi)
--   3. P53-rpc-rimborsi-prestiti.sql  (questo file — dipende da entrambe)
--
-- Non incluso in questo file:
--   - Tabella prestiti_mutui    (vedi P52)
--   - Tabella prestiti_rimborsi (vedi P54)
-- =============================================================


-- -------------------------------------------------------------
-- 1. RPC: rpc_aggiungi_rimborso
-- -------------------------------------------------------------
-- Aggiunge un rimborso e aggiorna il saldo residuo in modo atomico.
--
-- Flusso:
--   1. Verifica che l'utente sia autenticato.
--   2. Verifica che il prestito esista e appartenga all'utente autenticato.
--   3. Verifica che il prestito sia in stato 'attivo'.
--   4. Verifica che l'importo sia positivo e non superi il saldo residuo.
--   5. Verifica coerenza facoltativa delle quote.
--   6. Verifica che la data rimborso sia valorizzata.
--   7. Inserisce la riga in prestiti_rimborsi.
--   8. Scala il saldo residuo di prestiti_mutui.
--   9. Se il nuovo saldo è zero, imposta stato = 'chiuso'.
--  10. Restituisce il saldo residuo aggiornato.
--
-- Parametri:
--   p_prestito_id     UUID          — id del prestito da rimborsare
--   p_importo         NUMERIC(14,2) — importo del rimborso (> 0)
--   p_data_rimborso   DATE          — data del rimborso (obbligatoria)
--   p_quota_capitale  NUMERIC(14,2) — quota capitale (facoltativa)
--   p_quota_interessi NUMERIC(14,2) — quota interessi (facoltativa)
--   p_note            TEXT          — note libere (facoltative)
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION rpc_aggiungi_rimborso(
    p_prestito_id      UUID,
    p_importo          NUMERIC(14,2),
    p_data_rimborso    DATE,
    p_quota_capitale   NUMERIC(14,2) DEFAULT NULL,
    p_quota_interessi  NUMERIC(14,2) DEFAULT NULL,
    p_note             TEXT          DEFAULT NULL
)
RETURNS NUMERIC(14,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id       UUID;
    v_stato         loan_status;
    v_saldo_attuale NUMERIC(14,2);
    v_nuovo_saldo   NUMERIC(14,2);
BEGIN
    -- Verifica che l'utente sia autenticato
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Accesso non autorizzato: utente non autenticato'
            USING ERRCODE = 'P0000';
    END IF;

    -- Verifica che la data sia valorizzata
    IF p_data_rimborso IS NULL THEN
        RAISE EXCEPTION 'La data del rimborso è obbligatoria'
            USING ERRCODE = 'P0008';
    END IF;

    -- Recupera il prestito e blocca la riga (FOR UPDATE previene race condition)
    SELECT user_id, stato, saldo_residuo
    INTO v_user_id, v_stato, v_saldo_attuale
    FROM prestiti_mutui
    WHERE id = p_prestito_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prestito non trovato'
            USING ERRCODE = 'P0001';
    END IF;

    -- Verifica titolarità
    IF v_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Accesso non autorizzato al prestito'
            USING ERRCODE = 'P0002';
    END IF;

    -- Verifica stato attivo
    IF v_stato <> 'attivo' THEN
        RAISE EXCEPTION 'Il rimborso può essere registrato solo su un prestito in stato attivo. Stato attuale: %', v_stato
            USING ERRCODE = 'P0003';
    END IF;

    -- Verifica importo positivo
    IF p_importo <= 0 THEN
        RAISE EXCEPTION 'L importo del rimborso deve essere maggiore di zero'
            USING ERRCODE = 'P0004';
    END IF;

    -- Verifica che il rimborso non superi il saldo residuo
    IF p_importo > v_saldo_attuale THEN
        RAISE EXCEPTION 'L importo del rimborso (%) supera il saldo residuo disponibile (%)',
            p_importo, v_saldo_attuale
            USING ERRCODE = 'P0005';
    END IF;

    -- Verifica quote non negative
    IF p_quota_capitale IS NOT NULL AND p_quota_capitale < 0 THEN
        RAISE EXCEPTION 'La quota capitale non può essere negativa'
            USING ERRCODE = 'P0006';
    END IF;

    IF p_quota_interessi IS NOT NULL AND p_quota_interessi < 0 THEN
        RAISE EXCEPTION 'La quota interessi non può essere negativa'
            USING ERRCODE = 'P0007';
    END IF;

    -- Verifica coerenza: somma quote non supera importo
    IF p_quota_capitale IS NOT NULL
       AND p_quota_interessi IS NOT NULL
       AND (p_quota_capitale + p_quota_interessi) > p_importo
    THEN
        RAISE EXCEPTION 'La somma di quota capitale (%) e quota interessi (%) non può superare l importo del rimborso (%)',
            p_quota_capitale, p_quota_interessi, p_importo
            USING ERRCODE = 'P0009';
    END IF;

    -- Calcola il nuovo saldo
    v_nuovo_saldo := v_saldo_attuale - p_importo;

    -- Inserisce il rimborso nello storico
    INSERT INTO prestiti_rimborsi (
        prestito_id,
        user_id,
        importo,
        data_rimborso,
        quota_capitale,
        quota_interessi,
        note
    ) VALUES (
        p_prestito_id,
        auth.uid(),
        p_importo,
        p_data_rimborso,
        p_quota_capitale,
        p_quota_interessi,
        p_note
    );

    -- Aggiorna saldo residuo e, se necessario, chiude il prestito
    UPDATE prestiti_mutui
    SET
        saldo_residuo = v_nuovo_saldo,
        stato         = CASE
                            WHEN v_nuovo_saldo = 0 THEN 'chiuso'::loan_status
                            ELSE stato
                        END,
        updated_at    = now()
    WHERE id = p_prestito_id
      AND user_id = auth.uid();

    RETURN v_nuovo_saldo;
END;
$$;

COMMENT ON FUNCTION rpc_aggiungi_rimborso IS
    'Inserisce un rimborso e aggiorna il saldo residuo in modo atomico. Chiude automaticamente il prestito se il saldo raggiunge zero. Unica via autorizzata per scalare saldo_residuo su prestiti_mutui.';

GRANT EXECUTE ON FUNCTION rpc_aggiungi_rimborso(
    UUID,
    NUMERIC,
    DATE,
    NUMERIC,
    NUMERIC,
    TEXT
) TO authenticated;


-- -------------------------------------------------------------
-- 2. RPC: rpc_elimina_rimborso
-- -------------------------------------------------------------
-- Elimina un rimborso e ripristina il saldo residuo in modo atomico.
--
-- Flusso:
--   1. Verifica che l'utente sia autenticato.
--   2. Recupera il rimborso e verifica titolarità.
--   3. Recupera il prestito collegato e blocca la riga.
--   4. Verifica titolarità del prestito.
--   5. Calcola il saldo ripristinato.
--   6. Elimina la riga da prestiti_rimborsi.
--   7. Aggiorna il saldo residuo di prestiti_mutui.
--   8. Se il prestito era 'chiuso' e il saldo torna sopra zero, lo riporta ad 'attivo'.
--   9. Restituisce il saldo residuo aggiornato.
--
-- Parametri:
--   p_rimborso_id  UUID — id del rimborso da eliminare
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION rpc_elimina_rimborso(
    p_rimborso_id UUID
)
RETURNS NUMERIC(14,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prestito_id   UUID;
    v_importo       NUMERIC(14,2);
    v_rimborso_uid  UUID;
    v_prestito_uid  UUID;
    v_stato         loan_status;
    v_saldo_attuale NUMERIC(14,2);
    v_nuovo_saldo   NUMERIC(14,2);
BEGIN
    -- Verifica che l'utente sia autenticato
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Accesso non autorizzato: utente non autenticato'
            USING ERRCODE = 'P0000';
    END IF;

    -- Recupera il rimborso
    SELECT prestito_id, importo, user_id
    INTO v_prestito_id, v_importo, v_rimborso_uid
    FROM prestiti_rimborsi
    WHERE id = p_rimborso_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rimborso non trovato'
            USING ERRCODE = 'P0010';
    END IF;

    -- Verifica titolarità del rimborso
    IF v_rimborso_uid <> auth.uid() THEN
        RAISE EXCEPTION 'Accesso non autorizzato al rimborso'
            USING ERRCODE = 'P0011';
    END IF;

    -- Recupera il prestito e blocca la riga (FOR UPDATE previene race condition)
    SELECT user_id, stato, saldo_residuo
    INTO v_prestito_uid, v_stato, v_saldo_attuale
    FROM prestiti_mutui
    WHERE id = v_prestito_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prestito collegato non trovato'
            USING ERRCODE = 'P0012';
    END IF;

    -- Verifica titolarità del prestito
    IF v_prestito_uid <> auth.uid() THEN
        RAISE EXCEPTION 'Accesso non autorizzato al prestito collegato'
            USING ERRCODE = 'P0013';
    END IF;

    -- Calcola il saldo ripristinato
    v_nuovo_saldo := v_saldo_attuale + v_importo;

    -- Elimina il rimborso
    DELETE FROM prestiti_rimborsi
    WHERE id = p_rimborso_id
      AND user_id = auth.uid();

    -- Aggiorna saldo residuo e, se necessario, riapre il prestito
    UPDATE prestiti_mutui
    SET
        saldo_residuo = v_nuovo_saldo,
        stato         = CASE
                            WHEN v_stato = 'chiuso' AND v_nuovo_saldo > 0
                            THEN 'attivo'::loan_status
                            ELSE stato
                        END,
        updated_at    = now()
    WHERE id = v_prestito_id
      AND user_id = auth.uid();

    RETURN v_nuovo_saldo;
END;
$$;

COMMENT ON FUNCTION rpc_elimina_rimborso IS
    'Elimina un rimborso e ripristina il saldo residuo in modo atomico. Se il prestito era stato chiuso automaticamente, lo riporta in stato attivo. Unica via autorizzata per aumentare saldo_residuo su prestiti_mutui.';

GRANT EXECUTE ON FUNCTION rpc_elimina_rimborso(UUID) TO authenticated;