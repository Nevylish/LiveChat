import crypto = require('crypto');
import { SupabaseService } from '../utils/SupabaseService';
import { Logger } from '../utils/Logger';

export namespace OverlayTokenService {
    export function generateLegacyToken(username: string, guildId: string): string {
        return crypto.createHmac('sha256', process.env.OVERLAY_SECRET!).update(`${username}:${guildId}`).digest('hex');
    }

    export function isValidLegacyToken(username: string, guildId: string, token: string): boolean {
        const expected = generateLegacyToken(username, guildId);
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
    }

    export async function resolveRegisterIdentity(data: {
        username?: string;
        guildId?: string;
        token?: string;
    }): Promise<{ username?: string; guildId?: string; error?: string }> {
        let username = data.username;
        let guildId = data.guildId;
        const token = data.token;

        if (!token) {
            if (username) {
                Logger.warn('LiveChatServer', `Legacy connection without token for ${username}`, {
                    username,
                    guildId,
                });
                return { username, guildId };
            }
            return { error: 'Jeton de connexion ou identifiants manquants.' };
        }

        try {
            const config = await SupabaseService.getOverlayConfigByToken(token);
            if (config) {
                return { username: config.username, guildId: config.guild_id };
            }

            if (username && guildId) {
                if (!isValidLegacyToken(username, guildId, token)) {
                    return { error: "Le lien de l'overlay est invalide. Régénérez-le depuis le site." };
                }
                return { username, guildId };
            }

            return { error: 'Jeton invalide ou configuration inexistante.' };
        } catch (err) {
            Logger.error('LiveChatServer', 'Error validating token via Supabase', err);

            if (username && guildId) {
                if (!isValidLegacyToken(username, guildId, token)) {
                    return { error: "Le lien de l'overlay est invalide. Régénérez-le depuis le site." };
                }
                return { username, guildId };
            }

            return { error: "Erreur lors de la validation du jeton d'overlay." };
        }
    }
}
