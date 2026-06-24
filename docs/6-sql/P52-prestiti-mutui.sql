-- =============================================================
-- MIGRAZIONE P52 — Dominio Prestiti e Mutui
-- Progetto:  ZecchinoReact
-- DESIGN:    017-DESIGN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
-- PLAN:      017-PLAN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
-- Data:      2026-06-24
-- =============================================================
-- Perimetro:
--   - Tipo enum loan_type   (mutuo_finanziamento, prestito_personale)
--   - Tipo enum loan_status (simulazione, attivo, chiuso)
--   - Tipo enum loan_direction (devo, mi_devono)
--   - Tabella prestiti_mutui con tutti i campi del dominio
--   - Vincoli di integrità sul tipo, stato, direzione e saldo residuo
--   - Indici per performance query per utente e per stato
--   - Policy RLS per isolamento utente
--   - Trigger aggiornamento automatico updated_at
--
-- Non incluso in questo file:
--   - RPC per rimborsi (vedi P53)
--   - Tabella rimborsi (vedi P54)
-- =============================================================


-- -------------------------------------------------------------
-- 1. Tipi enumerati
-- -------------------------------------------------------------

CREATE TYPE loan_type AS ENUM (
    'mutuo_finanziamento',
    'prestito_personale'
);

CREATE TYPE loan_status AS ENUM (
    'simulazione',
    'attivo',
    'chiuso'
);

CREATE TYPE loan_direction AS ENUM (
    'devo',
    'mi_devono'
);


-- -------------------------------------------------------------
-- 2. Tabella principale prestiti_mutui
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS prestiti_mutui (
    id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Campi classificatori
    tipo                  loan_type       NOT NULL,
    stato                 loan_status     NOT NULL DEFAULT 'simulazione',
    direzione             loan_direction  NOT NULL,

    -- Dati identificativi
    controparte_nome      TEXT,
    -- Nota: controparte_nome è nullable per consentire simulazioni senza controparte ancora definita.
    -- La validazione applicativa nel repository la rende obbligatoria per contratti in stato attivo.

    -- Dati contrattuali
    importo_iniziale      NUMERIC(14,2)   NOT NULL CHECK (importo_iniziale > 0),
    valuta                TEXT            NOT NULL DEFAULT 'EUR' CHECK (char_length(valuta) = 3),

    -- Campi facoltativi (obbligatori nella validazione applicativa per mutuo_finanziamento)
    tasso_annuo           NUMERIC(8,4)    CHECK (tasso_annuo IS NULL OR tasso_annuo >= 0),
    durata_mesi           INTEGER         CHECK (durata_mesi IS NULL OR durata_mesi >= 1),

    -- Date
    data_inizio           DATE            NOT NULL,
    data_fine_prevista    DATE,
    -- Nota: data_fine_prevista è nullable nel DB, ma il repository
    -- la calcola e la persiste obbligatoriamente per tutti i contratti in stato attivo.

    -- Campi derivati calcolati dal repository
    rata_mensile          NUMERIC(14,2)   CHECK (rata_mensile IS NULL OR rata_mensile >= 0),
    totale_interessi      NUMERIC(14,2)   CHECK (totale_interessi IS NULL OR totale_interessi >= 0),

    -- Saldo residuo: aggiornabile SOLO tramite RPC atomiche in P53
    saldo_residuo         NUMERIC(14,2)   NOT NULL CHECK (saldo_residuo >= 0),

    -- Note libere
    note                  TEXT            CHECK (char_length(note) <= 2000),

    -- Metadati
    created_at            TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ     NOT NULL DEFAULT now(),


    -- -------------------------------------------------------
    -- Vincoli di integrità compositi
    -- -------------------------------------------------------

    -- Per i mutui di finanziamento, tasso e durata sono obbligatori
    CONSTRAINT chk_mutuo_tasso_durata
        CHECK (
            tipo <> 'mutuo_finanziamento'
            OR (tasso_annuo IS NOT NULL AND durata_mesi IS NOT NULL)
        ),

    -- Un contratto in stato attivo deve avere data_fine_prevista valorizzata
    CONSTRAINT chk_data_fine_attivo
        CHECK (
            stato <> 'attivo'
            OR data_fine_prevista IS NOT NULL
        )
);

COMMENT ON TABLE  prestiti_mutui
    IS 'Dominio prestiti, mutui e simulazioni finanziarie. saldo_residuo viene aggiornato esclusivamente tramite rpc_aggiungi_rimborso e rpc_elimina_rimborso (P53). Nessun update diretto client-side ammesso.';

COMMENT ON COLUMN prestiti_mutui.saldo_residuo
    IS 'Aggiornato SOLO da rpc_aggiungi_rimborso e rpc_elimina_rimborso definite in P53. Non modificare direttamente.';

COMMENT ON COLUMN prestiti_mutui.tasso_annuo
    IS 'Facoltativo per prestiti personali. Obbligatorio nella validazione applicativa per mutuo_finanziamento.';

COMMENT ON COLUMN prestiti_mutui.durata_mesi
    IS 'Facoltativo per prestiti personali. Obbligatorio nella validazione applicativa per mutuo_finanziamento.';

COMMENT ON COLUMN prestiti_mutui.data_fine_prevista
    IS 'Ricalcolata obbligatoriamente dal repository ad ogni variazione di data_inizio o durata_mesi. Obbligatoria per contratti in stato attivo.';

COMMENT ON COLUMN prestiti_mutui.direzione
    IS 'devo = io devo denaro alla controparte; mi_devono = la controparte deve denaro a me.';

COMMENT ON COLUMN prestiti_mutui.valuta
    IS 'Codice ISO 4217 a tre caratteri. Default EUR. Il dominio prestiti e indipendente dal dominio conti.';


-- -------------------------------------------------------------
-- 3. Trigger per aggiornamento automatico di updated_at
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_prestiti_mutui_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prestiti_mutui_updated_at
    BEFORE UPDATE ON prestiti_mutui
    FOR EACH ROW
    EXECUTE FUNCTION update_prestiti_mutui_updated_at();


-- -------------------------------------------------------------
-- 4. Indici
-- -------------------------------------------------------------

-- Ricerca per utente (query principale: getAll)
CREATE INDEX idx_prestiti_mutui_user_id
    ON prestiti_mutui (user_id);

-- Filtro per stato (getAttivi usa stato = 'attivo')
CREATE INDEX idx_prestiti_mutui_user_stato
    ON prestiti_mutui (user_id, stato);

-- Ordinamento cronologico per data_inizio
CREATE INDEX idx_prestiti_mutui_data_inizio
    ON prestiti_mutui (user_id, data_inizio DESC);


-- -------------------------------------------------------------
-- 5. Row Level Security (RLS)
-- -------------------------------------------------------------

ALTER TABLE prestiti_mutui ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_prestiti_mutui_select
    ON prestiti_mutui FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY policy_prestiti_mutui_insert
    ON prestiti_mutui FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY policy_prestiti_mutui_update
    ON prestiti_mutui FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY policy_prestiti_mutui_delete
    ON prestiti_mutui FOR DELETE
    USING (auth.uid() = user_id);