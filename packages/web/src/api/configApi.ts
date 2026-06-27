import type {
    DiscordGuild,
    DiscordRole,
    GetAllOverlayConfigsResponse,
    GetGuildRolesResponse,
    GetGuildSettingsResponse,
    GetOverlayConfigsResponse,
    GuildSettingsRow,
    OverlayConfigRow,
    RegenerateOverlayTokenResponse,
} from '@livechat/types';
import { API_BASE_URL } from '../lib/constants';

interface AuthHeaders {
    accessToken: string;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
    return response.json() as Promise<T>;
}

async function authFetch(path: string, accessToken: string, init?: RequestInit): Promise<Response> {
    return fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            ...(init?.headers ?? {}),
            Authorization: `Bearer ${accessToken}`,
        },
    });
}

export async function fetchDiscordGuilds(providerToken: string): Promise<DiscordGuild[]> {
    const response = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: {
            Authorization: `Bearer ${providerToken}`,
        },
    });

    if (response.status === 401) {
        throw new Error('DISCORD_PROVIDER_TOKEN_EXPIRED');
    }

    if (!response.ok) {
        throw new Error("Impossible de récupérer vos serveurs Discord depuis l'API Discord.");
    }

    return response.json() as Promise<DiscordGuild[]>;
}

export async function fetchGuildBotStatus(
    accessToken: string,
    guildIds: string[],
): Promise<Record<string, { hasBot: boolean; overlayCount: number; hasPlusSubscription?: boolean }>> {
    const ids = guildIds.join(',');
    const response = await authFetch(`/api/guild/check?guildId=${encodeURIComponent(ids)}`, accessToken);

    if (!response.ok) {
        return {};
    }

    const data = (await response.json()) as
        | { results: Record<string, { hasBot: boolean; overlayCount: number; hasPlusSubscription?: boolean }> }
        | { hasBot: boolean; overlayCount: number; hasPlusSubscription?: boolean };

    if ('results' in data) {
        return data.results;
    }

    return {
        [guildIds[0]]: {
            hasBot: data.hasBot,
            overlayCount: data.overlayCount,
            hasPlusSubscription: data.hasPlusSubscription,
        },
    };
}

export async function fetchUserOverlayConfigs(
    { accessToken }: AuthHeaders,
    guildId: string,
): Promise<{ ok: boolean; status: number; data: GetOverlayConfigsResponse & { maxOverlays?: number; error?: string } }> {
    const response = await authFetch(`/api/config/get?guildId=${encodeURIComponent(guildId)}`, accessToken);
    const data = (await response.json().catch(() => ({}))) as GetOverlayConfigsResponse & {
        maxOverlays?: number;
        error?: string;
    };
    return { ok: response.ok, status: response.status, data };
}

export async function fetchAllGuildOverlayConfigs(
    { accessToken }: AuthHeaders,
    guildId: string,
): Promise<GetAllOverlayConfigsResponse> {
    const response = await authFetch(`/api/config/all?guildId=${encodeURIComponent(guildId)}`, accessToken);
    return parseJsonResponse(response);
}

export async function fetchGuildSettings(
    { accessToken }: AuthHeaders,
    guildId: string,
): Promise<GetGuildSettingsResponse> {
    const response = await authFetch(`/api/guild/settings?guildId=${encodeURIComponent(guildId)}`, accessToken);
    return parseJsonResponse(response);
}

export async function fetchGuildRoles({ accessToken }: AuthHeaders, guildId: string): Promise<GetGuildRolesResponse> {
    const response = await authFetch(`/api/guild/roles?guildId=${encodeURIComponent(guildId)}`, accessToken);
    return parseJsonResponse(response);
}

async function ensureJsonResponse<T>(response: Response, fallbackError: string): Promise<T> {
    const data = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) {
        throw new Error(data.error || fallbackError);
    }
    return data;
}

export async function saveOverlayConfig(
    { accessToken }: AuthHeaders,
    payload: { username: string; guildId: string; token: string },
): Promise<{ success: boolean }> {
    const response = await authFetch('/api/config/save', accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return ensureJsonResponse(response, "Impossible d'enregistrer le nouveau pseudo.");
}

export async function createOverlayConfig(
    { accessToken }: AuthHeaders,
    payload: { username: string; guildId: string },
): Promise<{ token: string }> {
    const response = await authFetch('/api/config/create', accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return ensureJsonResponse(response, 'Une erreur est survenue lors de la création.');
}

export async function deleteOverlayConfig({ accessToken }: AuthHeaders, token: string): Promise<{ success: boolean }> {
    const response = await authFetch('/api/config/delete', accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
    return ensureJsonResponse(response, 'Une erreur est survenue lors de la suppression.');
}

export async function adminDeleteOverlayConfig(
    { accessToken }: AuthHeaders,
    payload: { guildId: string; username: string },
): Promise<{ success: boolean }> {
    const response = await authFetch('/api/config/admin/delete', accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return ensureJsonResponse(response, 'Une erreur est survenue lors de la suppression.');
}

export async function regenerateOverlayToken(
    { accessToken }: AuthHeaders,
    token: string,
): Promise<RegenerateOverlayTokenResponse> {
    const response = await authFetch('/api/config/regenerate', accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
    return ensureJsonResponse(response, 'Une erreur est survenue lors de la régénération.');
}

export async function saveGuildSettings(
    { accessToken }: AuthHeaders,
    payload: { guildId: string; requiredRoleId: string | null; maxOverlaysPerUser: number },
): Promise<{ success: boolean }> {
    const response = await authFetch('/api/guild/settings/save', accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return ensureJsonResponse(response, 'Impossible de sauvegarder les paramètres du serveur.');
}

export type { DiscordRole, GuildSettingsRow, OverlayConfigRow };
