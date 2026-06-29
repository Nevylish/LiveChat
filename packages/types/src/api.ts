import type { GuildSettingsRow, OverlayConfigRow } from './database.js';
import type { DiscordRole } from './discord.js';
import type { OverlayVersion } from './socket.js';

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

/** Developer dashboard — access check. */
export interface DevMeResponse {
    isDevAdmin: boolean;
}

export interface DevConnectedStreamer {
    username: string;
    guildId: string;
    socketId: string;
    overlayVersion: OverlayVersion;
}

export interface DevPaginationMeta {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface DevPaginationParams {
    page?: number;
    pageSize?: number;
}

export interface DevOverviewResponse {
    uptimeSeconds: number;
    nodeEnv: string;
    discord: {
        guildCount: number;
        wsPing: number;
        ready: boolean;
    };
    streamers: {
        connected: number;
    };
    database: {
        overlayCount: number;
        guildSettingsCount: number;
    };
    cache: {
        size: number;
        hits: number;
        misses: number;
        evictions: number;
    };
    premium: {
        plusGuildCount: number;
    };
}

export interface DevStreamersResponse {
    streamers: DevConnectedStreamer[];
    pagination: DevPaginationMeta;
}

export interface DevGuildRow {
    id: string;
    name: string;
    memberCount: number;
    overlayCount: number;
    connectedCount: number;
    hasPlus: boolean;
}

export interface DevGuildsResponse {
    guilds: DevGuildRow[];
    pagination: DevPaginationMeta;
}

export interface DevSearchOverlaysResponse {
    overlays: OverlayConfigRow[];
    pagination: DevPaginationMeta;
}

export interface DevMediaResolveResponse {
    url?: string | null;
    bypassProxy?: boolean;
    error?: string;
}

export interface DevCacheStatsResponse {
    size: number;
    hits: number;
    misses: number;
    negativeHits: number;
    dedupedRequests: number;
    evictions: number;
    expirations: number;
}

export interface DevCacheClearResponse {
    success: true;
}

export type DevLogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error';

export interface DevLogEntry {
    id: number;
    level: DevLogLevel;
    source: string;
    message: string;
    context?: Record<string, unknown>;
    timestamp: string;
}

export interface DevLogsResponse {
    logs: DevLogEntry[];
}

export interface DevLogsClearResponse {
    success: true;
}
