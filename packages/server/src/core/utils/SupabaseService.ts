import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CacheManager } from './CacheManager';
import { Logger } from './Logger';

export interface OverlayConfigRow {
    guild_id: string;
    username: string;
    token: string;
    user_id: string;
    updated_at?: string;
}

export class SupabaseService {
    private static client: SupabaseClient | null = null;

    private static getClient(): SupabaseClient {
        if (!this.client) {
            const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

            if (!url || !serviceKey) {
                Logger.error(
                    'SupabaseService',
                    'SUPABASE_URL (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables',
                );
                throw new Error('Supabase configuration error');
            }

            this.client = createClient(url, serviceKey, {
                auth: {
                    persistSession: false,
                },
            });
            Logger.success('SupabaseService', 'Supabase client successfully initialized');
        }
        return this.client;
    }

    public static async getOverlayConfig(guildId: string, username: string): Promise<OverlayConfigRow | null> {
        const key = `overlay:config:${guildId}:${username.toLowerCase()}`;
        return CacheManager.getOrFetch(
            key,
            async () => {
                try {
                    const supabase = this.getClient();
                    const { data, error } = await supabase
                        .from('overlay_configs')
                        .select('*')
                        .eq('guild_id', guildId)
                        .eq('username', username.toLowerCase())
                        .maybeSingle();

                    if (error) {
                        Logger.error('SupabaseService', `Error fetching config for ${username}:${guildId}`, error);
                        return null;
                    }

                    return data as OverlayConfigRow;
                } catch (err) {
                    Logger.error('SupabaseService', `Unexpected error fetching config for ${username}:${guildId}`, err);
                    return null;
                }
            },
            5 * 60 * 1000,
        );
    }

    public static async getOverlayConfigsByGuildAndUser(guildId: string, userId: string): Promise<OverlayConfigRow[]> {
        const key = `overlay:configs:user:${guildId}:${userId}`;
        return CacheManager.getOrFetch(
            key,
            async () => {
                try {
                    const supabase = this.getClient();
                    const { data, error } = await supabase
                        .from('overlay_configs')
                        .select('*')
                        .eq('guild_id', guildId)
                        .eq('user_id', userId);

                    if (error) {
                        Logger.error(
                            'SupabaseService',
                            `Error fetching configs for guild ${guildId} and user ${userId}`,
                            error,
                        );
                        return [];
                    }

                    return (data as OverlayConfigRow[]) || [];
                } catch (err) {
                    Logger.error(
                        'SupabaseService',
                        `Unexpected error fetching configs for guild ${guildId} and user ${userId}`,
                        err,
                    );
                    return [];
                }
            },
            5 * 60 * 1000,
        );
    }

    public static async getOverlayCountsByGuildsAndUser(
        guildIds: string[],
        userId: string,
    ): Promise<Record<string, number>> {
        try {
            const supabase = this.getClient();
            const { data, error } = await supabase
                .from('overlay_configs')
                .select('guild_id')
                .in('guild_id', guildIds)
                .eq('user_id', userId);

            if (error) {
                Logger.error('SupabaseService', `Error fetching counts for user ${userId}`, error);
                return {};
            }

            const counts: Record<string, number> = {};
            for (const id of guildIds) {
                counts[id] = 0;
            }
            if (data) {
                for (const row of data) {
                    const gId = row.guild_id;
                    counts[gId] = (counts[gId] || 0) + 1;
                }
            }
            return counts;
        } catch (err) {
            Logger.error('SupabaseService', `Unexpected error fetching counts for user ${userId}`, err);
            return {};
        }
    }

    public static async getOverlayConfigsByGuild(guildId: string): Promise<OverlayConfigRow[]> {
        const key = `overlay:configs:guild:${guildId}`;
        return CacheManager.getOrFetch(
            key,
            async () => {
                try {
                    const supabase = this.getClient();
                    const { data, error } = await supabase.from('overlay_configs').select('*').eq('guild_id', guildId);

                    if (error) {
                        Logger.error('SupabaseService', `Error fetching configs for guild ${guildId}`, error);
                        return [];
                    }

                    return (data as OverlayConfigRow[]) || [];
                } catch (err) {
                    Logger.error('SupabaseService', `Unexpected error fetching configs for guild ${guildId}`, err);
                    return [];
                }
            },
            5 * 60 * 1000,
        );
    }

    public static async getOverlayConfigByToken(token: string): Promise<OverlayConfigRow | null> {
        const key = `overlay:token:${token}`;
        return CacheManager.getOrFetch(
            key,
            async () => {
                try {
                    const supabase = this.getClient();
                    const { data, error } = await supabase
                        .from('overlay_configs')
                        .select('*')
                        .eq('token', token)
                        .maybeSingle();

                    if (error) {
                        Logger.error('SupabaseService', `Error fetching config for token ${token}`, error);
                        return null;
                    }

                    return data as OverlayConfigRow;
                } catch (err) {
                    Logger.error('SupabaseService', `Unexpected error fetching config for token ${token}`, err);
                    return null;
                }
            },
            5 * 60 * 1000,
        );
    }

