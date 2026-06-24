-- =============================================================
-- MIGRAZIONE P54 — Tabella Storico Rimborsi Prestiti
-- Progetto:  ZecchinoReact
-- DESIGN:    017-DESIGN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
-- PLAN:      017-PLAN_prestiti-mutui-simulazione-finanziaria_v0.1.0.md
-- Data:      2026-06-24
-- Revisione: 2026-06-24 — correzioni post analisi Consiglio AI
--            - Rimosso INSERT e DELETE diretti dalla RLS
--              (mutazioni solo via RPC atomiche P53)
--            - Vincolo quote riscritto con COALESCE
--              (copre anche il caso con una sola quota valorizzata)
-- =============================================================
-- Perimetro:
--   - Tabella prestiti_rimborsi con tutti i campi del dominio
--   - Vincoli di integrità su importo e quote
--   - Indici per performance query per prestito e per data
--   - Policy RLS solo SELECT — scrittura esclusivamente via P53
--
-- Ordine obbligatorio di esecuzione nel database:
--   1. P52-prestiti-mutui.sql         (tabella prestiti_mutui)
--   2. P54-prestiti-rimborsi.sql      (questo file)
--   3. P53-rpc-rimborsi-prestiti.sql  (RPC atomiche — dipende da entrambe)
--
-- Nota architetturale:
--   Questa tabella non prevede il campo updated_at né un trigger
--   di aggiornamento. I rimborsi sono record immutabili per natura:
--   una volta registrato, un rimborso non viene mai modificato,
--   solo eliminato tramite rpc_elimina_rimborso (P53).
--   Il campo created_at è sufficiente per il ciclo di vita del record.
--
--   Le RPC di P53 sono dichiarate SECURITY DEFINER e possono
--   scrivere in questa tabella senza policy INSERT/DELETE esplicite.
--   Non aggiungere policy di scrittura diretta: farlo permetterebbe
--   di inserire rimborsi senza aggiornare saldo_residuo e stato
--   in prestiti_mutui, rompendo la coerenza del dominio.
-- =============================================================


-- -------------------------------------------------------------
-- 1. Tabella prestiti_rimborsi
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS prestiti_rimborsi (
    id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    prestito_id       UUID            NOT NULL
                                      REFERENCES prestiti_mutui(id)
                                      ON DELETE CASCADE,
    user_id           UUID            NOT NULL
                                      REFERENCES auth.users(id)
                                      ON DELETE CASCADE,

    -- Dati del rimborso
    importo           NUMERIC(14,2)   NOT NULL CHECK (importo > 0),
    data_rimborso     DATE            NOT NULL,

    -- Quote facoltative (non obbligatorie per prestiti personali liberi).
    -- Se valorizzate anche solo parzialmente, la loro somma
    -- non può superare l'importo totale del rimborso.
    quota_capitale    NUMERIC(14,2)   CHECK (quota_capitale IS NULL OR quota_capitale >= 0),
    quota_interessi   NUMERIC(14,2)   CHECK (quota_interessi IS NULL OR quota_interessi >= 0),

    -- Vincolo di coerenza quote.
    -- COALESCE tratta il valore mancante come zero,
    -- così il controllo funziona anche quando una sola quota è valorizzata.
    -- Esempio: importo 100, quota_capitale 120, quota_interessi NULL → rifiutato.
    -- Esempio: importo 100, quota_capitale 80, quota_interessi NULL → accettato.
    CONSTRAINT chk_rimborso_quote_coerenti
        CHECK (
            (COALESCE(quota_capitale, 0) + COALESCE(quota_interessi, 0)) <= importo
        ),

    -- Note libere
    note              TEXT            CHECK (char_length(note) <= 2000),

    -- Metadati (solo created_at — i rimborsi sono immutabili per definizione)
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT now()
);

COMMENT ON TABLE prestiti_rimborsi
    IS 'Storico dei rimborsi effettuati sui prestiti. Record immutabili: nessun INSERT o DELETE diretto ammesso. Le mutazioni passano esclusivamente per rpc_aggiungi_rimborso e rpc_elimina_rimborso definite in P53, che aggiornano in modo atomico anche saldo_residuo e stato in prestiti_mutui.';

COMMENT ON COLUMN prestiti_rimborsi.quota_capitale
    IS 'Facoltativa. Se valorizzata, la somma con quota_interessi (trattata come 0 se assente) non può superare importo.';

COMMENT ON COLUMN prestiti_rimborsi.quota_interessi
    IS 'Facoltativa. Se valorizzata, la somma con quota_capitale (trattata come 0 se assente) non può superare importo.';

COMMENT ON COLUMN prestiti_rimborsi.created_at
    IS 'Data di registrazione del rimborso nel sistema. Non è presente updated_at perché i rimborsi sono immutabili.';


-- -------------------------------------------------------------
-- 2. Indici
-- -------------------------------------------------------------

-- Ricerca per prestito (usato dal repository rimborsi — getByPrestitoId)
CREATE INDEX idx_prestiti_rimborsi_prestito_id
    ON prestiti_rimborsi (prestito_id);

-- Ordinamento cronologico decrescente per data rimborso
CREATE INDEX idx_prestiti_rimborsi_data_rimborso
    ON prestiti_rimborsi (prestito_id, data_rimborso DESC);

-- Ricerca per utente (usato dalla policy SELECT e da query dirette del repository)
CREATE INDEX idx_prestiti_rimborsi_user_id
    ON prestiti_rimborsi (user_id);


-- -------------------------------------------------------------
-- 3. Row Level Security (RLS)
-- -------------------------------------------------------------

ALTER TABLE prestiti_rimborsi ENABLE ROW LEVEL SECURITY;

-- Solo lettura diretta: ogni utente vede solo i propri rimborsi.
CREATE POLICY policy_prestiti_rimborsi_select
    ON prestiti_rimborsi FOR SELECT
    USING (auth.uid() = user_id);

-- Nessuna policy INSERT:
-- l'inserimento avviene esclusivamente tramite rpc_aggiungi_rimborso (P53).
-- La funzione è SECURITY DEFINER e scrive con i propri privilegi.
-- Aggiungere una policy INSERT diretta permetterebbe di registrare
-- rimborsi senza aggiornare saldo_residuo e stato del prestito.

-- Nessuna policy UPDATE:
-- i rimborsi sono record immutabili per definizione di dominio.

-- Nessuna policy DELETE:
-- l'eliminazione avviene esclusivamente tramite rpc_elimina_rimborso (P53).
-- La funzione è SECURITY DEFINER e ripristina saldo_residuo e stato
-- in modo atomico prima di cancellare la riga.