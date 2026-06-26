/** Row shape for the `overlay_configs` Supabase table. */
export interface OverlayConfigRow {
    guild_id: string;
    username: string;
    token: string;
    user_id: string;
    updated_at?: string;
}

/** Row shape for the `guild_settings` Supabase table. */
export interface GuildSettingsRow {
    guild_id: string;
    required_role_id: string | null;
    max_overlays_per_user?: number | null;
    updated_at?: string;
}
