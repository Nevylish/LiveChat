import type { DiscordRole } from './discord.js';
import type { GuildSettingsRow, OverlayConfigRow } from './database.js';

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
}

export interface GetAllOverlayConfigsResponse {
    configs: OverlayConfigRow[];
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
