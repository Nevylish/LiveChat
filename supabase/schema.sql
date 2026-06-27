-- LiveChat — schéma Postgres (Supabase)
-- Types TypeScript : packages/types/src/database.ts
--
-- Usage :
--   Nouvelle base     → schema.sql puis policies.sql
--   Base existante    → migrate-existing.sql puis policies.sql (si pas déjà fait)
--
-- Les CREATE / CREATE INDEX IF NOT EXISTS et blocs DO sont idempotents.

-- ---------------------------------------------------------------------------
-- Utilitaire : updated_at automatique à chaque UPDATE
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

-- ---------------------------------------------------------------------------
-- overlay_configs — un overlay par (guild_id, username)
-- Pas de FK vers guild_settings : une guild peut avoir des overlays sans
-- ligne de réglages (settings créés à la 1re config admin).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS overlay_configs (
    guild_id   text        NOT NULL,
    username   text        NOT NULL,
    token      text        NOT NULL,
    user_id    text        NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (guild_id, username),
    CONSTRAINT overlay_configs_username_lowercase CHECK (username = lower(username))
);

CREATE UNIQUE INDEX IF NOT EXISTS overlay_configs_token_key ON overlay_configs (token);

CREATE INDEX IF NOT EXISTS overlay_configs_guild_user_idx
    ON overlay_configs (guild_id, user_id);

DROP TRIGGER IF EXISTS overlay_configs_set_updated_at ON overlay_configs;
CREATE TRIGGER overlay_configs_set_updated_at
    BEFORE UPDATE ON overlay_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- guild_settings — réglages par serveur Discord (1 ligne par guild)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id              text        NOT NULL,
    required_role_id      text,
    max_overlays_per_user integer     NOT NULL DEFAULT 5,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (guild_id),
    CONSTRAINT guild_settings_max_overlays_positive CHECK (max_overlays_per_user > 0)
);

DROP TRIGGER IF EXISTS guild_settings_set_updated_at ON guild_settings;
CREATE TRIGGER guild_settings_set_updated_at
    BEFORE UPDATE ON guild_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Contraintes / colonnes sur base déjà provisionnée
-- Prérequis : usernames normalisés — voir migrate-existing.sql
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

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'guild_settings_max_overlays_positive'
    ) THEN
        ALTER TABLE guild_settings
            ADD CONSTRAINT guild_settings_max_overlays_positive
            CHECK (max_overlays_per_user > 0);
    END IF;
END $$;

ALTER TABLE overlay_configs
    ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE guild_settings
    ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