    public static async saveOverlayConfig(
        guildId: string,
        username: string,
        token: string,
        userId?: string,
    ): Promise<boolean> {
        try {
            const supabase = this.getClient();
            const payload: any = {
                guild_id: guildId,
                username: username.toLowerCase(),
                token: token,
                updated_at: new Date().toISOString(),
            };
            if (userId) {
                payload.user_id = userId;
            }
            const { error } = await supabase.from('overlay_configs').upsert(payload);

            if (error) {
                Logger.error('SupabaseService', `Error saving config for ${username}:${guildId}`, error);
                return false;
            }

            // Invalidate cache
            CacheManager.delete(`overlay:config:${guildId}:${username.toLowerCase()}`);
            CacheManager.delete(`overlay:configs:guild:${guildId}`);
            CacheManager.delete(`overlay:token:${token}`);
            if (userId) {
                CacheManager.delete(`overlay:configs:user:${guildId}:${userId}`);
            }

            return true;
        } catch (err) {
            Logger.error('SupabaseService', `Unexpected error saving config for ${username}:${guildId}`, err);
            return false;
        }
    }

    public static async deleteOverlayConfig(token: string): Promise<boolean> {
        try {
            const config = await this.getOverlayConfigByToken(token);

            const supabase = this.getClient();
            const { error } = await supabase.from('overlay_configs').delete().eq('token', token);

            if (error) {
                Logger.error('SupabaseService', `Error deleting config for token ${token}`, error);
                return false;
            }

            // Invalidate cache
            if (config) {
                CacheManager.delete(`overlay:config:${config.guild_id}:${config.username.toLowerCase()}`);
                CacheManager.delete(`overlay:configs:guild:${config.guild_id}`);
                CacheManager.delete(`overlay:token:${token}`);
                if (config.user_id) {
                    CacheManager.delete(`overlay:configs:user:${config.guild_id}:${config.user_id}`);
                }
            }

            return true;
        } catch (err) {
            Logger.error('SupabaseService', `Unexpected error deleting config for token ${token}`, err);
            return false;
        }
    }

    public static async updateOverlayToken(oldToken: string, newToken: string): Promise<boolean> {
        try {
            const config = await this.getOverlayConfigByToken(oldToken);

            const supabase = this.getClient();
            const { error } = await supabase.from('overlay_configs').update({ token: newToken }).eq('token', oldToken);

            if (error) {
                Logger.error('SupabaseService', `Error updating token from ${oldToken} to ${newToken}`, error);
                return false;
            }

            // Invalidate cache
            if (config) {
                CacheManager.delete(`overlay:config:${config.guild_id}:${config.username.toLowerCase()}`);
                CacheManager.delete(`overlay:configs:guild:${config.guild_id}`);
                CacheManager.delete(`overlay:token:${oldToken}`);
                CacheManager.delete(`overlay:token:${newToken}`);
                if (config.user_id) {
                    CacheManager.delete(`overlay:configs:user:${config.guild_id}:${config.user_id}`);
                }
            }

            return true;
        } catch (err) {
            Logger.error('SupabaseService', `Unexpected error updating token from ${oldToken} to ${newToken}`, err);
            return false;
        }
    }

    public static async getGuildSettings(guildId: string): Promise<GuildSettingsRow | null> {
        const key = `guild:settings:${guildId}`;
        return CacheManager.getOrFetch(
            key,
            async () => {
                try {
                    const supabase = this.getClient();
                    const { data, error } = await supabase
                        .from('guild_settings')
                        .select('*')
                        .eq('guild_id', guildId)
                        .maybeSingle();

                    if (error) {
                        Logger.error('SupabaseService', `Error fetching settings for guild ${guildId}`, error);
                        return null;
                    }

                    return data as GuildSettingsRow;
                } catch (err) {
                    Logger.error('SupabaseService', `Unexpected error fetching settings for guild ${guildId}`, err);
                    return null;
                }
            },
            5 * 60 * 1000,
        );
    }

    public static async saveGuildSettings(
        guildId: string,
        requiredRoleId: string | null,
        maxOverlaysPerUser?: number | null,
    ): Promise<boolean> {
        try {
            const supabase = this.getClient();
            const { error } = await supabase.from('guild_settings').upsert({
                guild_id: guildId,
                required_role_id: requiredRoleId,
                max_overlays_per_user: maxOverlaysPerUser !== undefined ? maxOverlaysPerUser : 5,
                updated_at: new Date().toISOString(),
            });

            if (error) {
                Logger.error('SupabaseService', `Error saving settings for guild ${guildId}`, error);
                return false;
            }

            // Invalidate cache
            CacheManager.delete(`guild:settings:${guildId}`);

            return true;
        } catch (err) {
            Logger.error('SupabaseService', `Unexpected error saving settings for guild ${guildId}`, err);
            return false;
        }
    }
}

export interface GuildSettingsRow {
    guild_id: string;
    required_role_id: string | null;
    max_overlays_per_user?: number | null;
    updated_at?: string;
}
