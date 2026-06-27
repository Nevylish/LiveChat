import type { AuthSession } from '@livechat/types';
import { useCallback, useEffect, useState } from 'react';
import { clearAuthSession, loadAuthSession } from '../lib/authSession';
import { clearDiscordProviderToken, persistDiscordProviderToken } from '../lib/discordAuth';

interface AuthState {
    session: AuthSession | null;
    user: AuthSession['user'] | null;
    authLoading: boolean;
    refreshSession: () => Promise<void>;
    signOut: () => void;
}

function syncProviderToken(session: AuthSession | null): void {
    if (!session?.user?.id) {
        clearDiscordProviderToken();
        return;
    }

    if (session.provider_token) {
        persistDiscordProviderToken(session.user.id, session.provider_token);
    }
}

export function useAuth(): AuthState {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const refreshSession = useCallback(async () => {
        const currentSession = loadAuthSession();
        syncProviderToken(currentSession);
        setSession(currentSession);
        setAuthLoading(false);
    }, []);

    const signOut = useCallback(() => {
        const userId = session?.user?.id;
        clearAuthSession();
        clearDiscordProviderToken(userId);
        setSession(null);
    }, [session?.user?.id]);

    useEffect(() => {
        void refreshSession();

        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type === 'livechat-auth-success') {
                void refreshSession();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [refreshSession]);

    return {
        session,
        user: session?.user ?? null,
        authLoading,
        refreshSession,
        signOut,
    };
}
