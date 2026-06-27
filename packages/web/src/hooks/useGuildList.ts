import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DiscordGuild } from '@livechat/types';
import { fetchDiscordGuilds, fetchGuildBotStatus } from '../api/configApi';
import {
    clearDiscordProviderToken,
    getPersistedDiscordProviderToken,
    persistDiscordProviderToken,
} from '../lib/discordAuth';
import { isGuildAdmin } from '../lib/discord';
import { chunkArray, getErrorMessage } from '../lib/errors';

interface UseGuildListResult {
    guilds: DiscordGuild[];
    fetchingGuilds: boolean;
    isSessionExpired: boolean;
    loadGuilds: (force: boolean) => Promise<void>;
}

interface UseGuildListOptions {
    session: Session | null;
    onError: (message: string | null) => void;
}

export function useGuildList({ session, onError }: UseGuildListOptions): UseGuildListResult {
    const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
    const [fetchingGuilds, setFetchingGuilds] = useState(false);
    const [isSessionExpired, setIsSessionExpired] = useState(false);

    const lastFetchedToken = useRef<string | null>(null);
    const fetchInProgressToken = useRef<string | null>(null);

    const loadGuilds = useCallback(
        async (force: boolean) => {
            if (!session?.user) return;

            const userId = session.user.id;
            const providerToken =
                session.provider_token ?? getPersistedDiscordProviderToken(userId);
            if (!providerToken) {
                console.warn('No Discord provider token found in session or storage.');
                setIsSessionExpired(true);
                return;
            }

            if (session.provider_token) {
                persistDiscordProviderToken(userId, session.provider_token);
            }

            setIsSessionExpired(false);

            if (
                !force &&
                (lastFetchedToken.current === providerToken || fetchInProgressToken.current === providerToken)
            ) {
                return;
            }

            fetchInProgressToken.current = providerToken;
            setFetchingGuilds(true);
            onError(null);

            try {
                let userGuilds: DiscordGuild[];
                try {
                    userGuilds = await fetchDiscordGuilds(providerToken);
                } catch (error) {
                    if (error instanceof Error && error.message === 'DISCORD_PROVIDER_TOKEN_EXPIRED') {
                        clearDiscordProviderToken(userId);
                        setIsSessionExpired(true);
                        return;
                    }
                    throw error;
                }
                const guildChunks = chunkArray(userGuilds, 80);
                const botPresenceMap: Record<string, { hasBot: boolean; overlayCount: number }> = {};

                await Promise.all(
                    guildChunks.map(async (chunk) => {
                        try {
                            const chunkResults = await fetchGuildBotStatus(
                                session.access_token,
                                chunk.map((guild) => guild.id),
                            );
                            Object.assign(botPresenceMap, chunkResults);
                        } catch (error) {
                            console.error('Failed to batch check guilds', error);
                        }
                    }),
                );

                const checkedGuilds = userGuilds
                    .map((guild) => {
                        const status = botPresenceMap[guild.id] || { hasBot: false, overlayCount: 0 };
                        return {
                            ...guild,
                            hasBot: status.hasBot,
                            overlayCount: status.overlayCount,
                        };
                    })
                    .filter((guild) => isGuildAdmin(guild) || guild.hasBot);

                checkedGuilds.sort((a, b) => {
                    if (a.hasBot && !b.hasBot) return -1;
                    if (!a.hasBot && b.hasBot) return 1;
                    return a.name.localeCompare(b.name);
                });

                lastFetchedToken.current = providerToken;
                setGuilds(checkedGuilds);
            } catch (error: unknown) {
                console.error(error);
                onError(getErrorMessage(error, 'Erreur lors du chargement de vos serveurs.'));
                lastFetchedToken.current = null;
            } finally {
                fetchInProgressToken.current = null;
                setFetchingGuilds(false);
            }
        },
        [session, onError],
    );

    const sessionUserId = session?.user?.id ?? null;

    useEffect(() => {
        if (sessionUserId) {
            void loadGuilds(false);
        }
    }, [sessionUserId, loadGuilds]);

    return {
        guilds,
        fetchingGuilds,
        isSessionExpired,
        loadGuilds,
    };
}
