import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Logger } from './Logger';

export interface OverlayConfigRow {
    guild_id: string;
    username: string;
    token: string;
    updated_at?: string;
}

export class SupabaseService {
    private static client: SupabaseClient | null = null;

    private static getClient(): SupabaseClient {
        if (!this.client) {
            const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

            if (!url || !serviceKey) {
                Logger.error('SupabaseService', 'SUPABASE_URL (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables');
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
    }

    public static async getOverlayConfigByGuild(guildId: string): Promise<OverlayConfigRow | null> {
        try {
            const supabase = this.getClient();
            const { data, error } = await supabase
                .from('overlay_configs')
                .select('*')
                .eq('guild_id', guildId)
                .maybeSingle();

            if (error) {
                Logger.error('SupabaseService', `Error fetching config for guild ${guildId}`, error);
                return null;
            }

            return data as OverlayConfigRow;
        } catch (err) {
            Logger.error('SupabaseService', `Unexpected error fetching config for guild ${guildId}`, err);
            return null;
        }
    }

    public static async getOverlayConfigByToken(token: string): Promise<OverlayConfigRow | null> {
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
    }

    public static async saveOverlayConfig(guildId: string, username: string, token: string): Promise<boolean> {
        try {
            const supabase = this.getClient();
            
            // Delete existing config for this guild first to prevent duplicate rows for the same guild when username changes
            await supabase
                .from('overlay_configs')
                .delete()
                .eq('guild_id', guildId);

            const { error } = await supabase
                .from('overlay_configs')
                .insert({
                    guild_id: guildId,
                    username: username.toLowerCase(),
                    token: token,
                    updated_at: new Date().toISOString(),
                });

            if (error) {
                Logger.error('SupabaseService', `Error saving config for ${username}:${guildId}`, error);
                return false;
            }

            return true;
        } catch (err) {
            Logger.error('SupabaseService', `Unexpected error saving config for ${username}:${guildId}`, err);
            return false;
        }
    }

    public static async deleteOverlayConfig(guildId: string): Promise<boolean> {
        try {
            const supabase = this.getClient();
            const { error } = await supabase
                .from('overlay_configs')
                .delete()
                .eq('guild_id', guildId);

            if (error) {
                Logger.error('SupabaseService', `Error deleting config for guild ${guildId}`, error);
                return false;
            }

            return true;
        } catch (err) {
            Logger.error('SupabaseService', `Unexpected error deleting config for guild ${guildId}`, err);
            return false;
        }
    }
}
