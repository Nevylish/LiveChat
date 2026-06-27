-- LiveChat — migration base Supabase existante
-- Exécuter dans le SQL Editor Supabase, étape par étape.
-- Terminer par : \i policies.sql (ou coller policies.sql)

-- ---------------------------------------------------------------------------
-- ÉTAPE 1 — Doublons case-insensitive (résoudre manuellement si résultat)
-- ---------------------------------------------------------------------------

SELECT
    guild_id,
    lower(username) AS username_normalized,
    count(*)        AS row_count,
    array_agg(username ORDER BY updated_at DESC) AS usernames,
    array_agg(token ORDER BY updated_at DESC)    AS tokens
FROM overlay_configs
GROUP BY guild_id, lower(username)
HAVING count(*) > 1;

-- ---------------------------------------------------------------------------
-- ÉTAPE 2 — Normaliser les usernames en lowercase
-- ---------------------------------------------------------------------------

UPDATE overlay_configs
SET
    username   = lower(username),
    updated_at = now()
WHERE username <> lower(username);

-- ---------------------------------------------------------------------------
-- ÉTAPE 3 — user_id NULL (legacy)
-- ---------------------------------------------------------------------------

SELECT guild_id, username, token
FROM overlay_configs
WHERE user_id IS NULL;

-- Si des lignes : DELETE FROM overlay_configs WHERE user_id IS NULL;
-- Puis : ALTER TABLE overlay_configs ALTER COLUMN user_id SET NOT NULL;

-- ---------------------------------------------------------------------------
-- ÉTAPE 4 — Index (guild_id, user_id)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS overlay_configs_guild_user_idx
    ON overlay_configs (guild_id, user_id);

-- ---------------------------------------------------------------------------
-- ÉTAPE 5 — Contrainte lowercase
-- ---------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'overlay_configs_username_lowercase'
    ) THEN
        ALTER TABLE overlay_configs
            ADD CONSTRAINT overlay_configs_username_lowercase
            CHECK (username = lower(username));
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- ÉTAPE 6 — created_at (backfill depuis updated_at pour les lignes existantes)
-- ---------------------------------------------------------------------------

ALTER TABLE overlay_configs
    ADD COLUMN IF NOT EXISTS created_at timestamptz;

UPDATE overlay_configs
SET created_at = updated_at
WHERE created_at IS NULL;

ALTER TABLE overlay_configs
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE guild_settings
    ADD COLUMN IF NOT EXISTS created_at timestamptz;

UPDATE guild_settings
SET created_at = updated_at
WHERE created_at IS NULL;

ALTER TABLE guild_settings
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN created_at SET DEFAULT now();

-- ---------------------------------------------------------------------------
-- ÉTAPE 7 — CHECK max_overlays_per_user > 0
-- ---------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'guild_settings_max_overlays_positive'
    ) THEN
        ALTER TABLE guild_settings
            ADD CONSTRAINT guild_settings_max_overlays_positive
            CHECK (max_overlays_per_user > 0);
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- ÉTAPE 8 — Trigger updated_at automatique
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS overlay_configs_set_updated_at ON overlay_configs;
CREATE TRIGGER overlay_configs_set_updated_at
    BEFORE UPDATE ON overlay_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS guild_settings_set_updated_at ON guild_settings;
CREATE TRIGGER guild_settings_set_updated_at
    BEFORE UPDATE ON guild_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ÉTAPE 9 — RLS (voir policies.sql)
-- ---------------------------------------------------------------------------

-- Coller le contenu de supabase/policies.sql ici.

-- ---------------------------------------------------------------------------
-- ÉTAPE 10 — Vérification finale
-- ---------------------------------------------------------------------------

SELECT column_name, is_nullable, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('overlay_configs', 'guild_settings')
ORDER BY table_name, ordinal_position;

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('overlay_configs', 'guild_settings');

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'overlay_configs';
