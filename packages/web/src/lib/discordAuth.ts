const PROVIDER_TOKEN_KEY_PREFIX = 'livechat_discord_provider_token';

function storageKey(userId: string): string {
    return `${PROVIDER_TOKEN_KEY_PREFIX}:${userId}`;
}

export function persistDiscordProviderToken(userId: string, providerToken: string): void {
    try {
        sessionStorage.setItem(storageKey(userId), providerToken);
    } catch (error) {
        console.warn('Failed to persist Discord provider token', error);
    }
}

export function getPersistedDiscordProviderToken(userId: string): string | null {
    try {
        return sessionStorage.getItem(storageKey(userId));
    } catch {
        return null;
    }
}

export function clearDiscordProviderToken(userId?: string): void {
    try {
        if (userId) {
            sessionStorage.removeItem(storageKey(userId));
            return;
        }

        for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(`${PROVIDER_TOKEN_KEY_PREFIX}:`)) {
                sessionStorage.removeItem(key);
            }
        }
    } catch (error) {
        console.warn('Failed to clear Discord provider token', error);
    }
}
