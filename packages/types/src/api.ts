import type { DiscordRole } from './discord.js';
import type { GuildSettingsRow, OverlayConfigRow } from './database.js';

/** Overlay config enriched with Discord member info (admin list). */
export interface OverlayConfigAdminRow extends OverlayConfigRow {
    discord_username?: string | null;
    discord_display_name?: string | null;
}

export interface ApiSuccessResponse {
    success: true;
}

export interface ApiErrorResponse {
    error: string;
}

export interface GetOverlayConfigsResponse {
    configs: OverlayConfigRow[];
    exists: boolean;
    maxOverlays?: number;
    hasPlusSubscription?: boolean;
}

export interface GetAllOverlayConfigsResponse {
    configs: OverlayConfigAdminRow[];
}

export interface CreateOverlayConfigResponse {
    success: true;
    token: string;
}

export interface SaveOverlayConfigResponse {
    success: true;
}

export interface RegenerateOverlayTokenResponse {
    token: string;
}

export interface GetGuildRolesResponse {
    roles: DiscordRole[];
}

export interface GetGuildSettingsResponse {
    settings: GuildSettingsRow;
}

export interface SaveGuildSettingsResponse {
    success: true;
}
