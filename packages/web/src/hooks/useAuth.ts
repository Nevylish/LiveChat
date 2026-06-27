import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { clearDiscordProviderToken, persistDiscordProviderToken } from '../lib/discordAuth';
import { supabase } from '../lib/supabase';

function syncDiscordProviderToken(event: AuthChangeEvent, nextSession: Session | null): void {
    if (event === 'SIGNED_OUT' || !nextSession?.user) {
        clearDiscordProviderToken(nextSession?.user?.id);
        return;
    }

    if (nextSession.provider_token) {
        persistDiscordProviderToken(nextSession.user.id, nextSession.provider_token);
    }
}

interface AuthState {
    session: Session | null;
    user: User | null;
    authLoading: boolean;
    refreshSession: () => Promise<void>;
}

export function useAuth(): AuthState {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const refreshSession = useCallback(async () => {
        const {
            data: { session: currentSession },
        } = await supabase.auth.getSession();
        if (currentSession?.provider_token && currentSession.user) {
            persistDiscordProviderToken(currentSession.user.id, currentSession.provider_token);
        }
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setAuthLoading(false);
    }, []);

    useEffect(() => {
        void refreshSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, nextSession: Session | null) => {
            syncDiscordProviderToken(event, nextSession);
            setSession(nextSession);
            setUser(nextSession?.user ?? null);
            setAuthLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [refreshSession]);

    return { session, user, authLoading, refreshSession };
}
