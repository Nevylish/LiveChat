import type {
    ApiErrorResponse,
    ApiSuccessResponse,
    DevCacheClearResponse,
    DevCacheStatsResponse,
    DevGuildsResponse,
    DevLogEntry,
    DevLogsClearResponse,
    DevLogsResponse,
    DevMediaResolveResponse,
    DevMeResponse,
    DevOverviewResponse,
    DevPaginationParams,
    DevSearchOverlaysResponse,
    DevStreamersResponse,
} from '@livechat/types';
import { API_BASE_URL } from '../lib/constants';

export const DEV_LIST_PAGE_SIZE = 20;

async function authFetch(path: string, accessToken: string, init?: RequestInit): Promise<Response> {
    return fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
            Authorization: `Bearer ${accessToken}`,
        },
    });
}

async function ensureOk<T>(response: Response, fallbackError = 'Requête échouée.'): Promise<T> {
    const data = (await response.json().catch(() => ({}))) as T & ApiErrorResponse;
    if (!response.ok) {
        throw new Error(data.error || fallbackError);
    }
    return data;
}

function appendPagination(query: URLSearchParams, pagination?: DevPaginationParams): void {
    if (pagination?.page) query.set('page', String(pagination.page));
    if (pagination?.pageSize) query.set('pageSize', String(pagination.pageSize));
}

export async function fetchDevMe(accessToken: string): Promise<DevMeResponse> {
    const response = await authFetch('/api/dev/me', accessToken);
    return ensureOk<DevMeResponse>(response);
}

export async function fetchDevOverview(accessToken: string): Promise<DevOverviewResponse> {
    const response = await authFetch('/api/dev/overview', accessToken);
    return ensureOk<DevOverviewResponse>(response);
}

export async function fetchDevStreamers(
    accessToken: string,
    pagination?: DevPaginationParams,
): Promise<DevStreamersResponse> {
    const query = new URLSearchParams();
    appendPagination(query, { pageSize: DEV_LIST_PAGE_SIZE, ...pagination });
    const response = await authFetch(`/api/dev/streamers?${query.toString()}`, accessToken);
    return ensureOk<DevStreamersResponse>(response);
}

export async function fetchDevGuilds(
    accessToken: string,
    pagination?: DevPaginationParams,
): Promise<DevGuildsResponse> {
    const query = new URLSearchParams();
    appendPagination(query, { pageSize: DEV_LIST_PAGE_SIZE, ...pagination });
    const response = await authFetch(`/api/dev/guilds?${query.toString()}`, accessToken);
    return ensureOk<DevGuildsResponse>(response);
}

export interface DevOverlaySearchParams {
    guildId?: string;
    username?: string;
    token?: string;
    userId?: string;
}

export async function searchDevOverlays(
    accessToken: string,
    params: DevOverlaySearchParams,
    pagination?: DevPaginationParams,
): Promise<DevSearchOverlaysResponse> {
    const query = new URLSearchParams();
    if (params.guildId) query.set('guildId', params.guildId);
    if (params.username) query.set('username', params.username);
    if (params.token) query.set('token', params.token);
    if (params.userId) query.set('userId', params.userId);
    appendPagination(query, { pageSize: DEV_LIST_PAGE_SIZE, ...pagination });

    const response = await authFetch(`/api/dev/overlays?${query.toString()}`, accessToken);
    return ensureOk<DevSearchOverlaysResponse>(response);
}

export async function deleteDevOverlay(accessToken: string, token: string): Promise<ApiSuccessResponse> {
    const response = await authFetch('/api/dev/overlays', accessToken, {
        method: 'DELETE',
        body: JSON.stringify({ token }),
    });
    return ensureOk<ApiSuccessResponse>(response);
}

export async function resolveDevMediaUrl(accessToken: string, url: string): Promise<DevMediaResolveResponse> {
    const response = await authFetch('/api/dev/media/resolve', accessToken, {
        method: 'POST',
        body: JSON.stringify({ url }),
    });
    return ensureOk<DevMediaResolveResponse>(response);
}

export async function fetchDevCacheStats(accessToken: string): Promise<DevCacheStatsResponse> {
    const response = await authFetch('/api/dev/cache', accessToken);
    return ensureOk<DevCacheStatsResponse>(response);
}

export async function clearDevCache(accessToken: string): Promise<DevCacheClearResponse> {
    const response = await authFetch('/api/dev/cache/clear', accessToken, {
        method: 'POST',
    });
    return ensureOk<DevCacheClearResponse>(response);
}

export async function fetchDevLogs(accessToken: string, after = 0): Promise<DevLogsResponse> {
    const query = new URLSearchParams();
    if (after > 0) query.set('after', String(after));
    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    const response = await authFetch(`/api/dev/logs${suffix}`, accessToken);
    return ensureOk<DevLogsResponse>(response);
}

export async function clearDevLogs(accessToken: string): Promise<DevLogsClearResponse> {
    const response = await authFetch('/api/dev/logs/clear', accessToken, {
        method: 'POST',
    });
    return ensureOk<DevLogsClearResponse>(response);
}

export function connectDevLogsStream(
    accessToken: string,
    options: {
        after?: number;
        onLog: (entry: DevLogEntry) => void;
        onDisconnect?: () => void;
        onError?: (error: Error) => void;
    },
): () => void {
    const controller = new AbortController();
    const after = options.after ?? 0;

    void (async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dev/logs/stream?after=${after}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                signal: controller.signal,
            });

            if (!response.ok) {
                const data = (await response.json().catch(() => ({}))) as ApiErrorResponse;
                throw new Error(data.error || 'Connexion au flux de logs échouée.');
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Flux de logs indisponible.');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split('\n\n');
                buffer = parts.pop() ?? '';

                for (const part of parts) {
                    const line = part
                        .split('\n')
                        .find((l) => l.startsWith('data: '));
                    if (!line) continue;
                    const entry = JSON.parse(line.slice(6)) as DevLogEntry;
                    options.onLog(entry);
                }
            }

            options.onDisconnect?.();
        } catch (err) {
            if (controller.signal.aborted) return;
            const error = err instanceof Error ? err : new Error('Connexion au flux de logs échouée.');
            options.onError?.(error);
        }
    })();

    return () => controller.abort();
}
