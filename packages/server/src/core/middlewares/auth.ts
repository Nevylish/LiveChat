import { Request, Response, NextFunction } from 'express';
import DiscordClient from '../DiscordClient';
import { SupabaseService, OverlayConfigRow } from '../utils/SupabaseService';

declare global {
    namespace Express {
        interface Request {
            overlayConfig?: OverlayConfigRow;
            userId?: string;
        }
    }
}

/**
 * Checks if a Discord user is an administrator or has ManageGuild permission.
 */
export async function checkAdminAccess(discordClient: DiscordClient, guildId: string, userId: string): Promise<boolean> {
    try {
        const guild = discordClient.guilds.cache.get(guildId) || await discordClient.guilds.fetch(guildId).catch(() => null);
        if (!guild) return false;

        if (guild.ownerId === userId) return true;

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) return false;

        return member.permissions.has('Administrator') || member.permissions.has('ManageGuild');
    } catch (e) {
        console.error('Error checking admin status', e);
        return false;
    }
}

/**
 * Checks if a user is allowed to use LiveChat on a specific guild.
 */
export async function checkGuildAccess(
    discordClient: DiscordClient,
    guildId: string,
    userId: string | null | undefined
): Promise<boolean> {
    try {
        if (!userId) return true; // Backward compatibility for legacy configurations without user_id

        const guild = discordClient.guilds.cache.get(guildId) || await discordClient.guilds.fetch(guildId).catch(() => null);
        if (!guild) return false;

        if (guild.ownerId === userId) return true;

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) return false;

        if (member.permissions.has('Administrator') || member.permissions.has('ManageGuild')) return true;

        const settings = await SupabaseService.getGuildSettings(guildId);
        if (!settings || !settings.required_role_id) {
            return true;
        }

        return member.roles.cache.has(settings.required_role_id);
    } catch (e) {
        console.error('Error checking user allowed status', e);
        return false;
    }
}

/**
 * Factory to generate auth middlewares with the DiscordClient dependency injected.
 */
export function createAuthMiddlewares(discordClient: DiscordClient) {
    return {
        /**
         * Middleware to authenticate Supabase JWT token and extract Discord userId.
         */
        requireAuth: (req: Request, res: Response, next: NextFunction): void => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ error: 'Missing or malformed Authorization header' });
                return;
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                res.status(401).json({ error: 'Missing token in Authorization header' });
                return;
            }

            SupabaseService.getAnonClient().auth.getUser(token)
                .then(({ data, error }) => {
                    if (error || !data.user) {
                        res.status(401).json({ error: 'Session invalide ou expirée.' });
                        return;
                    }

                    const userId = data.user.user_metadata?.provider_id || data.user.user_metadata?.sub;
                    if (!userId) {
                        res.status(401).json({ error: 'Impossible de récupérer votre identifiant Discord.' });
                        return;
                    }

                    req.userId = userId;
                    next();
                })
                .catch((err) => {
                    console.error('Error in requireAuth middleware', err);
                    res.status(500).json({ error: 'Internal server error during authentication' });
                });
        },

        /**
         * Middleware to check if the user is an admin of the guild.
         */
        requireAdmin: (req: Request, res: Response, next: NextFunction): void => {
            const guildId = (req.query.guildId || req.body.guildId) as string;
            const userId = req.userId;

            if (!guildId) {
                res.status(400).json({ error: 'Missing guildId' });
                return;
            }
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized: User not authenticated' });
                return;
            }

            checkAdminAccess(discordClient, guildId, userId)
                .then((isAdmin) => {
                    if (isAdmin) {
                        next();
                    } else {
                        res.status(403).json({ error: 'Vous devez être administrateur du serveur pour effectuer cette action.' });
                    }
                })
                .catch(() => {
                    res.status(500).json({ error: 'Internal server error checking permissions' });
                });
        },

        /**
         * Middleware to check if the user is allowed to use LiveChat on the guild.
         */
        requireGuildAccess: (req: Request, res: Response, next: NextFunction): void => {
            const guildId = (req.query.guildId || req.body.guildId || req.overlayConfig?.guild_id) as string;
            const userId = req.userId;

            if (!guildId) {
                res.status(400).json({ error: 'Missing guildId' });
                return;
            }
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized: User not authenticated' });
                return;
            }

            checkGuildAccess(discordClient, guildId, userId)
                .then((allowed) => {
                    if (allowed) {
                        next();
                    } else {
                        res.status(403).json({ error: "Vous n'êtes pas autorisé à utiliser LiveChat sur ce serveur. Un rôle obligatoire est requis." });
                    }
                })
                .catch(() => {
                    res.status(500).json({ error: 'Internal server error checking permissions' });
                });
        },

        /**
         * Middleware to verify if the user is the creator of the target overlay config.
         * Attaches overlayConfig to req for reuse in subsequent middlewares or routes.
         */
        requireOverlayOwnership: (req: Request, res: Response, next: NextFunction): void => {
            const token = (req.body.token || req.query.token) as string;
            const userId = req.userId;

            if (!token) {
                res.status(400).json({ error: 'Missing token' });
                return;
            }
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized: User not authenticated' });
                return;
            }

            SupabaseService.getOverlayConfigByToken(token)
                .then((config) => {
                    if (!config) {
                        res.status(404).json({ error: 'Overlay introuvable.' });
                        return;
                    }

                    if (config.user_id !== userId) {
                        const action = req.path.includes('delete') ? 'supprimer' : 'modifier';
                        res.status(403).json({ error: `Vous ne possédez pas les droits requis pour ${action} cet overlay.` });
                        return;
                    }

                    req.overlayConfig = config;
                    next();
                })
                .catch(() => {
                    res.status(500).json({ error: 'Internal server error validating overlay ownership' });
                });
        }
    };
}
