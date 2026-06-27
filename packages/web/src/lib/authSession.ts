import type { AuthSession, AuthUser } from '@livechat/types';

const SESSION_STORAGE_KEY = 'livechat_auth_session';

export function loadAuthSession(): AuthSession | null {
    try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as AuthSession;
        if (!parsed?.access_token || !parsed?.user?.id) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function saveAuthSession(session: AuthSession): void {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getAuthUser(session: AuthSession | null): AuthUser | null {
    return session?.user ?? null;
}
