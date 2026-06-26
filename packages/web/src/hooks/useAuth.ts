import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setAuthLoading(false);
    }, []);

    useEffect(() => {
        void refreshSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, nextSession: Session | null) => {
            setSession(nextSession);
            setUser(nextSession?.user ?? null);
            setAuthLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [refreshSession]);

    return { session, user, authLoading, refreshSession };
}
