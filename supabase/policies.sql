-- LiveChat — Row Level Security (Supabase)
--
-- Architecture actuelle :
--   • packages/web n'accède PAS à Supabase (auth JWT + REST API server)
--   • packages/server utilise SUPABASE_SERVICE_ROLE_KEY (bypass RLS via PostgREST)
--
-- Sans policy permissive, les rôles anon / authenticated n'ont aucun accès.
-- Exécuter après schema.sql (nouvelle base ou migration existante).

ALTER TABLE overlay_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_settings ENABLE ROW LEVEL SECURITY;

-- Aucune policy CREATE = deny-all pour anon et authenticated.
-- Ne pas ajouter de policy "USING (true)" sans auth solide côté JWT Supabase.
